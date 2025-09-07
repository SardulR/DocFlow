import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import LoadingBar from "@/components/LoadingBar";

const poppinsSans = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
  ],
});

export const metadata: Metadata = {
  title: "DocFlow",
  description: "A One Stop Place For All Your PDF Work!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppinsSans.className} antialiased`}>
        <LoadingBar />
        {children}
      </body>
    </html>
  );
}
