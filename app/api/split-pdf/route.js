import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get("pdf");
    const rangesString = formData.get("ranges");

    if (!pdfFile) {
      return NextResponse.json(
        { error: "Please upload a PDF file" },
        { status: 400 }
      );
    }

    if (!rangesString) {
      return NextResponse.json(
        { error: "No ranges specified" },
        { status: 400 }
      );
    }

    const ranges = JSON.parse(rangesString);
    const validRanges = ranges.filter((range) => range.trim().length > 0);

    if (validRanges.length === 0) {
      return NextResponse.json(
        { error: "Please specify at least one valid page range" },
        { status: 400 }
      );
    }

    // Convert file to array buffer
    const arrayBuffer = await pdfFile.arrayBuffer();

    // Load the source PDF
    const sourcePdf = await PDFDocument.load(arrayBuffer);
    const pageCount = sourcePdf.getPageCount();

    // Create a zip file to hold all the split PDFs
    const zip = new JSZip();

    // Process each range
    for (let i = 0; i < validRanges.length; i++) {
      const range = validRanges[i];
      const pdfDoc = await PDFDocument.create();

      try {
        // Parse the range (support for: single page, page range, comma-separated pages)
        let pageIndices = [];

        if (range.includes("-")) {
          // Handle page ranges like "1-5"
          const [start, end] = range
            .split("-")
            .map((num) => parseInt(num.trim(), 10) - 1);

          if (
            isNaN(start) ||
            isNaN(end) ||
            start < 0 ||
            end >= pageCount ||
            start > end
          ) {
            throw new Error(`Invalid range: ${range}`);
          }

          for (let j = start; j <= end; j++) {
            pageIndices.push(j);
          }
        } else if (range.includes(",")) {
          // Handle comma-separated pages like "1,3,5"
          pageIndices = range.split(",").map((num) => {
            const index = parseInt(num.trim(), 10) - 1;
            if (isNaN(index) || index < 0 || index >= pageCount) {
              throw new Error(`Invalid page number in: ${range}`);
            }
            return index;
          });
        } else {
          // Handle single page
          const index = parseInt(range.trim(), 10) - 1;
          if (isNaN(index) || index < 0 || index >= pageCount) {
            throw new Error(`Invalid page number: ${range}`);
          }
          pageIndices = [index];
        }

        // Copy the specified pages to the new PDF
        const pages = await pdfDoc.copyPages(sourcePdf, pageIndices);
        pages.forEach((page) => pdfDoc.addPage(page));

        // Save the PDF and add to zip
        const pdfBytes = await pdfDoc.save();
        zip.file(`document-part-${i + 1}.pdf`, pdfBytes);
      } catch (error) {
        console.error(`Error processing range "${range}":`, error);
        return NextResponse.json(
          {
            error: `Invalid range format: ${range}. Use formats like "1", "1-5", or "1,3,5"`,
          },
          { status: 400 }
        );
      }
    }

    // Generate the zip file
    const zipContent = await zip.generateAsync({ type: "uint8array" });

    // Create response with the zip file
    return new NextResponse(zipContent, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="split-documents.zip"',
      },
    });
  } catch (error) {
    console.error("Split error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
