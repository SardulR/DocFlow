"use client";

import { useState, useRef } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CloudUploadIcon,
  FileIcon,
  Loader2Icon,
  XCircleIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FileTextIcon,
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

// Accepted Word document MIME types
const ACCEPTED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword' // .doc
];

export default function WordToPDFConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidWordFile = (file: File): boolean => {
    // Check MIME type
    if (ACCEPTED_MIME_TYPES.includes(file.type)) {
      return true;
    }
    
    // Check file extension as fallback
    const fileName = file.name.toLowerCase();
    return fileName.endsWith('.docx') || fileName.endsWith('.doc');
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setDownloadUrl("");
    const selectedFile = event.target.files?.[0];

    if (selectedFile && isValidWordFile(selectedFile)) {
      setFile(selectedFile);
      setOriginalSize(selectedFile.size);
    } else {
      setFile(null);
      setError("Please select a valid Word document (.docx or .doc file).");
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    setError("");
    setDownloadUrl("");
    const droppedFile = event.dataTransfer.files[0];

    if (droppedFile && isValidWordFile(droppedFile)) {
      setFile(droppedFile);
      setOriginalSize(droppedFile.size);
      event.dataTransfer.clearData();
    } else {
      setFile(null);
      setError("Please drop a valid Word document (.docx or .doc file).");
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

  const handleSubmit = async (e: FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a Word document first.");
      return;
    }

    // Check file size (10MB limit as per your API)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("File size exceeds 10MB limit. Please select a smaller file.");
      return;
    }

    setIsConverting(true);
    setError("");
    setDownloadUrl("");

    const formData = new FormData();
    formData.append("file", file); // Using "file" to match your API route

    try {
      const response = await fetch("/api/word-to-pdf", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setDownloadUrl(url);
      } else {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (err: unknown) {
      console.error("Error converting Word to PDF:", err);
      if (err instanceof Error) {
        setError(err.message || "Failed to convert Word document to PDF. Please try again.");
      } else {
        setError("Failed to convert Word document to PDF. Please try again.");
      }
    } finally {
      setIsConverting(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setOriginalSize(0);
    setDownloadUrl("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = () => {
    if (!file) return <FileIcon className="w-5 h-5 text-blue-500" />;
    
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.docx')) {
      return <FileTextIcon className="w-5 h-5 text-blue-600" />;
    } else if (fileName.endsWith('.doc')) {
      return <FileIcon className="w-5 h-5 text-blue-500" />;
    }
    return <FileIcon className="w-5 h-5 text-blue-500" />;
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
                    Word to PDF
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Header */}
          <h1 className="text-4xl font-extrabold uppercase mt-6">
            DocFlow - Convert Word to PDF
          </h1>
          <p className="text-xs font-semibold uppercase mt-2 mb-8 text-zinc-600">
            Convert Word documents (.doc, .docx) into PDF files.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileSelect}
            style={{ display: "none" }}
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
                Click to select or drag & drop a Word document here
              </p>
              <p className="text-xs font-semibold uppercase mt-1 text-zinc-600">
                Accepted formats: .doc, .docx (Max size: 10MB)
              </p>
            </div>
          ) : (
            <div className="w-full max-w-2xl p-6 rounded-xl bg-white shadow-lg border border-gray-200 space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getFileIcon()}
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold uppercase">
                      Selected Document:{" "}
                      <span className="font-normal text-gray-700">
                        {file.name}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 uppercase mt-1">
                      File size: {formatFileSize(originalSize)}
                    </p>
                  </div>
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
                  onClick={handleSubmit}
                  disabled={isConverting}
                  variant={"outline"}
                  className="ring-2 ring-inset ring-blue-400 text-sm font-semibold uppercase hover:bg-blue-50 hover:text-blue-700"
                >
                  {isConverting ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Converting to PDF...
                    </>
                  ) : (
                    <>
                      <FileIcon className="mr-2 h-4 w-4" />
                      Convert to PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="w-full max-w-2xl mt-8 p-4 rounded-lg bg-red-50 border border-red-300 text-red-600 text-sm font-semibold uppercase text-left">
              <div className="flex items-start space-x-2">
                <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Conversion Results */}
          {downloadUrl && (
            <div className="w-full max-w-2xl mt-8 p-6 rounded-xl bg-white shadow-lg border border-green-200 text-center space-y-4">
              <div className="flex flex-col items-center">
                <CheckCircle2Icon className="h-12 w-12 text-green-500" />
                <h3 className="text-lg font-semibold uppercase mt-2 text-green-700">
                  Word to PDF Conversion Complete
                </h3>
                <p className="text-sm font-semibold uppercase text-zinc-600">
                  Your PDF document is ready for download.
                </p>
              </div>
              <Button
                variant={"outline"}
                className="mt-4 ring-2 ring-inset ring-green-500 hover:bg-green-50 hover:text-green-700"
              >
                <a
                  href={downloadUrl}
                  download={`${file?.name.replace(/\.(docx?|DOCX?)$/, '')}_converted.pdf`}
                  className="text-sm font-semibold uppercase text-green-700 flex items-center"
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Download PDF File
                </a>
              </Button>
              
              {/* Additional Info */}
              <div className="text-xs text-gray-500 uppercase mt-4 pt-4 border-t border-gray-200">
                <p>Original: {file?.name} ({formatFileSize(originalSize)})</p>
                <p className="mt-1">Converted: PDF Document</p>
              </div>
            </div>
          )}

          {/* Conversion Info */}
          <div className="w-full max-w-2xl mt-12 p-6 rounded-xl bg-blue-50 border border-blue-200">
            <h3 className="text-lg font-semibold uppercase text-blue-800 mb-3">
              Conversion Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start space-x-2">
                <CheckCircle2Icon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-blue-700">Preserves document formatting</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2Icon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-blue-700">Maintains text and images</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2Icon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-blue-700">Supports .doc and .docx files</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2Icon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-blue-700">Fast and secure conversion</span>
              </div>
            </div>
          </div>
        </main>

        {/* Sidebar Container */}
        <aside className="md:w-[25%] p-4 bg-gray-100 border-l border-gray-200">
          <MoreToolsSidebar currentPage={"/word-to-pdf"} />
        </aside>
      </div>
      <Footer />
    </>
  );
}