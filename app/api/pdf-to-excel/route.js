import pdf from "pdf-parse";
import ExcelJS from "exceljs";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const pdfBuffer = Buffer.from(
      await request.blob().then((b) => b.arrayBuffer())
    );

    // Check if the buffer is empty
    if (pdfBuffer.length === 0) {
      return NextResponse.json(
        { error: "No file provided in the request body." },
        { status: 400 }
      );
    }

    // Use the buffer directly with pdf-parse
    const pdfData = await pdf(pdfBuffer);
    const text = pdfData.text;

    // Create an Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Extracted Text");

    const lines = text.split("\n");
    lines.forEach((line) => {
      const cleanedLine = line.trim();
      if (cleanedLine) {
        worksheet.addRow([cleanedLine]);
      }
    });

    // Generate the Excel file as a buffer
    const excelBuffer = await workbook.xlsx.writeBuffer();

    // Return the Excel file as a response
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="converted-${Date.now()}.xlsx"`,
      },
    });
  } catch (err) {
    console.error("Error processing PDF:", err);
    return NextResponse.json(
      { error: "Failed to process PDF file." },
      { status: 500 }
    );
  }
}
