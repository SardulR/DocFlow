// app/api/pdf-to-images/route.ts
import { NextResponse } from "next/server";
import { fromBuffer } from "pdf2pic";
import JSZip from "jszip";

export const POST = async (req) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Use pdf2pic to convert the PDF buffer to a list of image buffers
    const convert = fromBuffer(pdfBuffer, {
      density: 100, // Image quality (higher is better)
      saveFilename: "page",
      format: "jpg",
      savePath: ".", // No need to save to a file
    });

    const images = await convert.bulk(-1, { responseType: "buffer" });
    const zip = new JSZip();

    // Loop through each image and add it to the zip file
    images.forEach((imageBuffer, index) => {
      // Ensure imageBuffer is a Buffer before adding it
      if (imageBuffer && imageBuffer.buffer) {
        zip.file(`page-${index + 1}.jpg`, imageBuffer.buffer);
      }
    });

    const zipBlob = await zip.generateAsync({ type: "nodebuffer" });

    // Return the zip file as a download
    const headers = new Headers();
    headers.set("Content-Type", "application/zip");
    headers.set(
      "Content-Disposition",
      `attachment; filename="converted-images.zip"`
    );

    return new Response(zipBlob, { headers });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Server error: Failed to process PDF." },
      { status: 500 }
    );
  }
};
