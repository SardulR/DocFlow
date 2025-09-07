"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import axios from "axios";
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
import {
  CircleXIcon,
  Loader2Icon,
  CheckCircle2Icon,
  GripVerticalIcon,
  Repeat2Icon,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Navbar from "@/components/Navbar";
import MoreToolsSidebar from "@/components/MoreToolsSidebar";
import Footer from "@/components/Footer";
import Image from "next/image";

// Define a type for a single PDF page
interface PDFPage {
  id: string;
  pageNumber: number;
  preview: string | null;
}

// Define a simplified type for the PDFPageProxy from pdf.js to avoid 'any'
interface PDFPageProxy {
  getViewport: (options: { scale: number }) => any;
  render: (options: {
    canvasContext: CanvasRenderingContext2D | null;
    viewport: any;
  }) => {
    promise: Promise<void>;
  };
}

// Define the type for the PDF.js library's getDocument method
interface PdfJs {
  getDocument: (url: string | { data: ArrayBuffer }) => {
    promise: {
      numPages: number;
      getPage: (pageNumber: number) => Promise<PDFPageProxy>;
    };
  };
  GlobalWorkerOptions: {
    workerSrc: string;
  };
}

// Component for a single draggable page
interface SortablePageProps {
  page: PDFPage;
  removePage: (id: string) => void;
}

function SortablePage({ page, removePage }: SortablePageProps) {
  const { id, pageNumber, preview } = page;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative w-40 h-56 border border-gray-300 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing bg-white shadow-md flex-shrink-0 transition-all duration-200 ",
        isDragging && "shadow-xl border-blue-500"
      )}
    >
      <div
        className="absolute top-2 left-2 p-1 rounded-full bg-white/70 backdrop-blur-sm shadow-md cursor-grab"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="h-4 w-4 text-gray-600" />
      </div>
      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removePage(id)}
          className="p-2 h-auto text-red-500 cursor-pointer bg-red-50 hover:text-red-700 transition-all rounded-full"
        >
          <CircleXIcon className="h-5 w-5" />
        </Button>
      </div>
      {preview ? (
        <Image
          src={preview}
          alt={`Page ${pageNumber} preview`}
          className="w-full h-full object-cover pointer-events-none"
          width={160}
          height={224}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-gray-100">
          <Loader2Icon className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 shadow-md">
        <span className="text-sm font-semibold text-gray-700 uppercase">
          Page {pageNumber}
        </span>
      </div>
    </div>
  );
}

export default function PDFOrganizer() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfjs, setPdfjs] = useState<PdfJs | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load PDF.js library and set worker source
  useEffect(() => {
    const loadPdfjs = async () => {
      try {
        // const pdfjsLib = await import("pdfjs-dist/build/pdf");
        const pdfjsLib = require("pdfjs-dist/build/pdf") as any;
        const typedPdfJsLib = pdfjsLib as unknown as PdfJs;
        typedPdfJsLib.GlobalWorkerOptions.workerSrc = `/pdfjs-dist/build/pdf.worker.min.mjs`;
        setPdfjs(typedPdfJsLib);
      } catch (error) {
        console.error("Failed to load PDF.js:", error);
        setError("Failed to load PDF viewer. Please refresh the page.");
      }
    };
    loadPdfjs();
  }, []);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
      pages.forEach((page) => {
        if (page.preview) {
          URL.revokeObjectURL(page.preview);
        }
      });
    };
  }, [downloadUrl, pages]);

  // Unified function to reset all state
  const resetState = () => {
    setFile(null);
    setPages([]);
    setDownloadUrl("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Function to remove a page
  const removePage = (idToRemove: string) => {
    setPages(pages.filter((page) => page.id !== idToRemove));
  };

  const renderPagePreviews = useCallback(
    async (pdfDoc: {
      numPages: number;
      getPage: (pageNumber: number) => Promise<PDFPageProxy>;
    }) => {
      const previewPromises: Promise<string | null>[] = [];
      const scale = 0.5;

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        previewPromises.push(
          (async () => {
            try {
              const page = await pdfDoc.getPage(i);
              const viewport = page.getViewport({ scale });
              const canvas = document.createElement("canvas");
              const canvasContext = canvas.getContext("2d");
              if (!canvasContext) return null;
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              await page.render({ canvasContext, viewport }).promise;
              return canvas.toDataURL("image/jpeg");
            } catch (err) {
              console.error(`Error rendering page ${i}:`, err);
              return null;
            }
          })()
        );
      }
      return Promise.all(previewPromises);
    },
    []
  );

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      resetState();
      setFile(selectedFile);
      setLoading(true);

      try {
        if (!pdfjs) {
          throw new Error("PDF viewer is still loading. Please wait a moment.");
        }

        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;

        const initialPages: PDFPage[] = Array.from(
          { length: numPages },
          (_, i) => ({
            id: `${i + 1}-${selectedFile.name}`,
            pageNumber: i + 1,
            preview: null,
          })
        );
        setPages(initialPages);

        const previews = await renderPagePreviews(pdf);
        setPages((prevPages) => {
          return prevPages.map((page, i) => ({
            ...page,
            preview: previews[i],
          }));
        });
      } catch (error: unknown) {
        console.error("Error processing PDF:", error);
        if (error instanceof Error) {
          setError(error.message || "Could not process PDF. Please try again.");
        } else {
          setError("An unknown error occurred while processing the PDF.");
        }
        setPages([]);
        setFile(null);
      } finally {
        setLoading(false);
      }
    } else {
      resetState();
      setError("Please select a valid PDF file.");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return items;
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setDownloadUrl("");
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }
    if (pages.length === 0) {
      setError("No pages to organize.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("pdf", file);
    const newOrder = pages.map((p) => p.pageNumber).join(",");
    formData.append("newOrder", newOrder);

    try {
      const res = await axios.post("/api/organize-pdf", formData, {
        responseType: "blob",
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      setDownloadUrl(url);
    } catch (err: unknown) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response?.data) {
        const reader = new FileReader();
        reader.onload = function () {
          try {
            const errorData = JSON.parse(reader.result as string);
            setError(errorData.error || "Failed to organize PDF pages.");
          } catch {
            setError("Failed to organize PDF pages. Please try again.");
          }
        };
        reader.readAsText(err.response.data);
      } else {
        setError("Failed to organize PDF pages. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      handleFileSelect({
        target: { files: [droppedFile] },
      } as unknown as ChangeEvent<HTMLInputElement>);
    } else {
      resetState();
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

  return (
    <>
      <Navbar />
      {/* Full-screen Loader Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <Loader2Icon className="h-12 w-12 animate-spin text-rose-400" />
            <p className="mt-4 text-sm font-semibold uppercase text-gray-700">
              {pages.length > 0 ? "Organizing PDF..." : "Loading PDF..."}
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
                    Organize PDF
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <h1 className="text-4xl font-extrabold uppercase mt-6">
            DocFlow - PDF Organizer
          </h1>
          <p className="text-xs font-semibold uppercase mt-2 mb-8 text-zinc-600">
            Reorder, delete, and manage pages in your PDF document.
          </p>
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          {!file || downloadUrl ? (
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
              {!pdfjs && (
                <p className="text-sm font-semibold mt-4 text-blue-500 animate-pulse">
                  Loading PDF viewer...
                </p>
              )}
            </div>
          ) : (
            <div className="w-full max-w-2xl mt-8 p-6 rounded-xl bg-white shadow-lg border border-gray-200 space-y-6">
              <div className="flex items-center justify-between text-left">
                <div className="flex items-center space-x-2">
                  <CheckCircle2Icon className="w-5 h-5 text-green-500" />
                  <p className="text-sm font-semibold uppercase">
                    File Selected:
                    <span className="font-normal text-gray-700">
                      {file.name}
                    </span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetState}
                  className="p-1 h-auto text-red-500 bg-red-50 hover:text-red-700 transition-all"
                >
                  <CircleXIcon className="h-5 w-5" />
                </Button>
              </div>
              <Separator />
              {pages.length > 0 ? (
                <div className="text-left">
                  <h3 className="text-lg font-semibold uppercase mb-4">
                    Drag and drop pages to reorder ({pages.length} pages)
                  </h3>
                  <div className="flex-col items-center">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={pages.map((p) => p.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="w-full flex flex-wrap gap-4 justify-center md:justify-start max-h-[60vh] overflow-y-auto p-2">
                          {pages.map((page) => (
                            <SortablePage
                              key={page.id}
                              page={page}
                              removePage={removePage}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={handleSubmit}
                      disabled={loading || !pdfjs}
                      variant={"outline"}
                      className="ring-2 ring-inset ring-rose-400 text-sm font-semibold uppercase"
                    >
                      {loading ? (
                        <>
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                          Organizing...
                        </>
                      ) : (
                        "Organize PDF"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-semibold uppercase text-gray-500 text-center">
                  No pages to display. Try uploading a different PDF.
                </p>
              )}
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
                PDF Organized Successfully!
              </h3>
              <p className="text-sm font-semibold uppercase text-zinc-600">
                Your reorganized PDF is ready to download.
              </p>
              <div className="flex justify-center mt-4 space-x-4">
                <Button
                  variant={"outline"}
                  className="ring-2 ring-inset ring-green-500"
                >
                  <a
                    href={downloadUrl}
                    download="organized-document.pdf"
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
                  Organize another
                </Button>
              </div>
            </div>
          )}
        </main>
        {/* Sidebar Container */}
        <aside className="md:w-[25%] p-4 bg-gray-100 border-l border-gray-200">
          <MoreToolsSidebar currentPage={"/organize-pdf"} />
        </aside>
      </div>
      <Footer />
    </>
  );
}
// const pdfjsLib = require("pdfjs-dist/build/pdf") as any;
