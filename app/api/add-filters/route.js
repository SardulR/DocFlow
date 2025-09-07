import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");

    const brightness = parseFloat(formData.get("brightness")) || 1; // default 1
    const contrast = parseFloat(formData.get("contrast")) || 1; // default 1
    const saturate = parseFloat(formData.get("saturate")) || 1; // default 1

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Convert to Sharp instance
    let image = sharp(inputBuffer);

    // Apply filters using modulate
    image = image
      .modulate({
        brightness, // 1 = original
        saturation: saturate, // 1 = original
        // contrast adjustment using linear
      })
      .linear(contrast, -(128 * (contrast - 1))); // approximate contrast

    const metadata = await image.metadata();
    let outputBuffer;
    let mimeType;

    switch (metadata.format) {
      case "jpeg":
      case "jpg":
        outputBuffer = await image.jpeg({ mozjpeg: true }).toBuffer();
        mimeType = "image/jpeg";
        break;
      case "png":
        outputBuffer = await image.png({ compressionLevel: 9 }).toBuffer();
        mimeType = "image/png";
        break;
      case "webp":
        outputBuffer = await image.webp().toBuffer();
        mimeType = "image/webp";
        break;
      default:
        return NextResponse.json(
          {
            error:
              "Unsupported image format. Only JPEG, PNG, WebP are supported.",
          },
          { status: 400 }
        );
    }

    return new Response(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename=filtered.${metadata.format}`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to apply filters" },
      { status: 500 }
    );
  }
}
