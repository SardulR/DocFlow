// app/api/compress-image/route.js
import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");
    const mode = formData.get("mode") || "percentage";
    let quality = parseInt(formData.get("quality")) || 80;
    const targetSizeKB = parseInt(formData.get("targetSize")) || null;

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    let image = sharp(inputBuffer);

    const metadata = await image.metadata();
    let outputBuffer;
    let mimeType = `image/${metadata.format}`;

    // Function to compress with target file size
    const compressToTarget = async (img, targetKB) => {
      let q = 100;
      let buffer = await img.toBuffer();
      while (buffer.length / 1024 > targetKB && q > 10) {
        q -= 5;
        if (metadata.format === "jpeg" || metadata.format === "jpg") {
          buffer = await img.jpeg({ quality: q, mozjpeg: true }).toBuffer();
        } else if (metadata.format === "png") {
          buffer = await img
            .png({ compressionLevel: Math.round((9 * (100 - q)) / 100) })
            .toBuffer();
        } else if (metadata.format === "webp") {
          buffer = await img.webp({ quality: q }).toBuffer();
        } else {
          throw new Error(
            "Unsupported image format for target size compression"
          );
        }
      }
      return buffer;
    };

    if (mode === "percentage") {
      if (metadata.format === "jpeg" || metadata.format === "jpg") {
        outputBuffer = await image.jpeg({ quality, mozjpeg: true }).toBuffer();
      } else if (metadata.format === "png") {
        outputBuffer = await image
          .png({ compressionLevel: 9, quality })
          .toBuffer();
      } else if (metadata.format === "webp") {
        outputBuffer = await image.webp({ quality }).toBuffer();
      } else {
        return NextResponse.json(
          {
            error:
              "Unsupported image format. Only JPEG, PNG, WebP are supported.",
          },
          { status: 400 }
        );
      }
    } else if (mode === "filesize" && targetSizeKB) {
      outputBuffer = await compressToTarget(image, targetSizeKB);
    } else {
      return NextResponse.json(
        { error: "Invalid compression parameters" },
        { status: 400 }
      );
    }

    return new Response(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename=compressed.${metadata.format}`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Failed to compress image" },
      { status: 500 }
    );
  }
}
