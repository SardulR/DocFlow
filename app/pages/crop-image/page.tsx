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
import { Loader2Icon, CheckCircle2Icon, Repeat2Icon } from "lucide-react";
import Navbar from "@/components/Navbar";
import MoreToolsSidebar from "@/components/MoreToolsSidebar";
import Footer from "@/components/Footer";

// Define a type for the crop data object
interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function CropImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [cropData, setCropData] = useState<CropData>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  // Function to reset the component state for a new operation
  const resetState = () => {
    setFile(null);
    setDownloadUrl("");
    setError("");
    setCropData({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    const selectedFile = event.target.files?.[0] || null;
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      setDownloadUrl("");
    } else {
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
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Ensure the value is a non-negative number
    const numberValue = Math.max(0, Number(value));
    setCropData((prev) => ({ ...prev, [name]: numberValue }));
  };

  const processImage = async () => {
    if (!file) {
      setError("Please select an image file first.");
      return;
    }

    if (cropData.width <= 0 || cropData.height <= 0) {
      setError("Width and height must be greater than 0.");
      return;
    }

    setIsProcessing(true);
    setError("");
    setDownloadUrl("");

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("x", cropData.x.toString());
      formData.append("y", cropData.y.toString());
      formData.append("width", cropData.width.toString());
      formData.append("height", cropData.height.toString());

      const response = await fetch("/api/crop-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (err: unknown) {
      console.error("Error cropping image:", err);
      if (err instanceof Error) {
        setError(err.message || "Failed to crop image. Please try again.");
      } else {
        setError("An unknown error occurred. Please try again.");
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
              Cropping image, please wait...
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
                    Crop Image
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <h1 className="text-4xl font-extrabold uppercase mt-6">
            DocFlow - Crop Image
          </h1>
          <p className="text-xs font-semibold uppercase mt-2 mb-8 text-zinc-600">
            Crop your images by specifying exact dimensions.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Drag & Drop Zone or Success Message */}
          {!downloadUrl ? (
            <div
              className={cn(
                "w-full max-w-2xl h-48 border-2 rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer",
                dragActive
                  ? "border-blue-500 text-blue-500 border-dashed"
                  : file
                  ? "border-green-500 text-green-500"
                  : "border-gray-400 text-gray-500 hover:border-blue-500 hover:text-blue-500 border-dashed"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
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
          ) : (
            <div className="w-full max-w-2xl h-48 border-2 rounded-lg flex flex-col items-center justify-center border-green-500 text-green-500">
              <CheckCircle2Icon className="h-12 w-12 mb-2" />
              <p className="text-sm font-semibold uppercase">
                Crop Successful!
              </p>
            </div>
          )}

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

              {/* Crop Dimensions Section */}
              <div className="text-left space-y-2">
                <h2 className="text-lg font-semibold uppercase text-gray-700">
                  Crop Dimensions
                </h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {["x", "y", "width", "height"].map((field) => (
                    <div key={field} className="space-y-1">
                      <Label
                        htmlFor={field}
                        className="text-sm font-semibold uppercase"
                      >
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </Label>
                      <Input
                        type="number"
                        id={field}
                        name={field}
                        value={cropData[field as keyof CropData]}
                        onChange={handleChange}
                        min={0}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-300 w-full text-red-600 text-sm font-semibold uppercase">
                  <p>{error}</p>
                </div>
              )}

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
                        download={`cropped-${file?.name}`}
                        className="text-sm font-semibold uppercase"
                      >
                        Download Cropped Image
                      </a>
                    </Button>
                    <Button
                      onClick={resetState}
                      variant={"outline"}
                      className="ring-2 ring-inset ring-gray-400 text-sm font-semibold uppercase"
                    >
                      <Repeat2Icon className="mr-2 h-4 w-4" />
                      Crop another
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={processImage}
                    disabled={isProcessing}
                    variant={"outline"}
                    className="ring-2 ring-inset ring-rose-400 text-sm font-semibold uppercase"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        Cropping...
                      </>
                    ) : (
                      "Crop Image"
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Sidebar Container */}
        <aside className="md:w-[25%] p-4 bg-gray-100 border-l border-gray-200">
          <MoreToolsSidebar currentPage={"/crop-image"} />
        </aside>
      </div>
      <Footer />
    </>
  );
}
