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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Loader2Icon,
  CheckCircle2Icon,
  FileIcon,
  Trash2Icon,
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
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Navbar from "@/components/Navbar";
import MoreToolsSidebar from "@/components/MoreToolsSidebar";
import Footer from "@/components/Footer";

// Sortable Item Component with explicit props type
interface SortableItemProps {
  file: File;
  index: number;
  removeFile: (index: number) => void;
}

const SortableItem = ({ file, index, removeFile }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.name + index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between py-3 px-4 rounded-lg bg-gray-50 border border-gray-200 transition-colors duration-200",
        isDragging && "shadow-lg bg-white"
      )}
    >
      <div className="flex items-center space-x-3">
        <GripVerticalIcon
          className="h-5 w-5 text-gray-400 cursor-grab"
          {...attributes}
          {...listeners}
        />
        <FileIcon className="h-5 w-5 text-rose-500" />
        <span className="text-sm text-gray-700 font-medium truncate">
          {file.name}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => removeFile(index)}
        className="p-1 h-auto text-red-500 hover:bg-red-50 hover:text-red-700 transition-all"
      >
        <Trash2Icon className="h-4 w-4" />
      </Button>
    </li>
  );
};

export default function PDFMerger() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []).filter(
      (file) => file.type === "application/pdf"
    );
    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
      setError("");
      setDownloadUrl("");
    } else {
      setError("Only PDF files are accepted.");
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const droppedFiles = Array.from(event.dataTransfer.files).filter(
      (file) => file.type === "application/pdf"
    );
    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
      setError("");
      setDownloadUrl("");
    } else {
      setError("Only PDF files are accepted.");
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

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
    setError("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setFiles((prev) => {
        const activeIndex = prev.findIndex(
          (file, index) => `${file.name}${index}` === active.id
        );
        const overIndex = prev.findIndex(
          (file, index) => `${file.name}${index}` === over?.id
        );
        if (activeIndex !== -1 && overIndex !== -1) {
          return arrayMove(prev, activeIndex, overIndex);
        }
        return prev;
      });
    }
  };

  const mergePDFs = async (e: FormEvent) => {
    e.preventDefault();
    if (files.length < 2) {
      setError("Please select at least 2 PDF files to merge.");
      return;
    }

    setLoading(true);
    setError("");
    setDownloadUrl("");

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("pdfs", file));

      const response = await fetch("/api/merge-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (error: unknown) {
      // Use unknown for type safety
      console.error("Error merging PDFs:", error);
      if (error instanceof Error) {
        setError(error.message || "Failed to merge PDFs. Please try again.");
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
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
              Merging PDFs, please wait...
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
                    Merge PDF
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <h1 className="text-4xl font-extrabold uppercase mt-6">
            DocFlow - Merge PDFs
          </h1>
          <p className="text-xs font-semibold uppercase mt-2 mb-8 text-zinc-600">
            Combine multiple PDF files into a single document.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Conditional Rendering based on files and downloadUrl state */}
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
                Click to select or drag & drop PDF files here
              </p>
              <p className="text-xs font-semibold uppercase mt-2 text-zinc-600">
                Select at least 2 PDF files.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-2xl mt-8 p-6 rounded-xl bg-white shadow-lg border border-gray-200 space-y-6">
              {/* File List */}
              <div className="text-left space-y-4">
                <h4 className="text-lg font-semibold uppercase">
                  Selected Files ({files.length})
                </h4>
                <p className="text-xs text-gray-500">
                  Drag and drop files to reorder them.
                </p>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={files.map((file, index) => `${file.name}${index}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {files.map((file, index) => (
                        <SortableItem
                          key={`${file.name}${index}`}
                          file={file}
                          index={index}
                          removeFile={removeFile}
                        />
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
              </div>
              <Separator />

              {/* Merge Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={mergePDFs}
                  disabled={files.length < 2 || loading}
                  variant={"outline"}
                  className="ring-2 ring-inset ring-rose-400 text-sm font-semibold uppercase"
                >
                  {loading ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Merging...
                    </>
                  ) : (
                    "Merge PDFs"
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
                PDFs Merged Successfully!
              </h3>
              <p className="text-sm font-semibold uppercase text-zinc-600">
                Your combined PDF is ready to download.
              </p>
              <div className="flex justify-center mt-4 md:space-x-4 gap-4 flex-wrap">
                <Button
                  variant={"outline"}
                  className="ring-2 ring-inset ring-green-500"
                >
                  <a
                    href={downloadUrl}
                    download="merged-document.pdf"
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
                  Merge another
                </Button>
              </div>
            </div>
          )}
        </main>

        {/* Sidebar Container */}
        <aside className="md:w-[25%] p-4 bg-gray-100 border-l border-gray-200">
          <MoreToolsSidebar currentPage={"/merge-pdf"} />
        </aside>
      </div>
      <Footer />
    </>
  );
}
