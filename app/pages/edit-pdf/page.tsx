"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  Loader2Icon,
  CheckCircle2Icon,
  CircleXIcon,
  Repeat2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

export default function EditPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [textToAdd, setTextToAdd] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL when component unmounts or downloadUrl changes
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
    setTextToAdd("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError("");
      setDownloadUrl("");
      setTextToAdd("");
    } else {
      setFile(null);
      setError("Please select a valid PDF file.");
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setError("");
      setDownloadUrl("");
      setTextToAdd("");
    } else {
      setFile(null);
      setError("Please drop a valid PDF file.");
    }
  };

  const handleEditPDF = async () => {
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }
    if (!textToAdd.trim()) {
      setError("Please enter some text to add.");
      return;
    }

    setLoading(true);
    setDownloadUrl("");
    setError("");

    try {
      const existingPdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      // Get the first page of the document
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      // Embed a standard font
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Get the page dimensions for positioning
      const { width, height } = firstPage.getSize();

      // Draw the text string on the page
      firstPage.drawText(textToAdd, {
        x: 50,
        y: height - 50,
        size: 30,
        font: helveticaFont,
        color: rgb(0.95, 0.1, 0.1),
      });

      // Serialize the PDFDocument to bytes
      const pdfBytes: Uint8Array = await pdfDoc.save(); // Your data, which might have a SharedArrayBuffer underneath

      // Correct way to create a Blob from a Uint8Array
      // const blob = new Blob([pdfBytes.buffer], { type: "application/pdf" });

      // Create a Blob and a URL for download
      // const blob = new Blob([pdfBytes], { type: "application/pdf" });
      // const blob = new Blob([pdfBytes.buffer], { type: "application/pdf" });
      // const pdfBytes = await pdfDoc.save();
      // const blob = new Blob([pdfBytes.buffer], { type: "application/pdf" });
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (err: unknown) {
      console.error("Failed to edit PDF:", err);
      if (err instanceof Error) {
        setError(err.message || "Failed to edit PDF. Please try again.");
      } else {
        setError("An unknown error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <Loader2Icon className="h-12 w-12 animate-spin text-rose-400" />
            <p className="mt-4 text-sm font-semibold uppercase text-gray-700">
              Editing PDF...
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
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
                    Edit PDF
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <h1 className="text-4xl font-extrabold uppercase mt-6">
            DocFlow - Edit PDF
          </h1>
          <p className="text-xs font-semibold uppercase mt-2 mb-8 text-zinc-600">
            Add text to your PDF document.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

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
                Click to select or drag & drop a PDF file here
              </p>
              <p className="text-xs font-semibold uppercase mt-2 text-zinc-600">
                Accepted format: .pdf
              </p>
            </div>
          ) : (
            <div className="w-full max-w-2xl mt-8 p-6 rounded-xl bg-white shadow-lg border border-gray-200 space-y-6">
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetState} // Use resetState here
                  className="p-1 h-auto text-red-500 hover:bg-red-50 hover:text-red-700 transition-all"
                >
                  <CircleXIcon className="h-5 w-5" />
                </Button>
              </div>
              <Separator />

              {/* Text Input Section */}
              <div className="text-left space-y-4">
                <label
                  htmlFor="text-input"
                  className="block text-sm font-semibold uppercase text-gray-700"
                >
                  Text to add to the PDF
                </label>
                <input
                  id="text-input"
                  type="text"
                  value={textToAdd}
                  onChange={(e) => setTextToAdd(e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring focus:ring-rose-400 focus:outline-none"
                  placeholder="Enter your text here..."
                />
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-300 w-full text-red-600 text-sm font-semibold uppercase text-left">
                  <p>{error}</p>
                </div>
              )}

              {/* Action Buttons based on downloadUrl state */}
              <div className="flex justify-center pt-4 md:space-x-4 gap-4 flex-wrap">
                {downloadUrl ? (
                  <>
                    <Button
                      variant={"outline"}
                      className="ring-2 ring-inset ring-green-500"
                    >
                      <a
                        href={downloadUrl}
                        download={`edited-${file?.name}`}
                        className="text-sm font-semibold uppercase"
                      >
                        Download Edited PDF
                      </a>
                    </Button>
                    <Button
                      onClick={resetState}
                      variant={"outline"}
                      className="ring-2 ring-inset ring-gray-400 text-sm font-semibold uppercase"
                    >
                      <Repeat2Icon className="mr-2 h-4 w-4" />
                      Edit another
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleEditPDF}
                    disabled={loading || !file || !textToAdd.trim()}
                    className="ring-2 ring-inset ring-rose-400 text-sm font-semibold uppercase"
                    variant={"outline"}
                  >
                    {loading ? (
                      <>
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        Adding Text...
                      </>
                    ) : (
                      "Add Text to PDF"
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Download link is now part of the conditional rendering above */}
        </main>
        <aside className="md:w-[25%] p-4 bg-gray-100 border-l border-gray-200">
          <MoreToolsSidebar currentPage={"/edit-pdf"} />
        </aside>
      </div>
      <Footer />
    </>
  );
}
