import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chatin AI | Build AI Chatbots that Understand, Engage & Improve",
  description: "Enterprise RAG chatbot platform with pgvector hybrid retrieval, real-time analytics, and self-healing knowledge gap intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
