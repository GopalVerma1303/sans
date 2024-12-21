import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getContentTree } from "@/utils/markdown";
import { NotesProvider } from "@/context/notes-context";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Markdown Notes",
  description: "A simple markdown notes viewer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const contentTree = getContentTree();

  return (
    <html lang="en">
      <body className={inter.className}>
        <NotesProvider initialTree={contentTree}>
          {children}
          <Toaster />
        </NotesProvider>
      </body>
    </html>
  );
}
