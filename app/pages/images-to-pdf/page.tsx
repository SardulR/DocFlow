"use client";

import { useState, useRef, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Loader2Icon,
  CheckCircle2Icon,
  Image as ImageIcon,
  CircleXIcon,
  Repeat2Icon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import MoreToolsSidebar from "@/components/MoreToolsSidebar";
import Footer from "@/components/Footer";

export default function ImagesToPDFConverter() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL when component unmounts or downloadUrl changes
  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const resetState = () => {
    setFiles([]);
    setLoading(false);
    setError("");
    setDownloadUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validImageFiles = selectedFiles.filter((file) =>
      file.type.startsWith("image/")
    );
    setFiles(validImageFiles);
    setError("");
    setDownloadUrl("");
    if (validImageFiles.length !== selectedFiles.length) {
      setError("Some selected files were not images and were ignored.");
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const droppedFiles = Array.from(event.dataTransfer.files);
    const validImageFiles = droppedFiles.filter((file) =>
      file.type.startsWith("image/")
    );
    if (validImageFiles.length > 0) {
      setFiles(validImageFiles);
      setError("");
      setDownloadUrl("");
      if (validImageFiles.length !== droppedFiles.length) {
        setError("Some dropped files were not images and were ignored.");
      }
    } else {
      setFiles([]);
      setError("Please drop valid image files.");
      setDownloadUrl("");
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError("Please select at least one image file.");
      return;
    }

    setLoading(true);
    setError("");
    setDownloadUrl("");

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const response = await fetch("/api/images-to-pdf", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setDownloadUrl(url);
      } else {
        const errorText = await response.text();
        try {
          // Attempt to parse JSON error message from the server
          const errorData = JSON.parse(errorText);
          setError(errorData.message || "Something went wrong.");
        } catch {
          // Fallback to generic message if JSON parsing fails
          setError("Something went wrong on the server.");
        }
      }
    } catch (err: unknown) {
      // Use unknown for type safety
      console.error(err);
      if (err instanceof Error) {
        setError(err.message || "Failed to connect to the server.");
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFile = (fileToRemove: File) => {
    setFiles(files.filter((file) => file !== fileToRemove));
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
              Converting images to PDF, please wait...
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
                    Images to PDF
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <h1 className="text-4xl font-extrabold uppercase mt-6">
            DocFlow - Images to PDF
          </h1>
          <p className="text-xs font-semibold uppercase mt-2 mb-8 text-zinc-600">
            Combine your images into a single PDF document.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Conditional Rendering based on file and downloadUrl state */}
          {!files.length || downloadUrl ? (
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
                Click to select or drag & drop images here
              </p>
              <p className="text-xs font-semibold uppercase mt-2 text-zinc-600">
                Accepted formats: JPG, PNG, etc.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-2xl mt-8 p-6 rounded-xl bg-white shadow-lg border border-gray-200 space-y-6">
              {/* File List */}
              <div className="text-left">
                <h4 className="text-lg font-semibold uppercase mb-2">
                  Selected Files ({files.length}):
                </h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-40 overflow-y-auto pr-2">
                  {files.map((file, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-2">
                        <ImageIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700 font-medium truncate">
                          {file.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file)}
                        className="p-1 h-auto text-red-500 hover:bg-red-50 hover:text-red-700 transition-all"
                      >
                        <CircleXIcon className="h-5 w-5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator />

              {/* Convert Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={loading || files.length === 0}
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
            <div className="w-full max-w-2xl mt-8 p-6 rounded-lg bg-white shadow-lg border border-green-200 text-center">
              <h3 className="text-lg font-semibold uppercase mb-4 text-green-700">
                Conversion Successful!
              </h3>
              <p className="text-sm font-semibold uppercase text-zinc-600">
                Your new PDF is ready to download.
              </p>
              <div className="flex justify-center mt-4 md:space-x-4 flex-wrap gap-4">
                <Button
                  variant={"outline"}
                  className="ring-2 ring-inset ring-green-500"
                >
                  <a
                    href={downloadUrl}
                    download="images-converted.pdf"
                    className="text-sm font-semibold uppercase"
                  >
                    Download The PDF
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
          <MoreToolsSidebar currentPage={"/images-to-pdf"} />
        </aside>
      </div>
      <Footer />
    </>
  );
}
