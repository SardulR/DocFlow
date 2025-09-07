import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const excelFile = formData.get("excel");

    if (!excelFile) {
      return NextResponse.json(
        { error: "No Excel file uploaded" },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await excelFile.arrayBuffer());

    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (
      !jsonData ||
      jsonData.length === 0 ||
      !jsonData[0] ||
      jsonData[0].length === 0
    ) {
      return NextResponse.json(
        { error: "The provided Excel file is empty or has no data." },
        { status: 400 }
      );
    }

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    const fontSize = 10;
    const lineHeight = 18;
    const padding = 20; // Spacing between columns

    // 1. Calculate the required width for each column based on content
    const allColumnWidths = jsonData[0].map((_, colIndex) => {
      let maxWidth = 0;
      for (const row of jsonData) {
        if (row[colIndex]) {
          const textWidth = font.widthOfTextAtSize(
            String(row[colIndex]),
            fontSize
          );
          if (textWidth > maxWidth) {
            maxWidth = textWidth;
          }
        }
      }
      return maxWidth + padding;
    });

    // 2. Determine which columns to display
    const visibleColumns = [];
    let cumulativeWidth = margin;
    for (let i = 0; i < allColumnWidths.length; i++) {
      if (cumulativeWidth + allColumnWidths[i] <= width - margin) {
        visibleColumns.push({ index: i, width: allColumnWidths[i] });
        cumulativeWidth += allColumnWidths[i];
      } else {
        break; // Stop adding columns if they don't fit
      }
    }

    // 3. Pre-calculate the starting X-position for each visible column
    const xPositions = [];
    let currentX = margin;
    visibleColumns.forEach((col) => {
      xPositions.push(currentX);
      currentX += col.width;
    });

    let yPosition = height - 50;

    // 4. Draw the content row by row using fixed column positions
    for (const row of jsonData) {
      if (yPosition < margin) {
        page = pdfDoc.addPage();
        yPosition = height - 50;
      }

      visibleColumns.forEach((col, visibleColIndex) => {
        const cellContent = row[col.index] ? String(row[col.index]) : "";
        page.drawText(cellContent, {
          x: xPositions[visibleColIndex],
          y: yPosition,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0),
        });
      });

      yPosition -= lineHeight;
    }

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=converted.pdf",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to convert Excel to PDF" },
      { status: 500 }
    );
  }
}
