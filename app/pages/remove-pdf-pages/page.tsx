"use client";

import { useState, useRef } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import axios, { AxiosError } from "axios";
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
import { Input } from "@/components/ui/input";
import {
  CloudUploadIcon,
  FileTextIcon,
  CircleXIcon,
  Loader2Icon,
  CheckCircle2Icon,
  DownloadIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import MoreToolsSidebar from "@/components/MoreToolsSidebar";
import Footer from "@/components/Footer";

export default function PDFRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [pagesToRemove, setPagesToRemove] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setDownloadUrl("");
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      setFile(null);
      setError("Please select a valid PDF file.");
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    setError("");
    setDownloadUrl("");
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
    } else {
      setFile(null);
      setError("Please drop a valid PDF file.");
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
    setError("");
    setDownloadUrl("");
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }
    if (!pagesToRemove) {
      setError("Please enter the pages to remove.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("pagesToRemove", pagesToRemove);

    try {
      const res = await axios.post("/api/remove-pdf-pages", formData, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      setDownloadUrl(url);
    } catch (err: unknown) {
      console.error(err);
      let errorMessage = "Failed to remove pages. Please try again.";

      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError;
        if (axiosError.response?.data) {
          // Assuming the server sends back a text error message
          const errorText = await new Response(
            axiosError.response.data as Blob
          ).text();
          errorMessage = errorText;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPagesToRemove("");
    setError("");
    setDownloadUrl("");
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
                    Remove PDF Pages
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Header */}
          <h1 className="text-4xl font-extrabold uppercase mt-6">
            DocFlow - Remove PDF Pages
          </h1>
          <p className="text-xs font-semibold uppercase mt-2 mb-8 text-zinc-600">
            Easily remove selected pages from your PDF document.
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
                  <FileTextIcon className="w-5 h-5 text-rose-500" />
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
                  <CircleXIcon className="h-5 w-5" />
                </Button>
              </div>
              <Separator />
              <div className="space-y-2">
                <label
                  htmlFor="pagesToRemove"
                  className="block text-sm font-semibold uppercase text-zinc-600"
                >
                  Pages to Remove (e.g., 1, 3-5, 8)
                </label>
                <Input
                  type="text"
                  id="pagesToRemove"
                  value={pagesToRemove}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPagesToRemove(e.target.value)
                  }
                  className="text-center"
                  placeholder="e.g., 1, 3-5, 8"
                />
              </div>
              <div className="flex justify-center pt-2">
                <Button
                  onClick={handleSubmit} // Removed 'as any'
                  disabled={!file || !pagesToRemove || loading}
                  variant={"outline"}
                  className="ring-2 ring-inset ring-rose-400 text-sm font-semibold uppercase"
                >
                  {loading ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Removing Pages...
                    </>
                  ) : (
                    "Remove Pages"
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

          {/* Download Link */}
          {downloadUrl && (
            <div className="w-full max-w-2xl mt-8 p-6 rounded-xl bg-white shadow-lg border border-green-200 text-center space-y-4">
              <div className="flex flex-col items-center">
                <CheckCircle2Icon className="h-12 w-12 text-green-500" />
                <h3 className="text-lg font-semibold uppercase mt-2 text-green-700">
                  Pages Removed Successfully!
                </h3>
                <p className="text-sm font-semibold uppercase text-zinc-600">
                  Your modified PDF is ready for download.
                </p>
              </div>
              <Button
                variant={"outline"}
                className="mt-4 ring-2 ring-inset ring-green-500"
              >
                <a
                  href={downloadUrl}
                  download={`modified-${file?.name}`}
                  className="text-sm font-semibold uppercase text-green-700 flex items-center"
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Download The PDF
                </a>
              </Button>
            </div>
          )}
        </main>

        {/* Sidebar Container */}
        <aside className="md:w-[25%] p-4 bg-gray-100 border-l border-gray-200">
          <MoreToolsSidebar currentPage={"/remove-pdf-pages"} />
        </aside>
      </div>
      <Footer />
    </>
  );
}
