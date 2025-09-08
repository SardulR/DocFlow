import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import jsPDF from 'jspdf';

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

// MIME type validation
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
];

/**
 * Clean HTML and extract text content with basic formatting
 */
function parseHtmlToText(html) {
  // Remove HTML tags but preserve line breaks and structure
  let text = html
    // Convert headings to formatted text
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n$1\n')
    // Convert paragraphs
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n')
    // Convert line breaks
    .replace(/<br[^>]*>/gi, '\n')
    // Convert lists
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
      return '\n' + content.replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n') + '\n';
    })
    .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
      let counter = 1;
      return '\n' + content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`) + '\n';
    })
    // Convert tables to simple text format
    .replace(/<table[^>]*>(.*?)<\/table>/gis, (match, content) => {
      const rows = content.match(/<tr[^>]*>(.*?)<\/tr>/gis);
      if (!rows) return '\n';
      
      let tableText = '\n';
      rows.forEach(row => {
        const cells = row.replace(/<tr[^>]*>(.*?)<\/tr>/gi, '$1')
                         .replace(/<t[hd][^>]*>(.*?)<\/t[hd]>/gi, '$1 | ')
                         .replace(/\s*\|\s*$/, '');
        tableText += cells + '\n';
      });
      return tableText + '\n';
    })
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Clean up whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return text;
}

/**
 * Convert DOCX to PDF using mammoth + jsPDF
 */
async function convertDocxToPdf(buffer, filename) {
  try {
    // Extract HTML from DOCX using mammoth
    const result = await mammoth.convertToHtml({ buffer });
    const html = result.value;
    
    // Parse HTML to clean text
    const text = parseHtmlToText(html);
    
    if (!text || text.trim().length === 0) {
      throw new Error('No readable content found in the document');
    }
    
    // Create PDF using jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    // Set up page dimensions and margins
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 72; // 1 inch margins
    const lineHeight = 16;
    const maxLineWidth = pageWidth - (margin * 2);
    
    // Set font
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    
    // Split text into lines that fit the page width
    const lines = doc.splitTextToSize(text, maxLineWidth);
    
    let yPosition = margin;
    const linesPerPage = Math.floor((pageHeight - (margin * 2)) / lineHeight);
    
    // Add text to PDF, handling page breaks
    for (let i = 0; i < lines.length; i++) {
      // Check if we need a new page
      if (i > 0 && i % linesPerPage === 0) {
        doc.addPage();
        yPosition = margin;
      }
      
      // Calculate position on current page
      const lineIndex = i % linesPerPage;
      yPosition = margin + (lineIndex * lineHeight);
      
      // Add the line to the PDF
      doc.text(lines[i], margin, yPosition);
    }
    
    // Get PDF as buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    return {
      success: true,
      buffer: pdfBuffer,
      filename: filename.replace(/\.(docx?|DOCX?)$/, '.pdf')
    };
    
  } catch (error) {
    console.error('DOCX to PDF conversion error:', error);
    return {
      success: false,
      error: {
        error: 'DOCX_CONVERSION_FAILED',
        message: error.message || 'Failed to convert DOCX to PDF',
        statusCode: 500
      }
    };
  }
}

/**
 * Validate uploaded file
 */
function validateFile(file) {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      error: 'FILE_TOO_LARGE',
      message: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
      statusCode: 413
    };
  }

  // Check file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      error: 'INVALID_FILE_TYPE',
      message: 'Only DOCX and DOC files are allowed',
      statusCode: 400
    };
  }

  // Check file extension
  const fileExtension = file.name.toLowerCase().split('.').pop();
  if (!['docx', 'doc'].includes(fileExtension || '')) {
    return {
      error: 'INVALID_FILE_EXTENSION',
      message: 'File must have .docx or .doc extension',
      statusCode: 400
    };
  }

  return null;
}

/**
 * Create error response
 */
function createErrorResponse(error) {
  return NextResponse.json(
    {
      success: false,
      error: error.error,
      message: error.message
    },
    { status: error.statusCode }
  );
}

/**
 * Main API route handler
 */
export async function POST(request) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file');

    // Validate file presence
    if (!file) {
      return createErrorResponse({
        error: 'NO_FILE_PROVIDED',
        message: 'No file was uploaded',
        statusCode: 400
      });
    }

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      return createErrorResponse(validationError);
    }

    // Convert file to buffer
    console.log(`Processing file: ${file.name} (${file.size} bytes)`);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Perform conversion
    const conversionResult = await convertDocxToPdf(buffer, file.name);

    // Handle conversion errors
    if (!conversionResult.success || !conversionResult.buffer) {
      return createErrorResponse(
        conversionResult.error || {
          error: 'CONVERSION_FAILED',
          message: 'File conversion failed',
          statusCode: 500
        }
      );
    }

    // Return PDF file
    const pdfFilename = conversionResult.filename || 'converted.pdf';
    console.log(`Conversion successful: ${pdfFilename} (${conversionResult.buffer.length} bytes)`);
    
    return new NextResponse(conversionResult.buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdfFilename}"`,
        'Content-Length': conversionResult.buffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Unexpected error in conversion API:', error);
    
    return createErrorResponse({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred during conversion',
      statusCode: 500
    });
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    conversionMethod: 'Mammoth + jsPDF (Pure JavaScript)',
    maxFileSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
    supportedFormats: ['docx', 'doc'],
    dependencies: ['mammoth', 'jspdf']
  });
}

/**
 * Handle unsupported methods
 */
export async function PUT() {
  return createErrorResponse({
    error: 'METHOD_NOT_ALLOWED',
    message: 'Only GET and POST methods are supported',
    statusCode: 405
  });
}

export async function DELETE() {
  return createErrorResponse({
    error: 'METHOD_NOT_ALLOWED',
    message: 'Only GET and POST methods are supported',
    statusCode: 405
  });
}