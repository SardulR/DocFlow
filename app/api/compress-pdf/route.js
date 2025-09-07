import { NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get("pdf");
    const compressionType = formData.get("compressionType") || "preset";

    if (!pdfFile) {
      return NextResponse.json(
        { error: "Please upload a PDF file" },
        { status: 400 }
      );
    }

    // Convert file to array buffer
    const arrayBuffer = await pdfFile.arrayBuffer();

    // Load the source PDF
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // Register fontkit for better text handling
    pdfDoc.registerFontkit(fontkit);

    // Set compression options based on type
    let saveOptions = {};
    let additionalProcessing = false;

    switch (compressionType) {
      case "preset":
        const compressionLevel = formData.get("compressionLevel") || "medium";
        ({ saveOptions, additionalProcessing } =
          getPresetOptions(compressionLevel));
        break;

      case "custom":
        const customQuality = parseInt(formData.get("customQuality") || "75");
        const removeMetadata = formData.get("removeMetadata") === "true";
        const downsampleImages = formData.get("downsampleImages") === "true";
        ({ saveOptions, additionalProcessing } = getCustomOptions(
          customQuality,
          removeMetadata,
          downsampleImages
        ));
        break;

      case "target":
        const targetSize = parseInt(formData.get("targetSize") || "0");
        ({ saveOptions, additionalProcessing } = getTargetSizeOptions(
          targetSize,
          arrayBuffer.byteLength
        ));
        break;

      default:
        ({ saveOptions, additionalProcessing } = getPresetOptions("medium"));
    }

    // Apply additional processing if needed
    if (additionalProcessing) {
      await applyAdvancedCompression(pdfDoc, compressionType, formData);
    }

    // Save with compression options
    const pdfBytes = await pdfDoc.save(saveOptions);

    // Create response with the compressed PDF
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="compressed-${pdfFile.name}"`,
      },
    });
  } catch (error) {
    console.error("Compression error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Enhanced helper functions
function getPresetOptions(level) {
  let saveOptions = {};
  let additionalProcessing = false;

  switch (level) {
    case "low":
      saveOptions = { useObjectStreams: true, compress: false };
      additionalProcessing = false;
      break;
    case "medium":
      saveOptions = { useObjectStreams: true, compress: true };
      additionalProcessing = true;
      break;
    case "high":
      saveOptions = {
        useObjectStreams: true,
        compress: true,
        objectsPerTick: 30,
      };
      additionalProcessing = true;
      break;
    case "maximum":
      saveOptions = {
        useObjectStreams: true,
        compress: true,
        objectsPerTick: 10,
      };
      additionalProcessing = true;
      break;
    default:
      saveOptions = { useObjectStreams: true, compress: true };
      additionalProcessing = true;
  }

  return { saveOptions, additionalProcessing };
}

function getCustomOptions(quality, removeMetadata, downsampleImages) {
  let objectsPerTick = 100;

  if (quality < 20) objectsPerTick = 10;
  else if (quality < 40) objectsPerTick = 30;
  else if (quality < 60) objectsPerTick = 50;
  else if (quality < 80) objectsPerTick = 100;
  else objectsPerTick = 200;

  const saveOptions = {
    useObjectStreams: true,
    compress: true,
    objectsPerTick,
  };

  return {
    saveOptions,
    additionalProcessing: removeMetadata || downsampleImages,
  };
}

function getTargetSizeOptions(targetSizeMB, originalSizeBytes) {
  const targetSizeBytes = targetSizeMB * 1024 * 1024;
  const compressionRatio = Math.min(0.9, targetSizeBytes / originalSizeBytes);

  let objectsPerTick = 100;
  let additionalProcessing = false;

  if (compressionRatio > 0.8) {
    objectsPerTick = 200;
  } else if (compressionRatio > 0.6) {
    objectsPerTick = 100;
  } else if (compressionRatio > 0.4) {
    objectsPerTick = 50;
    additionalProcessing = true;
  } else {
    objectsPerTick = 20;
    additionalProcessing = true;
  }

  const saveOptions = {
    useObjectStreams: true,
    compress: true,
    objectsPerTick,
  };

  return { saveOptions, additionalProcessing };
}

// Advanced compression techniques
async function applyAdvancedCompression(pdfDoc, compressionType, formData) {
  try {
    const pages = pdfDoc.getPages();

    // For custom compression, apply specific optimizations
    if (compressionType === "custom") {
      const removeMetadata = formData.get("removeMetadata") === "true";
      const downsampleImages = formData.get("downsampleImages") === "true";

      if (removeMetadata) {
        // Remove metadata (simplified approach)
        pdfDoc.setTitle("Compressed Document");
        pdfDoc.setAuthor("");
        pdfDoc.setSubject("");
        pdfDoc.setKeywords([]);
        pdfDoc.setCreationDate(new Date());
        pdfDoc.setModificationDate(new Date());
      }

      if (downsampleImages && pages.length > 0) {
        // This is a placeholder - actual image downsampling would require
        // additional libraries like pdf-lib with image processing capabilities
        console.log("Image downsampling would be applied here");
      }
    }

    // For maximum compression or target size, apply more aggressive optimizations
    if (compressionType === "preset" || compressionType === "target") {
      const compressionLevel = formData.get("compressionLevel");
      const targetSize = parseInt(formData.get("targetSize") || "0");

      if (compressionLevel === "maximum" || targetSize > 0) {
        // Apply more aggressive optimizations for maximum compression
        optimizeFonts(pdfDoc);
        optimizeImages(pdfDoc);
      }
    }
  } catch (error) {
    console.warn(
      "Advanced compression techniques could not be applied:",
      error
    );
  }
}

// Placeholder functions for advanced optimizations
function optimizeFonts(pdfDoc) {
  // In a real implementation, this would subset fonts and remove unused glyphs
  console.log("Font optimization would be applied here");
}

function optimizeImages(pdfDoc) {
  // In a real implementation, this would downsample and recompress images
  console.log("Image optimization would be applied here");
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
