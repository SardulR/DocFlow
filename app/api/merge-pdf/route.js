import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const pdfFiles = formData.getAll("pdfs");

    if (!pdfFiles || pdfFiles.length < 2) {
      return NextResponse.json(
        { error: "Please upload at least 2 PDF files" },
        { status: 400 }
      );
    }

    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    for (const pdfFile of pdfFiles) {
      try {
        // Convert file to array buffer
        const arrayBuffer = await pdfFile.arrayBuffer();

        // Load the PDF document
        const pdf = await PDFDocument.load(arrayBuffer);

        // Copy all pages
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
      } catch (error) {
        console.error("Error processing file:", pdfFile.name, error);
        return NextResponse.json(
          { error: `Invalid PDF file: ${pdfFile.name}` },
          { status: 400 }
        );
      }
    }

    // Save the merged PDF
    const mergedPdfBytes = await mergedPdf.save();

    // Create response with PDF
    return new NextResponse(mergedPdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="merged-document.pdf"',
      },
    });
  } catch (error) {
    console.error("Merge error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Important: Configure Next.js to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};
