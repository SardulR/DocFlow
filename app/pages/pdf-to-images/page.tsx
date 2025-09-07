"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  CloudUploadIcon,
  Loader2Icon,
  FileIcon,
  XCircleIcon,
  CheckCircle2Icon,
  DownloadIcon,
  Repeat2Icon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import MoreToolsSidebar from "@/components/MoreToolsSidebar";
import Footer from "@/components/Footer";

export default function PdfToImagesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unified function to reset all state
  const resetState = useCallback(() => {
    setFile(null);
    setMessage("");
    setDownloadUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Clean up previous URL if it exists
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
  }, [downloadUrl]);

  // Effect to clean up the download URL when component unmounts or URL changes
  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    resetState();
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      setMessage("Please select a valid PDF file.");
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    resetState();
    const droppedFile = event.dataTransfer.files[0];

    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
    } else {
      setMessage("Please drop a valid PDF file.");
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

  const handleSubmit = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }
    setIsLoading(true);
    setMessage("Processing your PDF... This may take a moment.");
    setDownloadUrl("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/pdf-to-images", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setDownloadUrl(url);
        setMessage("Success! Your images are ready to download.");
      } else {
        const errorText = await response.text();
        console.log("File to be sent:", file);
        setMessage(`Error: ${errorText || "An unknown error occurred."}`);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setMessage("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
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
                    PDF to Images
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Header */}
          <h1 className="text-4xl font-extrabold uppercase mt-6">
            DocFlow - Convert PDF to Images
          </h1>
          <p className="text-xs font-semibold uppercase mt-2 mb-8 text-zinc-600">
            Convert a PDF into a ZIP file containing each page as a separate JPG
            image.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Drop Zone / File Info */}
          {!file || downloadUrl ? (
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
                  onClick={resetState}
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
                  disabled={isLoading}
                  variant={"outline"}
                  className="ring-2 ring-inset ring-rose-400 text-sm font-semibold uppercase"
                >
                  {isLoading ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    "Convert to Images"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Messages & Download Link */}
          {message && (
            <div
              className={cn(
                "w-full max-w-2xl mt-8 p-4 rounded-lg text-sm font-semibold uppercase text-left",
                message.includes("Error")
                  ? "bg-red-50 border border-red-300 text-red-600"
                  : "bg-blue-50 border border-blue-300 text-blue-600"
              )}
            >
              <p>{message}</p>
            </div>
          )}

          {downloadUrl && (
            <div className="w-full max-w-2xl mt-8 p-6 rounded-xl bg-white shadow-lg border border-green-200 text-center space-y-4">
              <div className="flex flex-col items-center">
                <CheckCircle2Icon className="h-12 w-12 text-green-500" />
                <h3 className="text-lg font-semibold uppercase mt-2 text-green-700">
                  Conversion Complete
                </h3>
                <p className="text-sm font-semibold uppercase text-zinc-600">
                  Your ZIP file is ready for download.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <Button
                  variant={"outline"}
                  className="ring-2 ring-inset ring-green-500"
                >
                  <a
                    href={downloadUrl}
                    download={`converted-${file?.name.replace(
                      ".pdf",
                      "-images.zip"
                    )}`}
                    className="text-sm font-semibold uppercase text-green-700 flex items-center"
                  >
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Download ZIP File
                  </a>
                </Button>
                <Button
                  onClick={resetState}
                  variant={"outline"}
                  className="ring-2 ring-inset ring-gray-400 text-sm font-semibold uppercase"
                >
                  <Repeat2Icon className="mr-2 h-4 w-4" />
                  Convert another
                </Button>
              </div>
            </div>
          )}
        </main>

        {/* Sidebar Container */}
        <aside className="md:w-[25%] p-4 bg-gray-100 border-l border-gray-200">
          <MoreToolsSidebar currentPage={"/pdf-to-images"} />
        </aside>
      </div>
      <Footer />
    </>
  );
}
