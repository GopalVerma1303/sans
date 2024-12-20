"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ChevronDown, FolderIcon, FileText } from "lucide-react";
import type { Folder, Note } from "@/types";

interface FolderTreeProps {
  folder: Folder;
}

export function FolderTree({ folder }: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set([folder.path]),
  );
  const pathname = usePathname();

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderItem = (item: Folder | Note) => {
    const isFolder = "children" in item;
    const isExpanded = expandedFolders.has(item.path);
    // Update path comparison to handle trailing slash
    const notePath = `/notes/${item.path.replace(".md", "")}/`;
    const isCurrentNote = pathname === notePath;

    if (isFolder) {
      const folder = item as Folder;
      return (
        <div key={folder.path}>
          <div
            className="flex items-center gap-1 p-1 rounded hover:bg-accent cursor-pointer"
            onClick={() => toggleFolder(folder.path)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <FolderIcon className="h-4 w-4" />
            <span>{folder.name}</span>
          </div>
          {isExpanded && (
            <div className="ml-4">{folder.children.map(renderItem)}</div>
          )}
        </div>
      );
    } else {
      const note = item as Note;
      // Update link href to include trailing slash
      return (
        <Link
          key={note.path}
          href={`/notes/${note.path.replace(".md", "")}/`}
          className={`flex items-center gap-2 p-1 rounded cursor-pointer ${
            isCurrentNote ? "bg-accent" : "hover:bg-accent"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>{note.title}</span>
        </Link>
      );
    }
  };

  return (
    <div className="min-h-[500px] p-2">
      <div className="mb-4">
        <h2 className="font-semibold">Notes</h2>
      </div>
      {folder.children.map(renderItem)}
    </div>
  );
}
