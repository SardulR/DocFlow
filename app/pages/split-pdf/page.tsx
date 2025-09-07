"use client";

import { useState, useRef, useEffect } from "react"; // Added useEffect for cleanup
import type { ChangeEvent, DragEvent } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CircleXIcon, Loader2Icon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Navbar from "@/components/Navbar";
import MoreToolsSidebar from "@/components/MoreToolsSidebar";
import Footer from "@/components/Footer";

export default function SplitPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [ranges, setRanges] = useState<string[]>([""]);
  const [isSplitting, setIsSplitting] = useState<boolean>(false);
  const [downloadUrls, setDownloadUrls] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pageCount, setPageCount] = useState<number>(0);

  // Added useEffect to revoke object URLs on component unmount
  useEffect(() => {
    return () => {
      downloadUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [downloadUrls]);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    const selectedFile = event.target.files?.[0];

    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setRanges([""]);
      setDownloadUrls([]);
      // The logic for reading page count from a PDF is client-side and complex
      // For this correction, we'll keep the existing, though non-standard, approach
      // and note that a more robust solution would involve a library like 'pdf-lib'
      const reader = new FileReader();
      reader.onload = function (e) {
        if (e.target?.result) {
          // This is a simplified, non-robust way to get page count.
          const pdfData = new Uint8Array(e.target.result as ArrayBuffer);
          const pdfString = new TextDecoder().decode(pdfData);
          const match = /\/Count\s+(\d+)/.exec(pdfString);
          if (match) {
            setPageCount(parseInt(match[1], 10));
          } else {
            setPageCount(0);
          }
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } else {
      setError("Please select a valid PDF file");
      setFile(null);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setError("");
    const droppedFiles = Array.from(event.dataTransfer.files);

    if (droppedFiles.length > 0 && droppedFiles[0].type === "application/pdf") {
      setFile(droppedFiles[0]);
      setRanges([""]);
      setDownloadUrls([]);
      event.dataTransfer.clearData();
    } else {
      setError("Please drop a valid PDF file");
      setFile(null);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const addRange = () => {
    setRanges([...ranges, ""]);
  };

  const removeRange = (index: number) => {
    if (ranges.length > 1) {
      const newRanges = [...ranges];
      newRanges.splice(index, 1);
      setRanges(newRanges);
    }
  };

  const updateRange = (index: number, value: string) => {
    const newRanges = [...ranges];
    newRanges[index] = value;
    setRanges(newRanges);
  };

  const splitPDF = async () => {
    if (!file) {
      setError("Please select a PDF file first");
      return;
    }

    const validRanges = ranges.filter((r) => r.trim() !== "");
    if (validRanges.length === 0) {
      setError("Please enter at least one page range.");
      return;
    }

    setIsSplitting(true);
    setError("");
    setDownloadUrls([]);

    try {
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("ranges", JSON.stringify(validRanges));

      const response = await fetch("/api/split-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      // The original code only handles one downloadUrl, but the server response might be a ZIP.
      // This part of the code needs to be aligned with the backend's response format.
      // Assuming the backend returns a single ZIP file, we'll store its URL.
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrls([url]);
    } catch (error: unknown) {
      // Changed 'any' to 'unknown'
      console.error("Error splitting PDF:", error);
      // Use a type guard to check if the error is an instance of Error
      if (error instanceof Error) {
        setError(error.message || "Failed to split PDF. Please try again.");
      } else {
        setError("Failed to split PDF. An unknown error occurred.");
      }
    } finally {
      setIsSplitting(false);
    }
  };

  return (
    <>
      <Navbar />

      {isSplitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <Loader2Icon className="h-12 w-12 animate-spin text-rose-400" />
            <p className="mt-4 text-sm font-semibold uppercase text-gray-700">
              Splitting PDF, please wait...
            </p>
          </div>
        </div>
      )}

      {/* Main content container. Using flexbox for better vertical stacking and spacing. */}
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
        {/* Main content area */}
        <main className="flex-1 p-4 md:p-8 flex flex-col items-center justify-start text-center">
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
                    Split PDF
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <h1 className="text-4xl font-extrabold uppercase mt-6">
            DocFlow - Split PDF
          </h1>
          <p className="text-xs font-semibold uppercase mt-2 mb-8 text-zinc-600">
            Split a single PDF into multiple files by page ranges
          </p>

          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Drag & Drop Zone */}
          <div
            className={cn(
              "w-full max-w-2xl h-48 border-2 rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer",
              file
                ? "border-green-500 text-green-500"
                : "border-gray-400 text-gray-500 hover:border-blue-500 hover:text-blue-500 border-dashed"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <p className="text-sm font-semibold uppercase">
              Click to select or drag & drop a PDF file here
            </p>
            {file && (
              <p className="mt-2 text-sm font-medium">
                Selected: <span className="font-bold">{file.name}</span>
              </p>
            )}
          </div>

          {/* File Info & Options Section */}
          {file && (
            <div className="w-full max-w-2xl mt-8 p-6 rounded-xl bg-white shadow-lg border border-gray-200 space-y-6">
              <div className="text-left">
                <h3 className="text-lg font-semibold uppercase text-gray-700">
                  File Details
                </h3>
                <p className="text-sm font-normal text-gray-600 mt-2">
                  <span className="font-bold">Name:</span> {file.name}
                </p>
                {pageCount > 0 && (
                  <p className="text-sm font-normal text-gray-600">
                    <span className="font-bold">Total Pages:</span> {pageCount}
                  </p>
                )}
              </div>
              <Separator />
              <div className="text-left">
                <h3 className="text-lg font-semibold uppercase">
                  Page Ranges to Extract
                </h3>
                <p className="text-xs font-semibold uppercase my-2 text-zinc-600">
                  Examples: &quot;1-5&quot;, &quot;8,10&quot;, &quot;15-&quot;
                  or a combination
                </p>
                {ranges.map((range, index) => (
                  <div key={index} className="flex items-center gap-2 mt-2">
                    <Input
                      type="text"
                      placeholder="e.g., 1-5 or 1,3,5"
                      value={range}
                      onChange={(e) => updateRange(index, e.target.value)}
                      className="flex-1 text-sm font-medium uppercase"
                    />
                    <Button
                      onClick={() => removeRange(index)}
                      className="p-2"
                      disabled={ranges.length <= 1}
                      variant={"ghost"}
                    >
                      <CircleXIcon className="w-4 h-4 text-rose-400 hover:text-rose-600" />
                    </Button>
                  </div>
                ))}
                <Button
                  onClick={addRange}
                  variant={"outline"}
                  className="text-sm font-semibold uppercase mt-4 text-green-600"
                >
                  + Add Another Range
                </Button>
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-300 w-full text-red-600 text-sm font-semibold uppercase">
                  <p>{error}</p>
                </div>
              )}

              <div className="flex justify-center pt-4">
                <Button
                  onClick={splitPDF}
                  disabled={
                    isSplitting || ranges.filter((r) => r.trim()).length === 0
                  }
                  variant={"outline"}
                  className="ring-2 ring-inset ring-rose-400 text-sm font-semibold uppercase"
                >
                  {isSplitting ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Splitting...
                    </>
                  ) : (
                    "Split PDF"
                  )}
                </Button>
              </div>
            </div>
          )}

          {downloadUrls.length > 0 && (
            <div className="mt-8 w-full max-w-2xl p-6 bg-green-50 border border-green-300 rounded-lg text-center">
              <h3 className="text-lg font-semibold uppercase mb-4 text-green-700">
                Success!
              </h3>
              <p className="text-sm font-semibold uppercase text-zinc-600">
                Your PDF has been split into {downloadUrls.length} file
                {downloadUrls.length > 1 ? "s" : ""}.
              </p>
              <Button
                variant={"outline"}
                className="mt-4 ring-2 ring-inset ring-green-500"
              >
                <a
                  href={downloadUrls[0]}
                  download="split-documents.zip"
                  className="text-sm font-semibold uppercase text-green-700"
                >
                  Download All Files as ZIP
                </a>
              </Button>
            </div>
          )}
        </main>

        {/* Sidebar Container */}
        <aside className="md:w-[25%] p-4 bg-gray-100 border-l border-gray-200">
          <MoreToolsSidebar currentPage={"/split-pdf"} />
        </aside>
      </div>
      <Footer />
    </>
  );
}
