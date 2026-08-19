import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Chatin — Build AI Agents that Understand, Engage & Improve",
  description:
    "Create, embed and monitor AI agents that understand your business, take action through connected tools, and continuously identify where your knowledge is failing.",
  keywords: [
    "AI Agent",
    "RAG SaaS",
    "Knowledge Base",
    "Knowledge Gap Detection",
    "AI Chatbot",
    "Shopify AI",
    "Slack Integration",
  ],
  authors: [{ name: "Chatin AI" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${plusJakarta.variable} ${outfit.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-[#fcfdff] text-slate-800 font-sans antialiased selection:bg-indigo-500 selection:text-white relative">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
