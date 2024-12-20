import { getNoteContent, getAllNotePaths } from "@/utils/markdown";
import { NoteViewer } from "@/components/note-viewer";

import { Params } from "next/dist/shared/lib/router/utils/route-matcher";

interface NotePageProps {
  params: Params & {
    slug: string[];
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

// Updated to handle trailing slash in paths
export async function generateStaticParams() {
  const paths = getAllNotePaths();
  return paths.map((path) => ({
    // Remove .md extension and split into segments
    slug: path.replace(".md", "").split("/"),
  }));
}

export default function NotePage({ params }: NotePageProps) {
  // Join the slug segments and add .md extension
  const notePath = `${params.slug.join("/")}.md`;
  const note = getNoteContent(notePath);
  return <NoteViewer note={note} />;
}
