import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export const runtime = "nodejs";

// Helper function to parse page numbers and ranges to keep
function parsePagesToKeep(pageString) {
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
    const pagesToKeepStr = formData.get("pagesToKeep");

    if (!pdfFile || !pagesToKeepStr) {
      return NextResponse.json(
        { error: "PDF file and pages to extract are required." },
        { status: 400 }
      );
    }

    const pagesToKeep = parsePagesToKeep(pagesToKeepStr);
    const pdfBytes = Buffer.from(await pdfFile.arrayBuffer());

    const originalPdfDoc = await PDFDocument.load(pdfBytes);
    const newPdfDoc = await PDFDocument.create();

    const originalPageIndices = originalPdfDoc.getPages().map((_, i) => i);
    const indicesToKeep = originalPageIndices.filter((index) =>
      pagesToKeep.has(index + 1)
    );

    if (indicesToKeep.length === 0) {
      return NextResponse.json(
        { error: "No valid pages were selected for extraction." },
        { status: 400 }
      );
    }

    const copiedPages = await newPdfDoc.copyPages(
      originalPdfDoc,
      indicesToKeep
    );
    copiedPages.forEach((page) => newPdfDoc.addPage(page));

    const extractedPdfBytes = await newPdfDoc.save();

    return new Response(extractedPdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=extracted.pdf",
      },
    });
  } catch (err) {
    console.error(err);
    const errorMessage = err.message || "Failed to extract pages from PDF";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
