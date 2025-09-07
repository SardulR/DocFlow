import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");
    const format = formData.get("format")?.toString().toLowerCase();

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }

    if (!["png", "jpg", "jpeg", "webp"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid output format" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    let outputBuffer;
    const image = sharp(inputBuffer);

    switch (format) {
      case "png":
        outputBuffer = await image.png().toBuffer();
        break;
      case "jpg":
      case "jpeg":
        outputBuffer = await image.jpeg().toBuffer();
        break;
      case "webp":
        outputBuffer = await image.webp().toBuffer();
        break;
      default:
        return NextResponse.json(
          { error: "Unsupported format" },
          { status: 400 }
        );
    }

    return new Response(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": `image/${format === "jpg" ? "jpeg" : format}`,
        "Content-Disposition": `attachment; filename=converted.${format}`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to convert image" },
      { status: 500 }
    );
  }
}
