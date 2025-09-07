// app/api/rotate-flip-image/route.js
import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");
    const rotate = parseInt(formData.get("rotate")) || 0;
    const flipH = formData.get("flipH") === "true";
    const flipV = formData.get("flipV") === "true";

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    let image = sharp(inputBuffer);

    // Apply rotation
    if ([0, 90, 180, 270].includes(rotate)) {
      image = image.rotate(rotate);
    } else {
      return NextResponse.json(
        { error: "Invalid rotation value" },
        { status: 400 }
      );
    }

    // Apply flipping
    if (flipH) image = image.flip(); // vertical flip in Sharp
    if (flipV) image = image.flop(); // horizontal flip in Sharp

    const metadata = await image.metadata();
    let outputBuffer;
    let mimeType;

    // Determine output format based on input
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
        "Content-Disposition": `attachment; filename=rotated-flipped.${metadata.format}`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to rotate/flip image" },
      { status: 500 }
    );
  }
}
