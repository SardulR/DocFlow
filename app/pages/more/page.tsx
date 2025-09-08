"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronsLeftIcon,
  HomeIcon,
  ImageIcon,
  FileTextIcon,
  CombineIcon,
  ScissorsIcon,
  LockIcon,
  LayoutGridIcon,
  PencilIcon,
  DownloadIcon,
  ChevronRightIcon,
  LucideHopOff,
  SplitIcon,
  TableIcon,
  ImagePlusIcon,
  CropIcon,
  ScaleIcon,
  RotateCcwIcon,
  Text,
  FilterIcon,
  Trash2Icon,
  FileSearchIcon,
  AppWindowIcon,
  GanttChartSquareIcon,
  BookAIcon,
  FileX2Icon,
  FileDownIcon,
  FileCogIcon,
} from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Centralized Icon Mapping for better maintainability
const iconMap = {
  merge: <CombineIcon className="h-10 w-10 text-amber-400" />,
  split: <SplitIcon className="h-10 w-10 text-emerald-400" />,
  compressPdf: <FileDownIcon className="h-10 w-10 text-cyan-400" />,
  pdfToWord: <FileTextIcon className="h-10 w-10 text-rose-500" />,
  pdfToExcel: <TableIcon className="h-10 w-10 text-green-500" />,
  pdfToImages: <ImagePlusIcon className="h-10 w-10 text-indigo-400" />,
  imagesToPdf: <LayoutGridIcon className="h-10 w-10 text-purple-500" />,
  addNumbers: <BookAIcon className="h-10 w-10 text-blue-400" />,
  cropImage: <CropIcon className="h-10 w-10 text-yellow-500" />,
  resizeImage: <ScaleIcon className="h-10 w-10 text-orange-500" />,
  convertImage: <AppWindowIcon className="h-10 w-10 text-teal-400" />,
  compressImage: <FileDownIcon className="h-10 w-10 text-gray-400" />,
  rotateImage: <RotateCcwIcon className="h-10 w-10 text-blue-500" />,
  addFilters: <FilterIcon className="h-10 w-10 text-pink-500" />,
  excelToPdf: <TableIcon className="h-10 w-10 text-green-600" />,
  removePages: <FileX2Icon className="h-10 w-10 text-red-500" />,
  extractPages: <FileSearchIcon className="h-10 w-10 text-cyan-600" />,
  organizePdf: <FileCogIcon className="h-10 w-10 text-orange-400" />,
};

const tools = [
  {
    name: "Merge PDF",
    href: "/merge-pdf",
    description: "Combine multiple PDF documents into a single file.",
    icon: iconMap.merge,
  },
  {
    name: "Split PDF",
    href: "/split-pdf",
    description:
      "Split a single PDF file into multiple documents by page ranges.",
    icon: iconMap.split,
  },
  {
    name: "Compress PDF",
    href: "/compress-pdf",
    description: "Reduce the file size of your PDFs without losing quality.",
    icon: iconMap.compressPdf,
  },
  {
    name: "PDF to Word",
    href: "/pdf-word",
    description: "Convert your PDF files to editable Microsoft Word documents.",
    icon: iconMap.pdfToWord,
  },
  {
    name: "PDF to Excel",
    href: "/pdf-to-excel",
    description: "Turn your PDF tables into a Microsoft Excel spreadsheet.",
    icon: iconMap.pdfToExcel,
  },
  {
    name: "PDF to Images",
    href: "/pdf-to-images",
    description: "Convert PDF pages into high-quality image files (JPG, PNG).",
    icon: iconMap.pdfToImages,
  },
  {
    name: "Images to PDF",
    href: "/images-to-pdf",
    description: "Turn one or more images into a single PDF document.",
    icon: iconMap.imagesToPdf,
  },
  {
    name: "Add Numbers to Pages",
    href: "/add-number-to-pages",
    description: "Automatically number the pages of your PDF document.",
    icon: iconMap.addNumbers,
  },
  {
    name: "Crop Image",
    href: "/crop-image",
    description: "Crop your images to the desired size and aspect ratio.",
    icon: iconMap.cropImage,
  },
  {
    name: "Resize Image",
    href: "/resize-image",
    description: "Resize your images to custom dimensions or a percentage.",
    icon: iconMap.resizeImage,
  },
  {
    name: "Convert Image",
    href: "/convert-image",
    description:
      "Convert your images between various formats like JPG, PNG, and WebP.",
    icon: iconMap.convertImage,
  },
  {
    name: "Compress Image",
    href: "/compress-image",
    description: "Reduce the file size of your images for faster loading.",
    icon: iconMap.compressImage,
  },
  {
    name: "Rotate Image",
    href: "/rotate-image",
    description:
      "Rotate your image by degrees or flip it horizontally/vertically.",
    icon: iconMap.rotateImage,
  },
  {
    name: "Add Filters to Image",
    href: "/add-filters",
    description: "Apply beautiful filters and effects to your images.",
    icon: iconMap.addFilters,
  },
  {
    name: "Excel to PDF",
    href: "/excel-to-pdf",
    description: "Convert your Excel spreadsheet into a PDF document.",
    icon: iconMap.excelToPdf,
  },
  {
    name: "Remove PDF Pages",
    href: "/remove-pdf-pages",
    description: "Delete specific pages from a PDF file easily.",
    icon: iconMap.removePages,
  },
  {
    name: "Extract PDF Pages",
    href: "/extract-pdf-pages",
    description: "Extract specific pages from a PDF to create a new file.",
    icon: iconMap.extractPages,
  },
  {
    name: "Organize PDF",
    href: "/organize-pdf",
    description: "Rearrange, delete, or rotate pages within your PDF document.",
    icon: iconMap.organizePdf,
  },
];

const MoreToolsPage = () => {
  return (
    <>
      <Navbar />
      <main className="flex-1 p-4 md:p-8 flex flex-col items-center min-h-screen bg-gray-50">
        <div className="w-full max-w-4xl mx-auto text-left">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">
                    <span className="text-sm font-semibold uppercase cursor-pointer">
                      Home
                    </span>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm font-semibold uppercase">
                  All Tools
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <section className="w-full max-w-4xl mx-auto py-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold uppercase mb-4 text-zinc-800">
            All DocFlow Tools
          </h1>
          <p className="text-sm md:text-medium font-semibold text-zinc-600 mb-12 uppercase">
            Explore our full suite of powerful and easy-to-use tools.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {tools.map((tool) => (
    <Link
      key={tool.href}
      href={`/pages/${tool.href}`}
      className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all transform hover:scale-105 cursor-pointer border border-gray-200 h-full"
    >
      <div className="flex-shrink-0 mb-4">{tool.icon}</div>
      <h2 className="text-lg font-extrabold uppercase text-zinc-800">
        {tool.name}
      </h2>
      <p className="text-sm text-center text-gray-500 mt-2 font-medium uppercase line-clamp-2 min-h-[40px]">
        {tool.description}
      </p>
      <Button
        variant="link"
        className="mt-4 text-black font-semibold uppercase text-sm group pointer-events-none"
      >
        Go to tool
        <ChevronRightIcon className="h-4 w-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
      </Button>
    </Link>
  ))}
</div>

        </section>
      </main>
      <Footer />
    </>
  );
};

export default MoreToolsPage;
