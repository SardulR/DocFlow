"use client";

import { useState, useRef, useEffect } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import axios from "axios";
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
  CircleXIcon,
  Loader2Icon,
  CheckCircle2Icon,
  Repeat2Icon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import MoreToolsSidebar from "@/components/MoreToolsSidebar";
import Footer from "@/components/Footer";

export default function ExcelToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const resetState = () => {
    setFile(null);
    setLoading(false);
    setError("");
    setDownloadUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setDownloadUrl("");
    if (!file) {
      setError("Please select an Excel file.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("excel", file);

    try {
      const res = await axios.post("/api/excel-to-pdf", formData, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      setDownloadUrl(url);
    } catch (err: unknown) {
      console.error("Conversion failed:", err);
      // More specific error handling
      if (axios.isAxiosError(err)) {
        setError(
          err.message || "Conversion failed. Please try a different file."
        );
      } else if (err instanceof Error) {
        setError(err.message || "An unexpected error occurred.");
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    if (
      selectedFile &&
      (selectedFile.type === "application/vnd.ms-excel" ||
        selectedFile.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    ) {
      setFile(selectedFile);
      setError("");
      setDownloadUrl(""); // Reset download URL on new file selection
    } else {
      setFile(null);
      setError("Please select a valid Excel file (.xlsx or .xls).");
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const droppedFile = event.dataTransfer.files?.[0] || null;
    if (
      droppedFile &&
      (droppedFile.type === "application/vnd.ms-excel" ||
        droppedFile.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    ) {
      setFile(droppedFile);
      setError("");
      setDownloadUrl(""); // Reset download URL on new file drop
    } else {
      setFile(null);
      setError("Please drop a valid Excel file (.xlsx or .xls).");
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

  return (
    <>
      <Navbar />

      {/* Full-screen Loader Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <Loader2Icon className="h-12 w-12 animate-spin text-rose-400" />
            <p className="mt-4 text-sm font-semibold uppercase text-gray-700">
              Converting Excel to PDF, please wait...
            </p>
          </div>
        </div>
      )}

      {/* Main content container */}
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
        {/* Main content area */}
        <main className="flex-1 p-4 md:p-8 flex flex-col items-center text-center">
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
                    Excel to PDF
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <h1 className="text-4xl font-extrabold uppercase mt-6">
            DocFlow - Excel to PDF
          </h1>
          <p className="text-xs font-semibold uppercase mt-2 mb-8 text-zinc-600">
            Convert your Excel spreadsheets to a PDF document.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx, .xls"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Conditional Rendering based on file and downloadUrl state */}
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
              <p className="text-sm font-semibold uppercase">
                Click to select or drag & drop an Excel file here
              </p>
              <p className="text-xs font-semibold uppercase mt-2 text-zinc-600">
                Accepted formats: .xlsx, .xls
              </p>
            </div>
          ) : (
            <div className="w-full max-w-2xl mt-8 p-6 rounded-xl bg-white shadow-lg border border-gray-200 space-y-6">
              {/* File Info */}
              <div className="flex items-center justify-between text-left">
                <div className="flex items-center space-x-2">
                  <CheckCircle2Icon className="w-5 h-5 text-green-500" />
                  <p className="text-sm font-semibold uppercase">
                    File Selected:{" "}
                    <span className="font-normal text-gray-700">
                      {file.name}
                    </span>
                  </p>
                </div>
                {/* Remove File Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetState}
                  className="p-1 h-auto text-red-500 hover:bg-red-50 hover:text-red-700 transition-all"
                >
                  <CircleXIcon className="h-5 w-5" />
                </Button>
              </div>
              <Separator />

              {/* Action Buttons */}
              <div className="flex justify-center pt-4 md:space-x-4 gap-4 flex-wrap">
                {downloadUrl ? (
                  <>
                    <Button
                      variant={"outline"}
                      className="ring-2 ring-inset ring-green-500"
                    >
                      <a
                        href={downloadUrl}
                        download={`${file.name.replace(
                          /\.(xlsx|xls)$/,
                          ""
                        )}.pdf`}
                        className="text-sm font-semibold uppercase"
                      >
                        Download PDF
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
                  </>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!file || loading}
                    variant={"outline"}
                    className="ring-2 ring-inset ring-rose-400 text-sm font-semibold uppercase"
                  >
                    {loading ? (
                      <>
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      "Convert to PDF"
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="w-full max-w-2xl mt-8 p-4 rounded-lg bg-red-50 border border-red-300 text-red-600 text-sm font-semibold uppercase text-left">
              <p>{error}</p>
            </div>
          )}
        </main>

        {/* Sidebar Container */}
        <aside className="md:w-[25%] p-4 bg-gray-100 border-l border-gray-200">
          <MoreToolsSidebar currentPage={"/excel-to-pdf"} />
        </aside>
      </div>
      <Footer />
    </>
  );
}
