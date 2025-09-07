"use client";

import { useState, useRef } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Loader2Icon, CheckCircle2Icon } from "lucide-react";
import Navbar from "@/components/Navbar";
import MoreToolsSidebar from "@/components/MoreToolsSidebar";
import Footer from "@/components/Footer";

// Define a type for the compression details object
interface CompressionDetails {
  originalSize: number;
  compressedSize: number;
  reduction: number;
}

export default function CompressPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [compressionType, setCompressionType] = useState<
    "preset" | "custom" | "target"
  >("preset");
  const [compressionLevel, setCompressionLevel] = useState<
    "low" | "medium" | "high" | "maximum"
  >("medium");
  const [customQuality, setCustomQuality] = useState<number>(75);
  const [removeMetadata, setRemoveMetadata] = useState<boolean>(true);
  const [downsampleImages, setDownsampleImages] = useState<boolean>(true);
  const [targetSize, setTargetSize] = useState<string>("");
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [compressionDetails, setCompressionDetails] =
    useState<CompressionDetails | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    const selectedFile = event.target.files?.[0] || null;

    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setOriginalSize(selectedFile.size);
      setCompressedSize(0);
      setDownloadUrl("");
      setCompressionDetails(null);
    } else {
      setError("Please select a valid PDF file");
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setError("");
    const droppedFiles = Array.from(event.dataTransfer.files);

    if (droppedFiles.length > 0 && droppedFiles[0].type === "application/pdf") {
      setFile(droppedFiles[0]);
      setOriginalSize(droppedFiles[0].size);
      setCompressedSize(0);
      setDownloadUrl("");
      setCompressionDetails(null);
      event.dataTransfer.clearData();
    } else {
      setError("Please drop a valid PDF file");
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const compressPDF = async () => {
    if (!file) {
      setError("Please select a PDF file first");
      return;
    }

    setIsCompressing(true);
    setError("");
    setDownloadUrl("");
    setCompressedSize(0);
    setCompressionDetails(null);

    try {
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("compressionType", compressionType);

      if (compressionType === "preset") {
        formData.append("compressionLevel", compressionLevel);
      } else if (compressionType === "custom") {
        formData.append("customQuality", customQuality.toString());
        formData.append("removeMetadata", removeMetadata.toString());
        formData.append("downsampleImages", downsampleImages.toString());
      } else if (compressionType === "target") {
        formData.append("targetSize", targetSize);
      }

      const response = await fetch("/api/compress-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setCompressedSize(blob.size);

      setCompressionDetails({
        originalSize: file.size,
        compressedSize: blob.size,
        reduction: Math.round(((file.size - blob.size) / file.size) * 100),
      });
    } catch (err: unknown) {
      console.error("Error compressing PDF:", err);
      if (err instanceof Error) {
        setError(err.message || "Failed to compress PDF. Please try again.");
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <>
      <Navbar />

      {/* Full-screen Loader Overlay */}
      {isCompressing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <Loader2Icon className="h-12 w-12 animate-spin text-rose-400" />
            <p className="mt-4 text-sm font-semibold uppercase text-gray-700">
              Compressing PDF, please wait...
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
                    Compress PDF
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <h1 className="text-4xl font-extrabold uppercase mt-6">
            DocFlow - Compress PDF
          </h1>
          <p className="text-xs font-semibold uppercase mt-2 mb-8 text-zinc-600">
            Reduce the file size of your PDF while maintaining quality
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

          {/* Options & Action Section */}
          {file && (
            <div className="w-full max-w-2xl mt-8 p-6 rounded-xl bg-white shadow-lg border border-gray-200 space-y-6">
              {/* File Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-left">
                <div className="flex items-center">
                  <CheckCircle2Icon className="w-5 h-5 text-green-500 mr-2" />
                  <p className="text-sm font-semibold uppercase">
                    File Selected:{" "}
                    <span className="font-normal text-gray-700">
                      {file.name}
                    </span>
                  </p>
                </div>
                <p className="text-xs font-semibold uppercase text-zinc-600 mt-2 sm:mt-0">
                  Original size: {formatFileSize(originalSize)}
                </p>
              </div>
              <Separator />

              {/* Compression Options Tabs */}
              <Tabs
                defaultValue="preset"
                className="w-full"
                onValueChange={(value) =>
                  setCompressionType(value as "preset" | "custom" | "target")
                }
              >
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger
                    value="preset"
                    className="text-sm font-semibold uppercase"
                  >
                    Preset
                  </TabsTrigger>
                  <TabsTrigger
                    value="custom"
                    className="text-sm font-semibold uppercase"
                  >
                    Custom
                  </TabsTrigger>
                  <TabsTrigger
                    value="target"
                    className="text-sm font-semibold uppercase"
                  >
                    Target Size
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="preset" className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase mb-4">
                    Select Compression Level:
                  </h3>
                  <RadioGroup
                    defaultValue="medium"
                    onValueChange={(value) =>
                      setCompressionLevel(
                        value as "low" | "medium" | "high" | "maximum"
                      )
                    }
                  >
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="low" id="r1" />
                      <Label
                        htmlFor="r1"
                        className="text-sm font-semibold uppercase cursor-pointer"
                      >
                        Low (Best quality, larger file)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="medium" id="r2" />
                      <Label
                        htmlFor="r2"
                        className="text-sm font-semibold uppercase cursor-pointer"
                      >
                        Medium (Balanced quality and size)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="high" id="r3" />
                      <Label
                        htmlFor="r3"
                        className="text-sm font-semibold uppercase cursor-pointer"
                      >
                        High (Smaller file, good quality)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="maximum" id="r4" />
                      <Label
                        htmlFor="r4"
                        className="text-sm font-semibold uppercase cursor-pointer"
                      >
                        Maximum (Smallest file, lower quality)
                      </Label>
                    </div>
                  </RadioGroup>
                </TabsContent>

                <TabsContent value="custom" className="space-y-6">
                  <div>
                    <Label className="text-sm font-semibold uppercase mb-2 block">
                      Quality Level: {customQuality}perc
                    </Label>
                    <Slider
                      value={[customQuality]}
                      onValueChange={(value: number[]) =>
                        setCustomQuality(value[0])
                      }
                      max={100}
                      step={1}
                      className="w-full accent-rose-500"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Lower Quality</span>
                      <span>Better Quality</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label
                      htmlFor="metadata"
                      className="text-sm font-semibold uppercase cursor-pointer"
                    >
                      Remove Metadata
                    </Label>
                    <Switch
                      id="metadata"
                      checked={removeMetadata}
                      onCheckedChange={(checked: boolean) =>
                        setRemoveMetadata(checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label
                      htmlFor="downsample"
                      className="text-sm font-semibold uppercase cursor-pointer"
                    >
                      Downsample Images
                    </Label>
                    <Switch
                      id="downsample"
                      checked={downsampleImages}
                      onCheckedChange={(checked: boolean) =>
                        setDownsampleImages(checked)
                      }
                    />
                  </div>
                </TabsContent>

                <TabsContent value="target" className="space-y-4">
                  <Label className="text-sm font-semibold uppercase mb-2 block">
                    Target File Size (MB)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Enter target size in MB"
                    value={targetSize}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setTargetSize(e.target.value)
                    }
                    className="w-full text-sm font-semibold uppercase"
                    min="0.1"
                    step="0.1"
                  />
                  <p className="text-xs text-muted-foreground font-semibold uppercase">
                    Current size: {formatFileSize(originalSize)}
                  </p>
                </TabsContent>
              </Tabs>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-300 w-full text-red-600 text-sm font-semibold uppercase">
                  <p>{error}</p>
                </div>
              )}

              {/* Compress Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={compressPDF}
                  disabled={isCompressing}
                  variant={"outline"}
                  className="ring-2 ring-inset ring-rose-400 text-sm font-semibold uppercase"
                >
                  {isCompressing ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Compressing...
                    </>
                  ) : (
                    "Compress PDF"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Results Section */}
          {compressionDetails && (
            <div className="w-full max-w-2xl mt-8 p-6 rounded-lg bg-white shadow-lg border border-green-200">
              <h3 className="text-lg font-semibold uppercase mb-4 text-green-700 text-center">
                Success!
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-semibold uppercase text-gray-700">
                    Original:
                  </span>
                  <span className="text-xs font-semibold uppercase text-blue-500">
                    {formatFileSize(compressionDetails.originalSize)}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-semibold uppercase text-gray-700">
                    Compressed:
                  </span>
                  <span className="text-xs font-semibold uppercase text-green-500">
                    {formatFileSize(compressionDetails.compressedSize)}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-semibold uppercase text-gray-700">
                    Reduction:
                  </span>
                  <span className="text-xs font-semibold uppercase text-amber-800">
                    {compressionDetails.reduction}% smaller
                  </span>
                </div>
              </div>
              <Separator className="my-6" />
              <div className="flex justify-center">
                <Button
                  variant={"outline"}
                  className="ring-2 ring-inset ring-green-500"
                >
                  <a
                    href={downloadUrl}
                    download={`compressed-${file?.name}`}
                    className="text-sm font-semibold uppercase"
                  >
                    Download Compressed PDF
                  </a>
                </Button>
              </div>
            </div>
          )}
        </main>

        {/* Sidebar Container */}
        <aside className="md:w-[25%] p-4 bg-gray-100 border-l border-gray-200">
          <MoreToolsSidebar currentPage={"/compress-pdf"} />
        </aside>
      </div>
      <Footer />
    </>
  );
}
