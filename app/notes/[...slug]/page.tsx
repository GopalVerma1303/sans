import { getNoteContent, getAllNotePaths } from "@/utils/markdown";
import { NoteViewer } from "@/components/note-viewer";

// Define props interface extending NextJS PageProps
interface NotePageProps {
  params: {
    slug: string[];
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

// Generate static paths for all notes
export async function generateStaticParams() {
  const paths = getAllNotePaths();
  return paths.map((path) => ({
    slug: path.replace(/\.md$/, "").split("/"),
  }));
}

// Page component
export default async function NotePage({ params }: NotePageProps) {
  const notePath = `${params.slug.join("/")}.md`;
  const note = getNoteContent(notePath);

  return <NoteViewer note={note} />;
}
