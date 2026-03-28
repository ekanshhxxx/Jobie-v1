import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import "./reference-ui.css";
import Navbar from "./components/CardNav";
import ThemeProvider from "./components/ThemeProvider";
import ToastProvider from "./components/ToastProvider";
import ChatbotWidget from "./components/ChatbotWidget";

const offlineFontVariables: CSSProperties = {
  ["--font-geist-sans" as string]: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  ["--font-geist-mono" as string]: "'Consolas', 'Courier New', monospace",
  ["--font-playfair" as string]: "'Times New Roman', Georgia, serif",
  ["--font-lora" as string]: "'Times New Roman', Georgia, serif",
  ["--font-jetbrains" as string]: "'Consolas', 'Courier New', monospace",
  ["--font-space-grotesk" as string]: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
};

export const metadata: Metadata = {
  title: "Jobie — AI-Powered Job Matching",
  description: "Find your next role with GitHub verification and AI resume parsing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased"
        style={offlineFontVariables}
      >
        <ThemeProvider>
          <ToastProvider>
            <Navbar />
            {children}
            <ChatbotWidget />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
