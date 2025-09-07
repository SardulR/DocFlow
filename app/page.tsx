import Link from "next/link";
import React from "react";
import LandingPage from "./pages/dashboard/page";

const page = () => {
  return (
    <>
      {/* <div className="flex flex-col gap-2">
        <Link href={"/pages/merge-pdf"}>Merge Pdf</Link>
        <Link href={"/pages/split-pdf"}>Split Pdf</Link>
        <Link href={"/pages/compress-pdf"}>Compress PDF</Link>
        <Link href={"/pages/pdf-word"}>PDF to word</Link>
        <Link href={"/pages/pdf-to-excel"}>PDF to excel</Link>
        <Link href={"/pages/pdf-to-images"}>PDF to Image</Link>
        <Link href={"/pages/images-to-pdf"}>imag to pdf</Link>
        <Link href={"/pages/add-number-to-pages"}>Add Number To Pages</Link>
        <Link href={"/pages/protect-by-password"}>Protect The PDF</Link>
        <Link href={"/pages/crop-image"}>Crop The Image</Link>
        <Link href={"/pages/resize-image"}>Resize Image</Link>
        <Link href={"/pages/convert-image"}>convert Image</Link>
        <Link href={"/pages/compress-image"}>compress Image</Link>
        <Link href={"/pages/rotate-image"}>rotate Image</Link>
        <Link href={"/pages/add-filters"}>Add Filters To Image</Link>
        <Link href={"/pages/remove-bg"}>remove background image</Link>
        <Link href={"/pages/video-to-gif"}>video to gif</Link>
        <Link href={"/pages/excel-to-pdf"}>Ecel To PDf</Link>
        <Link href={"/pages/video-to-audio"}>video-to-audio</Link>
        <Link href={"/pages/edit-pdf"}>Edit Pdf</Link>
        <Link href={"/pages/remove-pdf-pages"}>Remove Pages From Pdf</Link>
        <Link href={"/pages/extract-pdf-pages"}>Extract Pages From Pdf</Link>
        <Link href={"/pages/organize-pdf"}>Organize Pdf</Link>
        <Link href={"/pages/more"}>More</Link>
      </div>  */}
      <LandingPage />
    </>
  );
};

export default page;
