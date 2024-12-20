import { FolderTree } from "@/components/folder-tree";
import { getContentTree } from "@/utils/markdown";

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const contentTree = getContentTree();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center justify-between h-16">
          <h1 className="text-xl font-bold">Markdown Notes</h1>
        </div>
      </header>

      <main className="container py-4">
        <div className="grid grid-cols-[300px_1fr] gap-4">
          <div className="border rounded-lg">
            <FolderTree folder={contentTree} />
          </div>
          <div className="border rounded-lg p-4">{children}</div>
        </div>
      </main>
    </div>
  );
}
