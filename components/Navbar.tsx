"use client";
import Image from "next/image";
import {
  Edit3Icon,
  HomeIcon,
  ImageIcon,
  // LucideHopOff,
  MergeIcon,
  MoveDownRightIcon,
  MenuIcon,
  Text,
  Shredder,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "dashboard", href: "/", icon: HomeIcon, iconColor: "text-rose-400" },
  {
    name: "merge pdf",
    href: "/pages/merge-pdf",
    icon: MergeIcon,
    iconColor: "text-amber-400",
  },
  {
    name: "make pdf",
    href: "/pages/images-to-pdf",
    icon: Edit3Icon,
    iconColor: "text-blue-400",
  },
  {
    name: "resize image",
    href: "/pages/resize-image",
    icon: ImageIcon,
    iconColor: "text-emerald-400",
  },
  {
    name: "compress Pdf",
    href: "/pages/compress-pdf",
    icon: Text,
    iconColor: "text-cyan-400",
  },
  {
    name: "more",
    href: "/pages/more",
    icon: MoveDownRightIcon,
    iconColor: "text-indigo-400",
  },
];

const Navbar = () => {
  const path = usePathname();

  return (
 <section className="flex items-center justify-between py-4 px-4 md:px-10 border-b-2 border-[#e8e8e8] sticky top-0 z-50 bg-white">
      {/* Logo Section */}
      <div className="flex items-center gap-2 text-sm font-semibold uppercase">
        <Image
          src="/icon.png"   
          alt="DocFlow Logo"
          width={24}        
          height={24}
        />
        DocFlow
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex">
        <ul className="flex items-center space-x-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = path === link.href;

            return (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold uppercase transition-all duration-300",
                    isActive
                      ? "bg-gray-100 text-black shadow-inner"
                      : "text-gray-500 hover:text-black hover:bg-gray-200"
                  )}
                >
                  <Icon size={16} className={link.iconColor} />
                  {link.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>



      {/* Mobile Menu & Buttons */}
      <div className="md:hidden flex items-center gap-2">
        {/* You had two identical buttons here, I've removed one and kept the correct one */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size={"icon"}>
              <MenuIcon size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full p-8">
            {/* Added a visually hidden title here to resolve the error */}
            <SheetTitle className="flex items-center gap-2 text-sm font-semibold uppercase">
              <Shredder /> DocFlow
            </SheetTitle>
            <div className="flex flex-col items-start pt-8">
              <div className="flex flex-col w-full space-y-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="flex items-center gap-2 py-2 text-xs font-semibold uppercase text-gray-700 hover:text-black transition-colors"
                    >
                      <Icon size={16} className={`${link.iconColor}`} />
                      {link.name}
                    </Link>
                  );
                })}
              </div>
              <Separator className="my-8" />
              <div className="flex flex-col w-full space-y-3">
                
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </section>
  );
};

export default Navbar;
