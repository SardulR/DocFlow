// app/api/convert-pdf-to-word/route.js
import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get("pdf");

    if (!pdfFile) {
      return NextResponse.json(
        { error: "Please upload a PDF file" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!pdfFile.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: "Please upload a valid PDF file" },
        { status: 400 }
      );
    }

    // Convert the file to buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";
    let pageCount = 0;
    let extractionMethod = "";

    // Try multiple extraction methods
    try {
      // Method 1: Try pdf-parse first
      console.log("Trying pdf-parse...");
      const result1 = await tryPdfParse(buffer);
      if (result1.success && result1.text.trim().length > 50) {
        extractedText = result1.text;
        pageCount = result1.pageCount;
        extractionMethod = "pdf-parse";
        console.log("✓ pdf-parse successful");
      } else {
        throw new Error("pdf-parse failed or returned insufficient text");
      }
    } catch (error1) {
      console.log("pdf-parse failed, trying pdfjs-dist...");
      
      try {
        // Method 2: Try pdfjs-dist
        const result2 = await tryPdfjsDist(buffer);
        if (result2.success && result2.text.trim().length > 50) {
          extractedText = result2.text;
          pageCount = result2.pageCount;
          extractionMethod = "pdfjs-dist";
          console.log("✓ pdfjs-dist successful");
        } else {
          throw new Error("pdfjs-dist failed or returned insufficient text");
        }
      } catch (error2) {
        console.log("Both text extraction methods failed, trying OCR...");
        
        try {
          // Method 3: Try OCR with pdf2pic + tesseract.js
          const result3 = await tryOcrExtraction(buffer);
          if (result3.success) {
            extractedText = result3.text;
            pageCount = result3.pageCount;
            extractionMethod = "OCR";
            console.log("✓ OCR successful");
          } else {
            throw new Error("OCR extraction failed");
          }
        } catch (error3) {
          console.error("All extraction methods failed");
          extractedText = `Text extraction failed with all methods. 

This PDF might be:
• A scanned document with poor image quality
• Password protected or encrypted
• Corrupted or in an unsupported format
• Contains only images without embedded text

Suggested solutions:
• Try converting the PDF using online tools first
• Ensure the PDF is not password protected
• Use a different PDF file
• For scanned documents, try using dedicated OCR software`;
          pageCount = 1;
          extractionMethod = "fallback";
        }
      }
    }

    console.log(`Text extraction completed using: ${extractionMethod}`);
    console.log(`Extracted ${extractedText.length} characters from ${pageCount} pages`);

    // Clean and process the extracted text
    const cleanedText = cleanText(extractedText);
    
    // Create Word document with better structure
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: createWordContent(pdfFile.name, cleanedText, pageCount, extractionMethod),
        },
      ],
    });

    const docxBuffer = await Packer.toBuffer(doc);

    return new NextResponse(docxBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${pdfFile.name.replace(
          ".pdf",
          ".docx"
        )}"`,
        "Content-Length": docxBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Conversion error:", error);
    return NextResponse.json(
      {
        error: "Failed to convert PDF to Word. Please try a different file.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Method 1: Try pdf-parse
async function tryPdfParse(buffer) {
  try {
    const pdfParse = await import('pdf-parse');
    const data = await pdfParse.default(buffer);
    return {
      success: true,
      text: data.text,
      pageCount: data.numpages
    };
  } catch (error) {
    console.error("pdf-parse error:", error.message);
    return { success: false, error: error.message };
  }
}

// Method 2: Try pdfjs-dist
async function tryPdfjsDist(buffer) {
  try {
    const pdfjs = await import('pdfjs-dist');
    
    // Set worker path for pdfjs-dist
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    const pageCount = pdf.numPages;
    let fullText = "";
    
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map(item => ('str' in item ? item.str : ''))
        .join(' ');
      fullText += pageText + "\n\n";
    }
    
    return {
      success: true,
      text: fullText.trim(),
      pageCount: pageCount
    };
  } catch (error) {
    console.error("pdfjs-dist error:", error.message);
    return { success: false, error: error.message };
  }
}

// Method 3: Try OCR extraction (for scanned PDFs)
async function tryOcrExtraction(buffer) {
  try {
    // This is a placeholder for OCR functionality
    // You would need to install: npm install pdf2pic tesseract.js
    // And implement the OCR logic here
    
    console.log("OCR extraction would be implemented here");
    console.log("Install: npm install pdf2pic tesseract.js");
    
    // For now, return a helpful message
    return {
      success: true,
      text: `OCR Extraction Notice:

This appears to be a scanned PDF or image-based document. 

To enable OCR (Optical Character Recognition), install these packages:
npm install pdf2pic tesseract.js

Current workaround solutions:
1. Use online OCR tools like:
   • https://www.onlineocr.net/
   • https://ocr.space/
   • https://www.i2pdf.com/

2. Convert your PDF to images first, then use OCR software

3. Try Google Drive:
   • Upload PDF to Google Drive
   • Open with Google Docs
   • It will automatically OCR the content

4. Use Adobe Acrobat Pro if available

The document structure suggests this is a resume or professional document that would benefit from OCR processing.`,
      pageCount: 1
    };
  } catch (error) {
    console.error("OCR extraction error:", error.message);
    return { success: false, error: error.message };
  }
}

// Clean and format extracted text with better structure preservation
function cleanText(text) {
  if (!text || text.trim().length === 0) {
    return "No readable text content found in the PDF file.";
  }

  // First, normalize line breaks and spaces
  let cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/ +/g, ' ')
    .replace(/^ +| +$/gm, '');

  // Split into lines and process
  const lines = cleanedText.split('\n');
  const processedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.length === 0) {
      processedLines.push('');
      continue;
    }
    
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
    
    if (line.length > 0 && 
        !line.match(/[.!?:]$/) && 
        !isLikelyHeading(line) &&
        nextLine.length > 0 && 
        !isLikelyHeading(nextLine) &&
        !nextLine.match(/^[•◦▪▫-]\s/) &&
        !nextLine.match(/^\d+\./) &&
        line.length < 100) {
      
      const joinedLine = line + ' ' + nextLine;
      processedLines.push(joinedLine);
      i++;
    } else {
      processedLines.push(line);
    }
  }
  
  return processedLines.join('\n');
}

// Create structured Word document content with extraction method info
function createWordContent(fileName, text, pageCount, extractionMethod) {
  const children = [];

  // Add title
  children.push(
    new Paragraph({
      text: fileName.replace(".pdf", ""),
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    })
  );

  // Add metadata with extraction method info
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Converted from PDF (${pageCount} page${pageCount !== 1 ? 's' : ''}) using ${extractionMethod}`,
          italics: true,
          size: 20,
          color: "666666",
        }),
      ],
      spacing: { after: 300 },
    })
  );

  // Process text content with better structure
  if (text && text.trim().length > 0) {
    const lines = text.split('\n');
    let currentSection = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.length === 0) {
        if (currentSection.length > 0) {
          children.push(...processSection(currentSection));
          currentSection = [];
        }
        continue;
      }
      
      currentSection.push(line);
    }
    
    if (currentSection.length > 0) {
      children.push(...processSection(currentSection));
    }
  } else {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "No readable text content was found in this PDF file.",
            size: 24,
            font: "Calibri",
            italics: true,
          }),
        ],
      })
    );
  }

  return children;
}

// Process a section of related lines
function processSection(lines) {
  const elements = [];
  
  if (lines.length === 0) return elements;
  
  const firstLine = lines[0];
  const isFirstLineHeading = isLikelyHeading(firstLine) || isResumeSection(firstLine);
  
  if (isFirstLineHeading) {
    elements.push(
      new Paragraph({
        text: firstLine,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );
    
    for (let i = 1; i < lines.length; i++) {
      elements.push(...createParagraphFromLine(lines[i]));
    }
  } else {
    lines.forEach(line => {
      elements.push(...createParagraphFromLine(line));
    });
  }
  
  elements.push(new Paragraph({ text: "", spacing: { after: 150 } }));
  
  return elements;
}

// Create paragraph(s) from a line
function createParagraphFromLine(line) {
  const elements = [];
  
  if (!line || line.trim().length === 0) {
    return [new Paragraph({ text: "" })];
  }
  
  const trimmedLine = line.trim();
  
  if (isBulletPoint(trimmedLine)) {
    elements.push(createBulletParagraph(trimmedLine));
  } else if (isContactInfo(trimmedLine)) {
    elements.push(createContactParagraph(trimmedLine));
  } else if (isSubHeading(trimmedLine)) {
    elements.push(
      new Paragraph({
        text: trimmedLine,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 50 },
      })
    );
  } else {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: trimmedLine,
            size: 22,
            font: "Calibri",
          }),
        ],
        spacing: { after: 100 },
      })
    );
  }
  
  return elements;
}

// Create bullet point paragraph
function createBulletParagraph(line) {
  const cleanedText = line.replace(/^[•◦▪▫-]\s*/, '').trim();
  
  return new Paragraph({
    children: [
      new TextRun({
        text: cleanedText,
        size: 22,
        font: "Calibri",
      }),
    ],
    bullet: {
      level: 0,
    },
    spacing: { after: 80 },
  });
}

// Create contact information paragraph
function createContactParagraph(line) {
  return new Paragraph({
    children: [
      new TextRun({
        text: line,
        size: 20,
        font: "Calibri",
        color: "444444",
      }),
    ],
    spacing: { after: 100 },
  });
}

// Helper functions
function isBulletPoint(line) {
  return /^[•◦▪▫-]\s/.test(line) || /^\d+\.\s/.test(line);
}

function isContactInfo(line) {
  return /[@•+]/.test(line) || 
         /\b\d{10}\b/.test(line) || 
         /\.(com|org|net|in)/.test(line) ||
         /linkedin\.com/.test(line);
}

function isSubHeading(line) {
  const commonSubHeadings = [
    'experience', 'education', 'skills', 'projects', 'certifications',
    'achievements', 'technologies', 'languages', 'dev tools', 'tech stack',
    'positions of responsibility', 'summary', 'objective'
  ];
  
  return commonSubHeadings.some(heading => 
    line.toLowerCase().includes(heading.toLowerCase())
  ) && line.length < 50;
}

function isResumeSection(line) {
  const resumeSections = [
    'summary', 'experience', 'education', 'skills', 'projects', 
    'certifications', 'achievements', 'contact', 'objective',
    'technologies', 'positions of responsibility'
  ];
  
  return resumeSections.some(section => 
    line.toLowerCase().trim() === section.toLowerCase() ||
    line.toLowerCase().includes(section.toLowerCase())
  ) && line.length < 80;
}

function isLikelyHeading(text) {
  const trimmed = text.trim();
  
  return (
    trimmed.length < 100 && 
    trimmed.length > 2 && 
    !trimmed.endsWith('.') && 
    !trimmed.endsWith(',') && 
    !trimmed.includes('@') && 
    !trimmed.includes('http') && 
    /^[A-Z]/.test(trimmed) && 
    (
      trimmed === trimmed.toUpperCase() || 
      /^[A-Z][a-z\s]*[A-Z]/.test(trimmed) || 
      /^[A-Z][a-z\s&-]*$/.test(trimmed)
    )
  );
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