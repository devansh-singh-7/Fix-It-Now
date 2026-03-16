import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Prevent invisible text flash
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Prevent invisible text flash
  preload: true,
});

export const metadata: Metadata = {
  title: "FixItNow - Maintenance Management",
  description: "Modern maintenance management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Inline critical CSS to prevent white flash */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html { 
                background: linear-gradient(to bottom, #f8fafc, #ffffff, #f1f5f9); 
                min-height: 100vh;
              }
              @media (prefers-color-scheme: dark) { 
                html { 
                  background: linear-gradient(to bottom, #0a0a0a, #18181b, #0a0a0a); 
                } 
              }
              body { min-height: 100vh; }
              #__next { min-height: 100vh; }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-950`}
      >
        {children}
      </body>
    </html>
  );
}
