"use client";

import { useState, useRef } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2Icon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import MoreToolsSidebar from "@/components/MoreToolsSidebar";
import Footer from "@/components/Footer";
import Image from "next/image";

export default function FilterImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    brightness: 1,
    contrast: 1,
    saturate: 1,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // New core function to handle file processing
  const handleFiles = (files: FileList | null) => {
    setError("");
    const selectedFile = files?.[0] || null;
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setDownloadUrl("");
    } else {
      setError("Please select a valid image file (PNG, JPG, WebP, etc.)");
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: parseFloat(value) }));
  };

  const processImage = async () => {
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    setIsProcessing(true);
    setError("");
    setDownloadUrl("");

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("brightness", filters.brightness.toString());
      formData.append("contrast", filters.contrast.toString());
      formData.append("saturate", filters.saturate.toString());

      const response = await fetch("/api/add-filters", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server Error");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message || "Failed to apply filters.");
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Navbar />

      {/* Full-screen Loader Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <Loader2Icon className="h-12 w-12 animate-spin text-rose-400" />
            <p className="mt-4 text-sm font-semibold uppercase text-gray-700">
              Applying filters, please wait...
            </p>
          </div>
        </div>
      )}

      {/* Main content container. Using flexbox for better vertical stacking and spacing. */}
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
                    Add Filters
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <h1 className="text-4xl font-extrabold uppercase mt-6">
            DocFlow - Add Filters
          </h1>
          <p className="text-xs font-semibold uppercase mt-2 mb-8 text-zinc-600">
            Adjust brightness, contrast, and saturation.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
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
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <p className="text-sm font-semibold uppercase">
              Click to select or drag & drop an image here
            </p>
            {file && (
              <p className="mt-2 text-sm font-medium">
                Selected: <span className="font-bold">{file.name}</span>
              </p>
            )}
          </div>

          {/* Main Controls and Preview Section */}
          {file && (
            <div className="w-full max-w-2xl mt-8 p-6 rounded-xl bg-white shadow-lg border border-gray-200 space-y-6">
              <div className="grid md:grid-cols-2 gap-6 items-start">
                {/* Filters Controls */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold uppercase text-gray-700">
                    Filters
                  </h2>
                  {Object.entries(filters).map(([filterName, value]) => (
                    <div key={filterName} className="space-y-2">
                      <Label className="text-sm font-semibold uppercase flex justify-between">
                        <span>
                          {filterName.charAt(0).toUpperCase() +
                            filterName.slice(1)}
                        </span>
                        <span>{value.toFixed(2)}</span>
                      </Label>
                      <Input
                        type="range"
                        name={filterName}
                        min="0"
                        max="2"
                        step="0.01"
                        value={value}
                        onChange={handleChange}
                        className="w-full accent-rose-500 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>

                {/* Live Preview */}
                <div className="flex flex-col items-center justify-center">
                  <h2 className="text-xl font-semibold uppercase text-gray-700 mb-4">
                    Live Preview
                  </h2>
                  {previewUrl && (
                    <div className="w-full max-w-[300px] aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border shadow-inner">
                      <Image
                        src={previewUrl}
                        alt="Live preview of filtered image"
                        width={300}
                        height={300}
                        className="max-w-full max-h-full object-contain"
                        style={{
                          filter: `brightness(${filters.brightness}) contrast(${filters.contrast}) saturate(${filters.saturate})`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Action and Download Buttons */}
              <div className="flex flex-col items-center">
                {error && (
                  <p className="mt-4 text-sm font-semibold uppercase text-red-600">
                    {error}
                  </p>
                )}

                {downloadUrl ? (
                  <div className="w-full text-center p-4 rounded-lg bg-green-50 border border-green-300">
                    <h3 className="text-lg font-semibold uppercase mb-4 text-green-700">
                      Success!
                    </h3>
                    <Button
                      variant={"outline"}
                      className="ring-2 ring-inset ring-green-500"
                    >
                      <a
                        href={downloadUrl}
                        download={`filtered-${file.name}`}
                        className="font-semibold text-sm uppercase text-green-700"
                      >
                        Download Filtered Image
                      </a>
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={processImage}
                    disabled={isProcessing}
                    className="ring-2 ring-inset ring-rose-400 text-sm font-semibold uppercase mt-4"
                    variant={"outline"}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        Applying Filters...
                      </>
                    ) : (
                      "Apply Filters"
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Sidebar Container */}
        <aside className="md:w-[25%] p-4 bg-gray-100 border-l border-gray-200">
          <MoreToolsSidebar currentPage={"/add-filters"} />
        </aside>
      </div>
      <Footer />
    </>
  );
}
