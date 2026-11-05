import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono, Playfair_Display, Young_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

// Guest site: Young Serif for titles, Fraunces for everything else.
const youngSerif = Young_Serif({
  variable: "--font-young-serif",
  subsets: ["latin"],
  weight: "400",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Caoimhe & Alexandre",
  description: "Wedding planning and guest information",
};

export const viewport = {
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${youngSerif.variable} ${fraunces.variable} h-full antialiased light`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
