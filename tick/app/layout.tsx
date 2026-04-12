import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Tick — Swipe. Discover. Invest.",
  description:
    "A Tinder-style stock discovery app. Swipe through stocks, save tickers, and ask Gemini anything.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased font-sans flex flex-col min-h-full`}>
      <body className="min-h-full flex flex-col flex-grow">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
