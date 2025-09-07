import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");
    const method = formData.get("method");
    const outputFormat = (formData.get("outputFormat") || "png").toLowerCase();
    const quality = formData.get("quality")
      ? parseInt(formData.get("quality"), 10)
      : 80;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let image = sharp(buffer);

    // Get image dimensions
    const metadata = await image.metadata();

    // Resize by pixels
    if (method === "pixels") {
      const width = formData.get("width")
        ? parseInt(formData.get("width"), 10)
        : null;
      const height = formData.get("height")
        ? parseInt(formData.get("height"), 10)
        : null;

      if ((width !== null && width <= 0) || (height !== null && height <= 0)) {
        return NextResponse.json(
          { error: "Invalid width or height." },
          { status: 400 }
        );
      }

      image = image.resize(width, height);

      // Resize by percentage
    } else if (method === "percentage") {
      const percentage = parseInt(formData.get("percentage"), 10);

      if (isNaN(percentage) || percentage <= 0) {
        return NextResponse.json(
          { error: "Invalid percentage." },
          { status: 400 }
        );
      }

      const newWidth = Math.round(metadata.width * (percentage / 100));
      const newHeight = Math.round(metadata.height * (percentage / 100));
      image = image.resize(newWidth, newHeight);
    } else {
      return NextResponse.json(
        { error: "Invalid resizing method." },
        { status: 400 }
      );
    }

    // Set output format & quality
    if (outputFormat === "jpeg" || outputFormat === "jpg") {
      image = image.jpeg({ quality });
    } else if (outputFormat === "png") {
      image = image.png();
    } else if (outputFormat === "webp") {
      image = image.webp({ quality });
    } else {
      return NextResponse.json(
        { error: "Unsupported output format." },
        { status: 400 }
      );
    }

    const resizedBuffer = await image.toBuffer();
    const originalFileName = file.name.split(".")[0];

    return new NextResponse(resizedBuffer, {
      status: 200,
      headers: {
        "Content-Type": `image/${outputFormat}`,
        "Content-Disposition": `attachment; filename="resized-${originalFileName}.${outputFormat}"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to resize image." },
      { status: 500 }
    );
  }
}
