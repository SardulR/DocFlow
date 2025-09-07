import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export const runtime = "nodejs";

// Helper function to parse the new page order string
function parsePageOrder(orderString) {
  const pages = orderString.split(",").map((part) => Number(part.trim()));
  if (pages.some(isNaN) || pages.some((num) => num <= 0)) {
    throw new Error(
      "Invalid page order format. Please use comma-separated numbers (e.g., 3, 1, 2)."
    );
  }
  return pages;
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const pdfFile = formData.get("pdf");
    const newOrderStr = formData.get("newOrder");

    if (!pdfFile || !newOrderStr) {
      return NextResponse.json(
        { error: "PDF file and new page order are required." },
        { status: 400 }
      );
    }

    const newOrder = parsePageOrder(newOrderStr);
    const pdfBytes = Buffer.from(await pdfFile.arrayBuffer());

    const originalPdfDoc = await PDFDocument.load(pdfBytes);
    const numOriginalPages = originalPdfDoc.getPages().length;

    // Validate that all pages exist in the new order and there are no duplicates
    const originalPagesSet = new Set(
      Array.from({ length: numOriginalPages }, (_, i) => i + 1)
    );
    const newOrderSet = new Set(newOrder);

    if (
      newOrder.length !== numOriginalPages ||
      newOrderSet.size !== numOriginalPages ||
      !Array.from(newOrderSet).every((page) => originalPagesSet.has(page))
    ) {
      return NextResponse.json(
        {
          error:
            "The page order is invalid. Please ensure all original pages are listed exactly once.",
        },
        { status: 400 }
      );
    }

    const newPdfDoc = await PDFDocument.create();

    // Copy pages into the new document in the specified order
    for (const pageNum of newOrder) {
      const pageIndex = pageNum - 1;
      const [copiedPage] = await newPdfDoc.copyPages(originalPdfDoc, [
        pageIndex,
      ]);
      newPdfDoc.addPage(copiedPage);
    }

    const reorganizedPdfBytes = await newPdfDoc.save();

    return new Response(reorganizedPdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=organized.pdf",
      },
    });
  } catch (err) {
    console.error(err);
    const errorMessage = err.message || "Failed to organize PDF pages.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
