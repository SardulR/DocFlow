"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2Icon, CheckCircle2Icon } from "lucide-react";
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

export default function CompressImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [mode, setMode] = useState<"percentage" | "filesize">("percentage");
  const [quality, setQuality] = useState<number>(80);
  const [targetSize, setTargetSize] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const selectedFile = event.target.files?.[0] || null;
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      setDownloadUrl("");
    } else {
      setError("Please select a valid image file (PNG, JPG, WebP, etc.)");
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) =>
    event.preventDefault();
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setError("");
    const droppedFiles = Array.from(event.dataTransfer.files);
    if (droppedFiles.length > 0 && droppedFiles[0].type.startsWith("image/")) {
      setFile(droppedFiles[0]);
      setDownloadUrl("");
    } else {
      setError("Please drop a valid image file");
    }
  };

  const processImage = async () => {
    if (!file) {
      setError("Please select an image file first.");
      return;
    }

    setIsProcessing(true);
    setError("");
    setDownloadUrl("");

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("mode", mode);
      if (mode === "percentage") {
        formData.append("quality", quality.toString());
      }
      if (mode === "filesize") {
        formData.append("targetSize", targetSize);
      }

      const response = await fetch("/api/compress-image", {
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
      console.error("Error compressing image:", err);
      if (err instanceof Error) {
        setError(err.message || "Failed to compress image. Please try again.");
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
              Compressing image, please wait...
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
                    Compress Image
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <h1 className="text-4xl font-extrabold uppercase mt-6">
            DocFlow - Compress Image
          </h1>
          <p className="text-xs font-semibold uppercase mt-2 mb-8 text-zinc-600">
            Reduce file size without losing much quality.
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
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
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

          {/* Options & Action Section */}
          {file && (
            <div className="w-full max-w-2xl mt-8 p-6 rounded-xl bg-white shadow-lg border border-gray-200 space-y-6">
              {/* File Info */}
              <div className="flex items-center text-left">
                <CheckCircle2Icon className="w-5 h-5 text-green-500 mr-2" />
                <p className="text-sm font-semibold uppercase">
                  File Selected:{" "}
                  <span className="font-normal text-gray-700">{file.name}</span>
                </p>
              </div>
              <Separator />

              {/* Compression Mode Selector */}
              <div className="text-left space-y-2">
                <h2 className="text-lg font-semibold uppercase text-gray-700">
                  Compression Mode
                </h2>
                <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
                  <Button
                    variant={mode === "percentage" ? "default" : "outline"}
                    onClick={() => setMode("percentage")}
                    className={cn(
                      "text-sm font-semibold uppercase",
                      mode === "percentage"
                        ? "bg-rose-500 hover:bg-rose-600 text-white"
                        : "border-gray-300 text-gray-700"
                    )}
                  >
                    By Percentage
                  </Button>
                  <Button
                    variant={mode === "filesize" ? "default" : "outline"}
                    onClick={() => setMode("filesize")}
                    className={cn(
                      "text-sm font-semibold uppercase",
                      mode === "filesize"
                        ? "bg-rose-500 hover:bg-rose-600 text-white"
                        : "border-gray-300 text-gray-700"
                    )}
                  >
                    To Target Size
                  </Button>
                </div>
              </div>

              {/* Dynamic Input based on Mode */}
              <div className="text-left space-y-2">
                {mode === "percentage" && (
                  <>
                    <Label
                      htmlFor="quality-input"
                      className="text-sm font-semibold uppercase"
                    >
                      Quality (Percentage)
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="quality-input"
                        type="number"
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        min={1}
                        max={100}
                        className="w-20"
                      />
                      <span className="text-sm font-semibold uppercase">%</span>
                      <Input
                        type="range"
                        min={1}
                        max={100}
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        className="w-full accent-rose-500 cursor-pointer"
                      />
                    </div>
                  </>
                )}

                {mode === "filesize" && (
                  <>
                    <Label
                      htmlFor="target-size-input"
                      className="text-sm font-semibold uppercase"
                    >
                      Target Size (KB)
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="target-size-input"
                        type="number"
                        value={targetSize}
                        onChange={(e) => setTargetSize(e.target.value)}
                        min={1}
                        placeholder="Enter size"
                        className="w-32"
                      />
                      <span className="text-sm font-semibold uppercase">
                        KB
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-300 w-full text-red-600 text-sm font-semibold uppercase">
                  <p>{error}</p>
                </div>
              )}

              {/* Process Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={processImage}
                  disabled={isProcessing}
                  variant={"outline"}
                  className="ring-2 ring-inset ring-rose-400 text-sm font-semibold uppercase"
                >
                  {isProcessing ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Compressing...
                    </>
                  ) : (
                    "Compress Image"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Download Link */}
          {downloadUrl && (
            <div className="w-full max-w-2xl mt-8 p-6 rounded-lg bg-white shadow-lg border border-green-200 text-center">
              <h3 className="text-lg font-semibold uppercase mb-4 text-green-700">
                Success!
              </h3>
              <p className="text-sm font-semibold uppercase text-zinc-600">
                Your compressed image is ready to download.
              </p>
              <Button
                variant={"outline"}
                className="mt-4 ring-2 ring-inset ring-green-500"
              >
                {file && (
                  <a
                    href={downloadUrl}
                    download={`compressed-${file.name}`}
                    className="text-sm font-semibold uppercase"
                  >
                    Download Compressed Image
                  </a>
                )}
              </Button>
            </div>
          )}
        </main>

        {/* Sidebar Container */}
        <aside className="md:w-[25%] p-4 bg-gray-100 border-l border-gray-200">
          <MoreToolsSidebar currentPage={"/compress-image"} />
        </aside>
      </div>
      <Footer />
    </>
  );
}
