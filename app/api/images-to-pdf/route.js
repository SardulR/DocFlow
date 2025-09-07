import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import fileType from "file-type"; // You'll need to install this library: npm install file-type

export async function POST(req) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("images");

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: "No images uploaded." },
        { status: 400 }
      );
    }

    const pdfDoc = await PDFDocument.create();

    for (const file of files) {
      const imageBuffer = await file.arrayBuffer();
      const imageBytes = new Uint8Array(imageBuffer);

      // Validate the file type by its bytes, not just the file.type property
      const type = await fileType.fromBuffer(imageBytes);

      if (!type || (type.mime !== "image/jpeg" && type.mime !== "image/png")) {
        console.warn(
          `Skipping unsupported file: ${file.name} with MIME type ${
            type ? type.mime : "unknown"
          }`
        );
        continue;
      }

      let embeddedImage;

      if (type.mime === "image/jpeg") {
        embeddedImage = await pdfDoc.embedJpg(imageBytes);
      } else if (type.mime === "image/png") {
        embeddedImage = await pdfDoc.embedPng(imageBytes);
      }

      // If the embedding fails for some reason (e.g., corrupt file), we can catch it here
      if (!embeddedImage) {
        console.error(`Failed to embed image: ${file.name}`);
        continue;
      }

      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const { width: imgWidth, height: imgHeight } = embeddedImage;

      // Calculate the aspect ratio to fit the image on the page
      const scale = Math.min(width / imgWidth, height / imgHeight);
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;

      // Draw the image centered on the page
      page.drawImage(embeddedImage, {
        x: (width - scaledWidth) / 2,
        y: (height - scaledHeight) / 2,
        width: scaledWidth,
        height: scaledHeight,
      });
    }

    // Check if any pages were added before saving
    if (pdfDoc.getPages().length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid images were converted to PDF." },
        { status: 400 }
      );
    }

    const pdfBytes = await pdfDoc.save();

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", `attachment; filename="converted.pdf"`);

    return new Response(pdfBytes, { headers });
  } catch (error) {
    console.error("Error converting images to PDF:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "Error converting images to PDF. Please ensure your images are valid.",
      },
      { status: 500 }
    );
  }
}
