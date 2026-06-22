import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Molecular Sandbox · 3D Chemistry Simulator",
  description: "A scientifically accurate 3D chemistry simulator. Drag chemicals, mix reagents, watch real stoichiometric reactions unfold in real-time.",
  keywords: ["chemistry", "simulator", "3D", "education", "stoichiometry", "science", "lab"],
  authors: [{ name: "Molecular Sandbox" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster
          position="bottom-right"
          theme="dark"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(51, 65, 85, 0.5)",
              color: "#fff",
            },
          }}
        />
      </body>
    </html>
  );
}
