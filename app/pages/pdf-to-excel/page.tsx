"use client";

import { useState, useRef } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FileIcon,
  CheckCircle2Icon,
  Loader2Icon,
  CloudUploadIcon,
  XCircleIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import MoreToolsSidebar from "@/components/MoreToolsSidebar";
import Footer from "@/components/Footer";

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function PdfToExcel() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [convertedSize, setConvertedSize] = useState<number>(0);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setOriginalSize(selectedFile.size);
      setConvertedSize(0);
      setDownloadUrl("");
    } else {
      setError("Please select a valid PDF file.");
      setFile(null);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    setError("");
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setOriginalSize(droppedFile.size);
      setConvertedSize(0);
      setDownloadUrl("");
      event.dataTransfer.clearData();
    } else {
      setError("Please drop a valid PDF file.");
      setFile(null);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
  };

  const convertToExcel = async () => {
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }

    setIsConverting(true);
    setError("");
    setDownloadUrl("");
    setConvertedSize(0);

    try {
      const response = await fetch("/api/pdf-to-excel", {
        method: "POST",
        body: file,
        headers: {
          "Content-Type": "application/pdf",
        },
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setConvertedSize(blob.size);
    } catch (error: unknown) {
      // Use unknown here
      console.error("Error converting PDF to Excel:", error);
      if (error instanceof Error) {
        setError(error.message || "Failed to convert PDF. Please try again.");
      } else {
        setError("Failed to convert PDF. Please try again.");
      }
    } finally {
      setIsConverting(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setOriginalSize(0);
    setConvertedSize(0);
    setDownloadUrl("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <Navbar />

      {/* Main Content & Sidebar Container */}
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 flex flex-col items-center text-center">
          {/* Breadcrumb */}
          <div className="w-full max-w-2xl mx-auto text-left">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">
                    <span className="text-sm font-semibold uppercase cursor-pointer">
                      Home
                    </span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-sm font-semibold uppercase">
                    PDF to Excel
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Header */}
          <h1 className="text-4xl font-extrabold uppercase mt-6">
            DocFlow - Convert PDF to Excel
          </h1>
          <p className="text-xs font-semibold uppercase mt-2 mb-8 text-zinc-600">
            Convert your PDF documents to editable Excel spreadsheets.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Drop Zone / File Info */}
          {!file ? (
            <div
              className={cn(
                "w-full max-w-2xl h-48 border-2 rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer",
                dragActive
                  ? "border-blue-500 text-blue-500 border-dashed"
                  : "border-gray-400 text-gray-500 hover:border-blue-500 hover:text-blue-500 border-dashed"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUploadIcon className="h-12 w-12 text-gray-400" />
              <p className="text-sm font-semibold uppercase mt-4">
                Click to select or drag & drop a PDF file here
              </p>
              <p className="text-xs font-semibold uppercase mt-1 text-zinc-600">
                Accepted format: .pdf
              </p>
            </div>
          ) : (
            <div className="w-full max-w-2xl p-6 rounded-xl bg-white shadow-lg border border-gray-200 space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileIcon className="w-5 h-5 text-rose-500" />
                  <p className="text-sm font-semibold uppercase">
                    Selected File:{" "}
                    <span className="font-normal text-gray-700">
                      {file.name}
                    </span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="p-1 h-auto text-red-500 hover:bg-red-50 hover:text-red-700 transition-all rounded-full"
                  aria-label="Remove file"
                >
                  <XCircleIcon className="h-5 w-5" />
                </Button>
              </div>
              <Separator />
              <div className="flex justify-center">
                <Button
                  onClick={convertToExcel}
                  disabled={isConverting}
                  variant={"outline"}
                  className="ring-2 ring-inset ring-rose-400 text-sm font-semibold uppercase"
                >
                  {isConverting ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    "Convert to Excel"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="w-full max-w-2xl mt-8 p-4 rounded-lg bg-red-50 border border-red-300 text-red-600 text-sm font-semibold uppercase text-left">
              <p>{error}</p>
            </div>
          )}

          {/* Conversion Results */}
          {downloadUrl && (
            <div className="w-full max-w-2xl mt-8 p-6 rounded-xl bg-white shadow-lg border border-green-200 text-center space-y-4">
              <div className="flex flex-col items-center">
                <CheckCircle2Icon className="h-12 w-12 text-green-500" />
                <h3 className="text-lg font-semibold uppercase mt-2 text-green-700">
                  Conversion Complete
                </h3>
                <p className="text-sm font-semibold uppercase text-zinc-600">
                  Your Excel spreadsheet is ready for download.
                </p>
              </div>
              <div className="flex justify-around items-center pt-4">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-semibold uppercase text-gray-700">
                    Original PDF
                  </span>
                  <span className="text-xs font-semibold uppercase text-blue-500">
                    {formatFileSize(originalSize)}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-semibold uppercase text-gray-700">
                    Excel Spreadsheet
                  </span>
                  <span className="text-xs font-semibold uppercase text-green-500">
                    {formatFileSize(convertedSize)}
                  </span>
                </div>
              </div>
              <Button
                variant={"outline"}
                className="mt-4 ring-2 ring-inset ring-green-500"
              >
                <a
                  href={downloadUrl}
                  download={`converted-${file?.name.replace(".pdf", ".xlsx")}`}
                  className="text-sm font-semibold uppercase text-green-700"
                >
                  Download The Excel File
                </a>
              </Button>
            </div>
          )}
        </main>

        {/* Sidebar Container */}
        <aside className="md:w-[25%] p-4 bg-gray-100 border-l border-gray-200">
          <MoreToolsSidebar currentPage={"/pdf-to-excel"} />
        </aside>
      </div>
      <Footer />
    </>
  );
}
