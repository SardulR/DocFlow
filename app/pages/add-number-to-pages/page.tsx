"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Loader2Icon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import Navbar from "@/components/Navbar";
import MoreToolsSidebar from "@/components/MoreToolsSidebar";
import Footer from "@/components/Footer";

// 1. Define types for the component's state and props
type PageNumberPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

type PageFormat = "page_only" | "page_of_total";

// Note: In this component, there are no props, but this is how you would define them.
// interface AddPageNumbersProps {}

export default function AddPageNumbers() {
  // Use File | null for the file state
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  // Use the defined union types for position and format
  const [position, setPosition] = useState<PageNumberPosition>("bottom-center");
  const [startPage, setStartPage] = useState<number>(1);
  const [pageFormat, setPageFormat] = useState<PageFormat>("page_of_total");
  const [startNumber, setStartNumber] = useState<number>(1);

  // 2. Type the useRef hook to an HTMLInputElement
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. Type the event handler for file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const selectedFile = event.target.files?.[0];

    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setDownloadUrl("");
    } else {
      setError("Please select a valid PDF file");
    }
  };

  // 4. Type the event handlers for drag and drop
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setError("");
    const droppedFiles = Array.from(event.dataTransfer.files);

    if (droppedFiles.length > 0 && droppedFiles[0].type === "application/pdf") {
      setFile(droppedFiles[0]);
      setDownloadUrl("");
      event.dataTransfer.clearData();
    } else {
      setError("Please drop a valid PDF file");
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const processPDF = async () => {
    if (!file) {
      setError("Please select a PDF file first");
      return;
    }

    setIsProcessing(true);
    setError("");
    setDownloadUrl("");

    try {
      const formData = new FormData();
      formData.append("pdf", file);
      // Ensure all values are converted to string for FormData
      formData.append("position", position);
      formData.append("startPage", startPage.toString());
      formData.append("pageFormat", pageFormat);
      formData.append("startNumber", startNumber.toString());

      const response = await fetch("/api/add-page-numbers", {
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
    } catch (error) {
      console.error("Error adding page numbers:", error);
      // Type the error object as Error
      const typedError = error as Error;
      setError(
        typedError.message || "Failed to process PDF. Please try again."
      );
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
              Adding page numbers, please wait...
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
                    Add Page Numbers
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <h1 className="text-4xl font-extrabold uppercase mt-6">
            DocFlow - Add Page Numbers
          </h1>
          <p className="text-xs font-semibold uppercase mt-2 mb-8 text-zinc-600">
            Easily add customizable page numbers to your PDF document
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
                  Selected File
                </h3>
                <p className="text-sm font-normal text-gray-600 mt-2">
                  <span className="font-bold">Name:</span> {file.name}
                </p>
              </div>
              <Separator />
              <div className="text-left space-y-4">
                <h2 className="text-lg font-semibold uppercase">
                  Page Numbering Options
                </h2>
                {/* Position */}
                <div>
                  <Label
                    htmlFor="position-select"
                    className="text-sm font-semibold uppercase mb-2 block"
                  >
                    Position
                  </Label>
                  <Select
                    // The onValueChange handler is typed by the Select component
                    onValueChange={(value: PageNumberPosition) =>
                      setPosition(value)
                    }
                    defaultValue="bottom-center"
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="top-center">Top Center</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="bottom-center">
                        Bottom Center
                      </SelectItem>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Page and Start Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="start-page"
                      className="text-sm font-semibold uppercase mb-2 block"
                    >
                      Start on Page
                    </Label>
                    <Input
                      id="start-page"
                      type="number"
                      value={startPage}
                      // Type the event from the onChange handler
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setStartPage(Number(e.target.value))
                      }
                      min="1"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="start-number"
                      className="text-sm font-semibold uppercase mb-2 block"
                    >
                      Start with Number
                    </Label>
                    <Input
                      id="start-number"
                      type="number"
                      value={startNumber}
                      // Type the event from the onChange handler
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setStartNumber(Number(e.target.value))
                      }
                      min="1"
                    />
                  </div>
                </div>

                {/* Format */}
                <div>
                  <Label className="text-sm font-semibold uppercase mb-2 block">
                    Format
                  </Label>
                  <RadioGroup
                    // The onValueChange handler is typed by the RadioGroup component
                    onValueChange={(value: PageFormat) => setPageFormat(value)}
                    defaultValue="page_of_total"
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="page_only" id="format-page-only" />
                      <Label
                        htmlFor="format-page-only"
                        className="text-sm font-semibold uppercase cursor-pointer"
                      >
                        Page Only (e.g., 1, 2, 3...)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg mt-2">
                      <RadioGroupItem
                        value="page_of_total"
                        id="format-page-of-total"
                      />
                      <Label
                        htmlFor="format-page-of-total"
                        className="text-sm font-semibold uppercase cursor-pointer"
                      >
                        Page X of Y (e.g., 1 of 10, 2 of 10...)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-300 w-full text-red-600 text-sm font-semibold uppercase">
                  <p>{error}</p>
                </div>
              )}

              <div className="flex justify-center pt-4">
                <Button
                  onClick={processPDF}
                  disabled={isProcessing}
                  variant={"outline"}
                  className="ring-2 ring-inset ring-rose-400 text-sm font-semibold uppercase"
                >
                  {isProcessing ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Adding Numbers...
                    </>
                  ) : (
                    "Add Page Numbers"
                  )}
                </Button>
              </div>
            </div>
          )}

          {downloadUrl && (
            <div className="w-full max-w-2xl mt-8 p-6 rounded-lg bg-white shadow-lg border border-green-200 text-center">
              <h3 className="text-lg font-semibold uppercase mb-4 text-green-700">
                Success!
              </h3>
              <p className="text-sm font-semibold uppercase text-zinc-600">
                Your PDF is ready to download.
              </p>
              <Button
                variant={"outline"}
                className="mt-4 ring-2 ring-inset ring-green-500"
              >
                {/* Conditionally render the link only if 'file' is not null */}
                {file && (
                  <a
                    href={downloadUrl}
                    download={`numbered-${file.name}`} // `file.name` is now safe to access
                    className="text-sm font-semibold uppercase"
                  >
                    Download Numbered PDF
                  </a>
                )}
              </Button>
            </div>
          )}
        </main>

        {/* Sidebar Container */}
        <aside className="md:w-[25%] p-4 bg-gray-100 border-l border-gray-200">
          <MoreToolsSidebar currentPage={"/add-number-to-pages"} />
        </aside>
      </div>
      <Footer />
    </>
  );
}

// The video is a tutorial that explains how to debug and solve the "unused variable" warnings and errors often encountered with React and ESLint.
