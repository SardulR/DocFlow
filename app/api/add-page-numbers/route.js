import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf");
    const position = formData.get("position");
    const startPage = parseInt(formData.get("startPage"), 10);
    const pageFormat = formData.get("pageFormat");
    const startNumber = parseInt(formData.get("startNumber"), 10);
    const fontColor = formData.get("fontColor"); // Get the color choice from the frontend

    if (!file) {
      return NextResponse.json(
        { error: "No PDF file provided." },
        { status: 400 }
      );
    }

    if (isNaN(startPage) || startPage < 1) {
      return NextResponse.json(
        { error: "Invalid start page number." },
        { status: 400 }
      );
    }
    if (isNaN(startNumber) || startNumber < 1) {
      return NextResponse.json(
        { error: "Invalid start number." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    const fontSize = 12;
    const margin = 30;

    // Set the text color based on the user's choice
    const textColor = fontColor === "white" ? rgb(1, 1, 1) : rgb(0, 0, 0);

    for (let i = 0; i < totalPages; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      const pageNumber = i + 1;

      if (pageNumber < startPage) {
        continue;
      }

      let text;
      const effectivePageNumber = startNumber + (pageNumber - startPage);

      if (pageFormat === "page_of_total") {
        text = `${effectivePageNumber} of ${
          startNumber + (totalPages - startPage)
        }`;
      } else {
        text = `${effectivePageNumber}`;
      }

      const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
      let x, y;

      if (position.includes("top")) {
        y = height - margin;
      } else {
        y = margin;
      }

      if (position.includes("left")) {
        x = margin;
      } else if (position.includes("right")) {
        x = width - textWidth - margin;
      } else {
        x = width / 2 - textWidth / 2;
      }

      page.drawText(text.toUpperCase(), {
        x,
        y,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });
    }

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="numbered-${file.name}"`,
      },
    });
  } catch (error) {
    console.error("Server-side PDF processing error:", error);
    return NextResponse.json(
      { error: "Failed to add page numbers." },
      { status: 500 }
    );
  }
}
