import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export const runtime = "nodejs";

// Helper function to parse page numbers and ranges
function parsePagesToRemove(pageString) {
  const pages = new Set();
  const parts = pageString.split(",").map((part) => part.trim());

  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      if (isNaN(start) || isNaN(end) || start > end) {
        throw new Error("Invalid page range format.");
      }
      for (let i = start; i <= end; i++) {
        pages.add(i);
      }
    } else {
      const pageNum = Number(part);
      if (isNaN(pageNum) || pageNum <= 0) {
        throw new Error("Invalid page number format.");
      }
      pages.add(pageNum);
    }
  }
  return pages;
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const pdfFile = formData.get("pdf");
    const pagesToRemoveStr = formData.get("pagesToRemove");

    if (!pdfFile || !pagesToRemoveStr) {
      return NextResponse.json(
        { error: "PDF file and pages to remove are required." },
        { status: 400 }
      );
    }

    const pagesToRemove = parsePagesToRemove(pagesToRemoveStr);
    const pdfBytes = Buffer.from(await pdfFile.arrayBuffer());

    const originalPdfDoc = await PDFDocument.load(pdfBytes);
    const newPdfDoc = await PDFDocument.create();

    const originalPages = originalPdfDoc.getPages();
    for (let i = 0; i < originalPages.length; i++) {
      const pageNumber = i + 1;
      if (!pagesToRemove.has(pageNumber)) {
        const [copiedPage] = await newPdfDoc.copyPages(originalPdfDoc, [i]);
        newPdfDoc.addPage(copiedPage);
      }
    }

    const modifiedPdfBytes = await newPdfDoc.save();

    return new Response(modifiedPdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=modified.pdf",
      },
    });
  } catch (err) {
    console.error(err);
    const errorMessage = err.message || "Failed to remove pages from PDF";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
