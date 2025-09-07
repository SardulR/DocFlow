"use client";

import { useState, useRef, useEffect } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

// Define a type for the pixelsData state
interface PixelsData {
  width: number;
  height: number;
}

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function ResizeImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [resizeMethod, setResizeMethod] = useState<"pixels" | "percentage">(
    "pixels"
  );
  const [pixelsData, setPixelsData] = useState<PixelsData>({
    width: 800,
    height: 600,
  });
  const [percentageData, setPercentageData] = useState<number>(50);
  const [outputFormat, setOutputFormat] = useState<string>("png");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalSize = file ? file.size : 0;

  // Reset values when method changes
  useEffect(() => {
    if (resizeMethod === "pixels") setPixelsData({ width: 800, height: 600 });
    else setPercentageData(50);
  }, [resizeMethod]);

  // Cleanup object URLs
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
      setError("Please select a valid image file (PNG, JPG, etc.)");
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
    } else {
      setError("Please drop a valid image file");
      setFile(null);
    }
  };

  const handlePixelsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPixelsData((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const processImage = async () => {
    if (!file) return setError("Please select an image file first.");

    if (
      resizeMethod === "pixels" &&
      (pixelsData.width <= 0 || pixelsData.height <= 0)
    ) {
      return setError("Width and height must be greater than 0.");
    }

    if (
      resizeMethod === "percentage" &&
      (percentageData <= 0 || percentageData > 200)
    ) {
      return setError("Percentage must be between 1 and 200.");
    }

    setIsProcessing(true);
    setError("");
    setDownloadUrl("");

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("method", resizeMethod);
      formData.append("outputFormat", outputFormat);
      if (resizeMethod === "pixels") {
        formData.append("width", pixelsData.width.toString());
        formData.append("height", pixelsData.height.toString());
      } else {
        formData.append("percentage", percentageData.toString());
      }

      const response = await fetch("/api/resize-image", {
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
      console.error("Error resizing image:", err);
      // Safely handle the error by checking if it's an instance of Error
      if (err instanceof Error) {
        setError(err.message || "Failed to resize image. Please try again.");
      } else {
        setError("Failed to resize image. An unknown error occurred.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setDownloadUrl("");
    setError("");
    setPixelsData({ width: 800, height: 600 });
    setPercentageData(50);
    setOutputFormat("png");
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
                    Resize Image
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Header */}
          <h1 className="text-4xl font-extrabold uppercase mt-6">
            DocFlow - Resize Image
          </h1>
          <p className="text-xs font-semibold uppercase mt-2 mb-8 text-zinc-600">
            Resize your images by pixels or percentage.
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
                  <p className="text-xs font-normal text-zinc-600">
                    ({formatFileSize(originalSize)})
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
                  Resizing Options
                </h2>
                <RadioGroup
                  value={resizeMethod}
                  onValueChange={(value: "pixels" | "percentage") =>
                    setResizeMethod(value)
                  }
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pixels" id="pixels" />
                    <Label
                      htmlFor="pixels"
                      className="text-sm font-semibold uppercase"
                    >
                      By Pixels
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label
                      htmlFor="percentage"
                      className="text-sm font-semibold uppercase"
                    >
                      By Percentage
                    </Label>
                  </div>
                </RadioGroup>

                {resizeMethod === "pixels" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label
                        htmlFor="width"
                        className="text-sm font-semibold uppercase"
                      >
                        Width (px)
                      </Label>
                      <Input
                        type="number"
                        id="width"
                        name="width"
                        value={pixelsData.width}
                        onChange={handlePixelsChange}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="height"
                        className="text-sm font-semibold uppercase"
                      >
                        Height (px)
                      </Label>
                      <Input
                        type="number"
                        id="height"
                        name="height"
                        value={pixelsData.height}
                        onChange={handlePixelsChange}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label
                      htmlFor="percentage"
                      className="text-sm font-semibold uppercase"
                    >
                      Percentage (%)
                    </Label>
                    <Input
                      type="number"
                      id="percentage"
                      name="percentage"
                      value={percentageData}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setPercentageData(Number(e.target.value))
                      }
                      min="1"
                      max="200"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <Label
                  htmlFor="format"
                  className="block text-sm font-semibold uppercase"
                >
                  Output Format
                </Label>
                <Select
                  onValueChange={(value: string) => setOutputFormat(value)}
                  value={outputFormat}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="webp">WEBP</SelectItem>
                  </SelectContent>
                </Select>
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
                      Resizing...
                    </>
                  ) : (
                    "Resize Image"
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
                  Resizing Complete!
                </h3>
                <p className="text-sm font-semibold uppercase text-zinc-600">
                  Your resized image is ready for download.
                </p>
              </div>
              <Button
                variant={"outline"}
                className="mt-4 ring-2 ring-inset ring-green-500"
              >
                <a
                  href={downloadUrl}
                  download={`resized-${file?.name
                    .split(".")
                    .slice(0, -1)
                    .join(".")}.${outputFormat}`}
                  className="text-sm font-semibold uppercase text-green-700 flex items-center"
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Download Resized Image
                </a>
              </Button>
            </div>
          )}
        </main>

        {/* Sidebar Container */}
        <aside className="md:w-[25%] p-4 bg-gray-100 border-l border-gray-200">
          <MoreToolsSidebar currentPage={"/resize-image"} />
        </aside>
      </div>
      <Footer />
    </>
  );
}
