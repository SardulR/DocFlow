"use client";

import { useState, useRef, useEffect } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CloudUploadIcon,
  Image as ImageIcon,
  Loader2Icon,
  XCircleIcon,
  CheckCircle2Icon,
  DownloadIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import MoreToolsSidebar from "@/components/MoreToolsSidebar";
import Footer from "@/components/Footer";

export default function RotateFlipImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [rotate, setRotate] = useState<string>("0");
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setDownloadUrl("");
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
    } else {
      setFile(null);
      setError("Please select a valid image file (PNG, JPG, WebP, etc.)");
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
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const droppedFiles = Array.from(event.dataTransfer.files);
    if (droppedFiles.length > 0 && droppedFiles[0].type.startsWith("image/")) {
      setFile(droppedFiles[0]);
      setDownloadUrl("");
      setError("");
    } else {
      setError("Please drop a valid image file");
      setFile(null);
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
      formData.append("rotate", rotate);
      formData.append("flipH", String(flipH));
      formData.append("flipV", String(flipV));

      const response = await fetch("/api/rotate-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (err: unknown) {
      // Changed 'any' to 'unknown'
      console.error("Error rotating/flipping image:", err);
      // Use a type guard to check if the error is an instance of Error
      if (err instanceof Error) {
        setError(err.message || "Failed to process image. Please try again.");
      } else {
        setError("Failed to process image. An unknown error occurred.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setRotate("0");
    setFlipH(false);
    setFlipV(false);
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
                    Rotate & Flip Image
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Header */}
          <h1 className="text-4xl font-extrabold uppercase mt-6">
            DocFlow - Rotate & Flip Image
          </h1>
          <p className="text-xs font-semibold uppercase mt-2 mb-8 text-zinc-600">
            Rotate your image by degrees or flip it horizontally/vertically.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
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
                Click to select or drag & drop an image here
              </p>
              <p className="text-xs font-semibold uppercase mt-1 text-zinc-600">
                Accepted formats: PNG, JPG, WebP, etc.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-2xl p-6 rounded-xl bg-white shadow-lg border border-gray-200 space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-purple-500" />
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

              <div className="space-y-4">
                <h2 className="text-lg font-semibold uppercase">
                  Rotate & Flip Options
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Rotate */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="rotate"
                      className="text-sm font-semibold uppercase"
                    >
                      Rotate (degrees)
                    </Label>
                    <Select
                      onValueChange={(value: string) => setRotate(value)}
                      value={rotate}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0°</SelectItem>
                        <SelectItem value="90">90°</SelectItem>
                        <SelectItem value="180">180°</SelectItem>
                        <SelectItem value="270">270°</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Flip Checkboxes */}
                  <div className="space-y-2 pt-6 flex flex-col">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="flipH"
                        checked={flipH}
                        onCheckedChange={(checked) =>
                          setFlipH(Boolean(checked))
                        }
                      />
                      <Label
                        htmlFor="flipH"
                        className="text-sm font-semibold uppercase"
                      >
                        Flip Horizontally
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="flipV"
                        checked={flipV}
                        onCheckedChange={(checked) =>
                          setFlipV(Boolean(checked))
                        }
                      />
                      <Label
                        htmlFor="flipV"
                        className="text-sm font-semibold uppercase"
                      >
                        Flip Vertically
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

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
                      Processing...
                    </>
                  ) : (
                    "Rotate & Flip Image"
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
                  Processing Complete!
                </h3>
                <p className="text-sm font-semibold uppercase text-zinc-600">
                  Your modified image is ready for download.
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
                  Download Image
                </a>
              </Button>
            </div>
          )}
        </main>

        {/* Sidebar Container */}
        <aside className="md:w-[25%] p-4 bg-gray-100 border-l border-gray-200">
          <MoreToolsSidebar currentPage={"/rotate-image"} />
        </aside>
      </div>
      <Footer />
    </>
  );
}
