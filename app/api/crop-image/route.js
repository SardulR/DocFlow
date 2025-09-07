import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    const x = parseInt(formData.get("x"), 10);
    const y = parseInt(formData.get("y"), 10);
    const width = parseInt(formData.get("width"), 10);
    const height = parseInt(formData.get("height"), 10);
    const outputFormat = (formData.get("outputFormat") || "png").toLowerCase();

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided." },
        { status: 400 }
      );
    }

    if ([x, y, width, height].some((v) => isNaN(v) || v < 0)) {
      return NextResponse.json(
        { error: "Invalid crop dimensions." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let image = sharp(buffer).extract({ left: x, top: y, width, height });

    // Set output format
    if (outputFormat === "jpeg" || outputFormat === "jpg") {
      image = image.jpeg();
    } else if (outputFormat === "png") {
      image = image.png();
    } else if (outputFormat === "webp") {
      image = image.webp();
    } else {
      return NextResponse.json(
        { error: "Unsupported output format." },
        { status: 400 }
      );
    }

    const croppedBuffer = await image.toBuffer();
    const originalFileName = file.name.split(".")[0];

    return new NextResponse(croppedBuffer, {
      status: 200,
      headers: {
        "Content-Type": `image/${outputFormat}`,
        "Content-Disposition": `attachment; filename="cropped-${originalFileName}.${outputFormat}"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to crop image." },
      { status: 500 }
    );
  }
}
