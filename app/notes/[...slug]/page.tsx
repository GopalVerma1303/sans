import { getContentTree, getAllNotePaths } from "@/utils/markdown";
import { EnhancedNoteEditor } from "@/components/enhanced-note-editor";

// This is required for static site generation
export function generateStaticParams() {
  const paths = getAllNotePaths();
  return paths.map((path) => ({
    slug: path.replace(".md", "").split("/"),
  }));
}

export default function NotePage({ params }: { params: { slug: string[] } }) {
  const noteId = params.slug.join("/");
  return <EnhancedNoteEditor noteId={noteId} />;
}
