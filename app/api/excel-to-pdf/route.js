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
    const workbook = XLSX.read(fileBuffer, { type: "buffer", cellStyles: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

    if (!jsonData || jsonData.length === 0) {
      return NextResponse.json(
        { error: "The provided Excel file is empty or has no data." },
        { status: 400 }
      );
    }

    // Page setup and fonts
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Layout constants - Professional spacing
    const PAGE_WIDTH = 841.89; // A4 Landscape
    const PAGE_HEIGHT = 595.28;
    const MARGIN = 30;
    const TITLE_FONT_SIZE = 14;
    const HEADER_FONT_SIZE = 9;
    const DATA_FONT_SIZE = 8;
    const MIN_ROW_HEIGHT = 20;
    const CELL_PADDING_X = 5;
    const CELL_PADDING_Y = 4;
    const LINE_HEIGHT = 10;
    const MIN_COLUMN_WIDTH = 45;
    const MAX_COLUMN_WIDTH = 120;

    // Colors - Minimal and professional
    const BORDER_COLOR = rgb(0.7, 0.7, 0.7);
    const ALT_ROW_BG = rgb(0.98, 0.98, 0.98);
    const DEFAULT_TEXT_COLOR = rgb(0, 0, 0);

    // Enhanced color utility functions
    function hexToRgb(hex) {
      if (!hex) return null;
      hex = hex.replace('#', '');
      if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
      }
      if (hex.length !== 6) return null;
      
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      
      return rgb(r, g, b);
    }

    function argbToRgb(argb) {
      if (!argb) return null;
      if (typeof argb === 'string' && argb.length === 8) {
        const r = parseInt(argb.substring(2, 4), 16) / 255;
        const g = parseInt(argb.substring(4, 6), 16) / 255;
        const b = parseInt(argb.substring(6, 8), 16) / 255;
        return rgb(r, g, b);
      }
      return null;
    }

    function getExcelColor(cell, property) {
      try {
        if (!cell || !cell.s) return null;
        
        const style = cell.s;
        let colorInfo = null;
        
        if (property === 'bg' && style.fill && style.fill.bgColor) {
          colorInfo = style.fill.bgColor;
        } else if (property === 'font' && style.font && style.font.color) {
          colorInfo = style.font.color;
        }
        
        if (!colorInfo) return null;
        
        if (colorInfo.rgb) {
          return argbToRgb(colorInfo.rgb);
        } else if (colorInfo.theme !== undefined && workbook.Themes) {
          const themeColors = [
            '000000', 'FFFFFF', 'FF0000', '00FF00', '0000FF', 'FFFF00', 'FF00FF', '00FFFF',
            '800000', '008000', '000080', '808000', '800080', '008080', 'C0C0C0', '808080'
          ];
          const themeColor = themeColors[colorInfo.theme] || '000000';
          return hexToRgb(themeColor);
        } else if (colorInfo.indexed !== undefined) {
          const indexedColors = [
            '000000', 'FFFFFF', 'FF0000', '00FF00', '0000FF', 'FFFF00', 'FF00FF', '00FFFF',
            '800000', '008000', '000080', '808000', '800080', '008080', 'C0C0C0', '808080'
          ];
          const indexColor = indexedColors[colorInfo.indexed] || '000000';
          return hexToRgb(indexColor);
        }
        
        return null;
      } catch (error) {
        console.warn('Error extracting color:', error);
        return null;
      }
    }

    function getCellInfo(rowIndex, colIndex) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
      const cell = worksheet[cellAddress];
      
      return {
        value: cell ? cell.v : null,
        bgColor: getExcelColor(cell, 'bg'),
        fontColor: getExcelColor(cell, 'font'),
        isBold: cell && cell.s && cell.s.font && cell.s.font.bold,
        alignment: cell && cell.s && cell.s.alignment ? cell.s.alignment : null,
        cell: cell
      };
    }

    // Enhanced content formatting with better data type detection
    function formatCellContent(content, colIndex) {
      if (content === null || content === undefined) return "";
      
      // Handle percentage values (detect values that look like percentages)
      if (typeof content === 'string' && content.includes('%')) {
        return content;
      }
      
      // Handle decimal percentages (0.0 to 1.0 range)
      if (typeof content === 'number' && content >= 0 && content <= 1 && content % 1 !== 0) {
        const rounded = Math.round(content * 100);
        if (rounded >= 0 && rounded <= 100) {
          return `${rounded}%`;
        }
      }
      
      // Handle Excel date serial numbers
      if (typeof content === 'number' && content > 40000 && content < 50000) {
        try {
          const excelEpoch = new Date(1900, 0, 1);
          const days = parseInt(content) - 2;
          const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
          return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        } catch (e) {
          return String(content);
        }
      }
      
      // Handle numbers with proper formatting
      if (typeof content === 'number') {
        // Check if it's a whole number
        if (content % 1 === 0) {
          return content.toString();
        }
        // Round to 1 decimal place for floating point numbers
        return content.toFixed(1);
      }
      
      return String(content).trim();
    }

    // Enhanced text wrapping with better line breaking
    function wrapText(text, maxWidth, font, fontSize) {
      if (!text || text === "") return [""];
      
      const textStr = String(text);
      const availableWidth = maxWidth - (CELL_PADDING_X * 2);
      
      // Check if text fits in one line
      if (font.widthOfTextAtSize(textStr, fontSize) <= availableWidth) {
        return [textStr];
      }
      
      // Try to break at natural points first
      const lines = [];
      const sentences = textStr.split(/[.!?]+/).filter(s => s.trim());
      
      if (sentences.length > 1) {
        // Process sentences
        let currentLine = "";
        for (const sentence of sentences) {
          const trimmedSentence = sentence.trim();
          if (!trimmedSentence) continue;
          
          const testLine = currentLine ? `${currentLine}. ${trimmedSentence}` : trimmedSentence;
          if (font.widthOfTextAtSize(testLine, fontSize) <= availableWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) {
              lines.push(currentLine + ".");
              currentLine = trimmedSentence;
            } else {
              // Sentence too long, break by words
              lines.push(...breakByWords(trimmedSentence, availableWidth, font, fontSize));
            }
          }
        }
        if (currentLine) {
          lines.push(currentLine + ".");
        }
      } else {
        // Break by words
        lines.push(...breakByWords(textStr, availableWidth, font, fontSize));
      }
      
      return lines.length > 0 ? lines : [""];
    }

    function breakByWords(text, availableWidth, font, fontSize) {
      const words = text.split(/\s+/);
      const lines = [];
      let currentLine = "";
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        
        if (font.widthOfTextAtSize(testLine, fontSize) <= availableWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
          }
          
          // Handle very long words
          if (font.widthOfTextAtSize(word, fontSize) > availableWidth) {
            let remainingWord = word;
            while (remainingWord.length > 0) {
              let fitLength = remainingWord.length;
              while (fitLength > 0 && font.widthOfTextAtSize(remainingWord.substring(0, fitLength), fontSize) > availableWidth) {
                fitLength--;
              }
              if (fitLength === 0) fitLength = 1;
              
              lines.push(remainingWord.substring(0, fitLength));
              remainingWord = remainingWord.substring(fitLength);
            }
            currentLine = "";
          } else {
            currentLine = word;
          }
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      return lines;
    }

    // Smart data structure detection
    function analyzeData(data) {
      let titleRows = [];
      let headerRowIndex = -1;
      let dataStartIndex = -1;

      for (let i = 0; i < Math.min(data.length, 10); i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;
        
        const firstCellText = String(row[0] || "").toLowerCase().trim();
        const nonEmptyCells = row.filter(cell => cell != null && String(cell).trim() !== "").length;
        
        // Title detection
        if (nonEmptyCells === 1 && (
          firstCellText.length > 10 ||
          firstCellText.includes("report") ||
          firstCellText.includes("data") ||
          firstCellText.includes("table") ||
          firstCellText.includes("summary")
        )) {
          titleRows.push({ index: i, text: String(row[0]) });
        }
        // Header detection - look for typical header patterns
        else if (nonEmptyCells > 2 && (
          firstCellText.includes("country") ||
          firstCellText.includes("name") ||
          firstCellText.includes("rank") ||
          firstCellText.includes("total") ||
          firstCellText.includes("year") ||
          row.some(cell => String(cell || "").toLowerCase().includes("rank"))
        )) {
          headerRowIndex = i;
          dataStartIndex = i + 1;
          break;
        }
      }

      // Fallback detection
      if (headerRowIndex === -1) {
        let maxCells = 0;
        let bestRowIndex = 0;
        
        for (let i = titleRows.length; i < Math.min(data.length, 5); i++) {
          const row = data[i];
          if (row) {
            const cellCount = row.filter(cell => cell != null && String(cell).trim() !== "").length;
            if (cellCount > maxCells) {
              maxCells = cellCount;
              bestRowIndex = i;
            }
          }
        }
        
        headerRowIndex = bestRowIndex;
        dataStartIndex = headerRowIndex + 1;
      }

      const headerRow = data[headerRowIndex] || [];
      const dataRows = data.slice(dataStartIndex).filter(row => 
        row && row.some(cell => cell != null && String(cell).trim() !== "")
      );

      return {
        titleRows,
        headerRow,
        dataRows,
        columnCount: headerRow.length,
        headerRowIndex
      };
    }

    const dataAnalysis = analyzeData(jsonData);
    const { titleRows, headerRow, dataRows, columnCount, headerRowIndex } = dataAnalysis;

    if (columnCount === 0 || dataRows.length === 0) {
      return NextResponse.json(
        { error: "Could not find valid table data in the Excel file." },
        { status: 400 }
      );
    }

    // Professional column width calculation
    function calculateColumnWidths() {
      const widths = new Array(columnCount).fill(MIN_COLUMN_WIDTH);
      const availableWidth = PAGE_WIDTH - (2 * MARGIN);
      
      // Calculate ideal width for each column
      for (let col = 0; col < columnCount; col++) {
        let maxWidth = MIN_COLUMN_WIDTH;
        
        // Check header width
        if (headerRow[col]) {
          const headerText = String(headerRow[col]);
          const headerWidth = boldFont.widthOfTextAtSize(headerText, HEADER_FONT_SIZE) + (CELL_PADDING_X * 2) + 5;
          maxWidth = Math.max(maxWidth, headerWidth);
        }
        
        // Sample data rows for width calculation
        const sampleSize = Math.min(dataRows.length, 50);
        for (let row = 0; row < sampleSize; row++) {
          const cellContent = formatCellContent(dataRows[row][col], col);
          if (cellContent && cellContent.length > 0) {
            const contentWidth = font.widthOfTextAtSize(cellContent, DATA_FONT_SIZE) + (CELL_PADDING_X * 2) + 5;
            maxWidth = Math.max(maxWidth, contentWidth);
          }
        }
        
        widths[col] = Math.min(maxWidth, MAX_COLUMN_WIDTH);
      }
      
      // Proportional scaling if needed
      const totalWidth = widths.reduce((sum, w) => sum + w, 0);
      if (totalWidth > availableWidth) {
        const scale = availableWidth / totalWidth;
        for (let i = 0; i < widths.length; i++) {
          widths[i] = Math.max(widths[i] * scale, MIN_COLUMN_WIDTH);
        }
      }
      
      return widths;
    }

    const columnWidths = calculateColumnWidths();

    // Calculate column positions
    const columnPositions = [];
    let currentX = MARGIN;
    for (let i = 0; i < columnCount; i++) {
      columnPositions.push(currentX);
      currentX += columnWidths[i];
    }
    const tableWidth = currentX - MARGIN;

    // PDF generation with professional layout
    let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let currentY = PAGE_HEIGHT - MARGIN;
    let currentPageRows = [];

    function calculateRowHeight(row, isHeader = false, excelRowIndex = -1) {
      let maxLines = 1;
      const fontSize = isHeader ? HEADER_FONT_SIZE : DATA_FONT_SIZE;
      const currentFont = isHeader ? boldFont : font;
      
      for (let col = 0; col < columnCount; col++) {
        const rawContent = row[col];
        const cellContent = isHeader ? String(rawContent || "") : formatCellContent(rawContent, col);
        const textLines = wrapText(cellContent, columnWidths[col], currentFont, fontSize);
        maxLines = Math.max(maxLines, textLines.length);
      }
      
      return Math.max(MIN_ROW_HEIGHT, maxLines * LINE_HEIGHT + (CELL_PADDING_Y * 2));
    }

    function startNewPage() {
      if (currentPageRows.length > 0) {
        drawTableBorders(currentPage, currentPageRows);
      }
      
      currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      currentY = PAGE_HEIGHT - MARGIN;
      currentPageRows = [];
      
      // Draw header on new page
      const headerHeight = calculateRowHeight(headerRow, true, headerRowIndex);
      const headerRowData = {
        y: currentY,
        height: headerHeight,
        isHeader: true,
        rowIndex: headerRowIndex
      };
      
      drawRowBackground(currentPage, currentY, headerHeight, true, false, headerRowIndex);
      drawRowContent(currentPage, headerRow, currentY, headerHeight, true, headerRowIndex);
      
      currentY -= headerHeight;
      currentPageRows.push(headerRowData);
    }

    function drawRowBackground(page, y, height, isHeader = false, isEvenRow = false, excelRowIndex = -1) {
      // Only draw backgrounds if there are actual Excel colors
      if (excelRowIndex >= 0) {
        for (let col = 0; col < columnCount; col++) {
          const cellInfo = getCellInfo(excelRowIndex, col);
          if (cellInfo.bgColor) {
            page.drawRectangle({
              x: columnPositions[col],
              y: y - height,
              width: columnWidths[col],
              height: height,
              color: cellInfo.bgColor,
            });
          }
        }
      }
      
      // Subtle alternating rows for data (not headers) only if no custom colors
      if (!isHeader && isEvenRow && excelRowIndex >= 0) {
        let hasCustomColors = false;
        for (let col = 0; col < columnCount; col++) {
          const cellInfo = getCellInfo(excelRowIndex, col);
          if (cellInfo.bgColor) {
            hasCustomColors = true;
            break;
          }
        }
        
        if (!hasCustomColors) {
          page.drawRectangle({
            x: MARGIN,
            y: y - height,
            width: tableWidth,
            height: height,
            color: ALT_ROW_BG,
          });
        }
      }
    }

    function drawRowContent(page, row, y, height, isHeader = false, excelRowIndex = -1) {
      const fontSize = isHeader ? HEADER_FONT_SIZE : DATA_FONT_SIZE;
      
      for (let col = 0; col < columnCount; col++) {
        const rawContent = row[col];
        const cellContent = isHeader ? String(rawContent || "") : formatCellContent(rawContent, col);
        
        let cellFont = font;
        let textColor = DEFAULT_TEXT_COLOR;
        let alignment = 'left'; // Default alignment
        
        // Get Excel formatting
        if (excelRowIndex >= 0) {
          const cellInfo = getCellInfo(excelRowIndex, col);
          
          if (cellInfo.isBold || isHeader) {
            cellFont = boldFont;
          }
          
          if (cellInfo.fontColor) {
            textColor = cellInfo.fontColor;
          }
          
          // Handle Excel alignment
          if (cellInfo.alignment && cellInfo.alignment.horizontal) {
            alignment = cellInfo.alignment.horizontal;
          }
        } else if (isHeader) {
          cellFont = boldFont;
        }
        
        // Smart alignment based on content type
        if (alignment === 'left') {
          // Numbers should be right-aligned, text left-aligned
          if (typeof rawContent === 'number' || 
              (typeof cellContent === 'string' && /^[\d.,%-]+$/.test(cellContent))) {
            alignment = 'right';
          }
        }
        
        const textLines = wrapText(cellContent, columnWidths[col], cellFont, fontSize);
        const cellX = columnPositions[col];
        const cellWidth = columnWidths[col];
        
        // Calculate vertical centering
        const totalTextHeight = textLines.length * LINE_HEIGHT;
        const verticalOffset = (height - totalTextHeight) / 2;
        
        // Draw each line with proper alignment
        for (let lineIndex = 0; lineIndex < textLines.length; lineIndex++) {
          const line = textLines[lineIndex];
          const textY = y - CELL_PADDING_Y - verticalOffset - (lineIndex * LINE_HEIGHT);
          
          let textX = cellX + CELL_PADDING_X;
          
          // Apply horizontal alignment
          if (alignment === 'center') {
            const textWidth = cellFont.widthOfTextAtSize(line, fontSize);
            textX = cellX + (cellWidth - textWidth) / 2;
          } else if (alignment === 'right') {
            const textWidth = cellFont.widthOfTextAtSize(line, fontSize);
            textX = cellX + cellWidth - textWidth - CELL_PADDING_X;
          }
          
          if (textY > 0) {
            page.drawText(line, {
              x: Math.max(cellX + 2, textX), // Ensure text doesn't go outside cell
              y: textY,
              size: fontSize,
              font: cellFont,
              color: textColor,
            });
          }
        }
      }
    }

    function drawTableBorders(page, rows) {
      if (rows.length === 0) return;
      
      const topY = rows[0].y;
      const bottomY = rows[rows.length - 1].y - rows[rows.length - 1].height;
      const rightX = MARGIN + tableWidth;
      
      // Vertical lines
      for (let col = 0; col <= columnCount; col++) {
        const x = col === columnCount ? rightX : columnPositions[col];
        page.drawLine({
          start: { x, y: topY },
          end: { x, y: bottomY },
          thickness: 0.5,
          color: BORDER_COLOR,
        });
      }
      
      // Horizontal lines
      for (const rowData of rows) {
        const thickness = rowData.isHeader ? 1 : 0.5;
        page.drawLine({
          start: { x: MARGIN, y: rowData.y },
          end: { x: rightX, y: rowData.y },
          thickness: thickness,
          color: BORDER_COLOR,
        });
      }
      
      // Bottom border
      page.drawLine({
        start: { x: MARGIN, y: bottomY },
        end: { x: rightX, y: bottomY },
        thickness: 0.5,
        color: BORDER_COLOR,
      });
    }

    // Draw titles
    for (const titleRow of titleRows) {
      const titleText = titleRow.text.trim();
      if (titleText) {
        const titleWidth = boldFont.widthOfTextAtSize(titleText, TITLE_FONT_SIZE);
        const titleX = (PAGE_WIDTH - titleWidth) / 2;
        
        currentPage.drawText(titleText, {
          x: titleX,
          y: currentY,
          size: TITLE_FONT_SIZE,
          font: boldFont,
          color: DEFAULT_TEXT_COLOR,
        });
        
        currentY -= 30;
      }
    }

    if (titleRows.length > 0) {
      currentY -= 15;
    }

    // Draw header
    const headerHeight = calculateRowHeight(headerRow, true, headerRowIndex);
    const headerRowData = {
      y: currentY,
      height: headerHeight,
      isHeader: true,
      rowIndex: headerRowIndex
    };
    
    drawRowBackground(currentPage, currentY, headerHeight, true, false, headerRowIndex);
    drawRowContent(currentPage, headerRow, currentY, headerHeight, true, headerRowIndex);
    currentY -= headerHeight;
    currentPageRows.push(headerRowData);

    // Draw data rows
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const excelRowIndex = headerRowIndex + 1 + i;
      const rowHeight = calculateRowHeight(row, false, excelRowIndex);
      
      // Check if new page is needed
      if (currentY - rowHeight < MARGIN + 20) {
        startNewPage();
      }
      
      // Normalize row
      const normalizedRow = [];
      for (let col = 0; col < columnCount; col++) {
        normalizedRow[col] = row[col] || "";
      }
      
      const rowData = {
        y: currentY,
        height: rowHeight,
        isHeader: false,
        rowIndex: excelRowIndex
      };
      
      drawRowBackground(currentPage, currentY, rowHeight, false, i % 2 === 0, excelRowIndex);
      drawRowContent(currentPage, normalizedRow, currentY, rowHeight, false, excelRowIndex);
      currentY -= rowHeight;
      currentPageRows.push(rowData);
    }

    // Final borders
    if (currentPageRows.length > 0) {
      drawTableBorders(currentPage, currentPageRows);
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
    console.error("Excel to PDF conversion error:", err);
    return NextResponse.json(
      { error: `Failed to convert Excel to PDF: ${err.message}` },
      { status: 500 }
    );
  }
}