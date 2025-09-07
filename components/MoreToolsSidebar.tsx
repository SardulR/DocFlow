"use client";

import Link from "next/link";
import {
  ForwardRefExoticComponent,
  RefAttributes,
  useEffect,
  useState,
} from "react";
import {
  FileCheck2,
  Shell,
  Merge,
  ImageUp,
  Book,
  DecimalsArrowRight,
  ImageUpscale,
  RotateCcwSquare,
  ImagePlay,
  Pencil,
  Sheet,
  FileJson,
  Images,
  FolderOpen,
  Table,
  ImageMinus,
  Maximize2,
  RotateCcw,
  Video,
  Sparkles,
  LucideProps,
} from "lucide-react";

interface MoreToolsSidebarProps {
  currentPage: string;
}

const pdfTools = [
  { name: "Compress PDF", href: "compress-pdf", icon: FileCheck2, color: "#ef4444" },
  { name: "Split PDF", href: "split-pdf", icon: Shell, color: "#ec4899" },
  { name: "Merge PDF", href: "merge-pdf", icon: Merge, color: "#8b5cf6" },
  { name: "Convert to JPG", href: "pdf-to-images", icon: ImageUp, color: "#f97316" },
  { name: "Convert to DOCX", href: "pdf-word", icon: Book, color: "#22c55e" },
  { name: "Add Number To Pages", href: "pdf-word", icon: DecimalsArrowRight, color: "#3b82f6" },
  { name: "Compress Image", href: "compress-image", icon: ImageUpscale, color: "#ef4444" },
  { name: "Convert Image", href: "convert-image", icon: RotateCcwSquare, color: "#14b8a6" },
  { name: "Crop Image", href: "crop-image", icon: ImagePlay, color: "#f59e0b" },
  { name: "Edit PDF", href: "edit-pdf", icon: Pencil, color: "#6366f1" },
  { name: "Excel to PDF", href: "excel-to-pdf", icon: Sheet, color: "#10b981" },
  { name: "Extract PDF Pages", href: "extract-pdf-pages", icon: FileJson, color: "#0ea5e9" },
  { name: "Images to PDF", href: "images-to-pdf", icon: Images, color: "#9333ea" },
  { name: "Organise PDF", href: "organize-pdf", icon: FolderOpen, color: "#d946ef" },
  { name: "PDF to Excel", href: "pdf-to-excel", icon: Table, color: "#10b981" },
  { name: "Remove Background", href: "remove-bg", icon: ImageMinus, color: "#7c3aed" },
  { name: "Resize Image", href: "resize-image", icon: Maximize2, color: "#fbbf24" },
  { name: "Rotate Image", href: "rotate-image", icon: RotateCcw, color: "#6b7280" },
  { name: "Video to Audio", href: "video-to-audio", icon: Video, color: "#2563eb" },
  { name: "Add Filters To Image", href: "add-filters", icon: Sparkles, color: "#c026d3" },
];

const shuffleArray = (
  array: {
    name: string;
    href: string;
    icon: ForwardRefExoticComponent<
      Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
    >;
    color: string;
  }[]
) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function MoreToolsSidebar({ currentPage }: MoreToolsSidebarProps) {
  const [randomizedTools, setRandomizedTools] = useState<typeof pdfTools>([]);

  useEffect(() => {
    const availableTools = pdfTools.filter((tool) => tool.href !== currentPage);
    const shuffledTools = shuffleArray(availableTools).slice(0, 9);
    setRandomizedTools(shuffledTools);
  }, [currentPage]);

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-sm md:mt-0 mt-20">
      <h3 className="text-xl font-bold mb-4 uppercase">More Tools</h3>
      <ul className="space-y-2">
        {randomizedTools.map((tool, index) => (
          <li key={index}>
            <Link
              href={`/${tool.href}`}
              className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-700 p-2 rounded-md bg-white shadow-sm hover:text-gray-800 hover:bg-gray-200 transition-colors"
            >
              <span style={{ color: tool.color }}>
                <tool.icon size={16} />
              </span>
              {tool.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
