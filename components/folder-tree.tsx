"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  ChevronDown,
  FolderIcon,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNotes } from "@/context/notes-context";
import type { Folder, Note } from "@/types";

interface FolderTreeProps {
  folder: Folder;
}

export function FolderTree() {
  const { virtualTree, addNote, addFolder, deleteItem } = useNotes();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set([virtualTree.path]),
  );
  const [isCreating, setIsCreating] = useState(false);
  const [createType, setCreateType] = useState<"file" | "folder">("file");
  const [createPath, setCreatePath] = useState("");
  const [newItemName, setNewItemName] = useState("");
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

  const handleCreate = () => {
    if (!newItemName) return;

    const path = createPath ? `${createPath}/${newItemName}` : newItemName;

    if (createType === "file") {
      addNote(createPath, newItemName);
    } else {
      addFolder(path);
    }

    setIsCreating(false);
    setNewItemName("");
  };

  const handleDelete = (path: string, type: "FILE" | "FOLDER") => {
    if (
      confirm(`Are you sure you want to delete this ${type.toLowerCase()}?`)
    ) {
      deleteItem(path, type);
    }
  };

  const renderItem = (item: Folder | Note) => {
    const isFolder = "children" in item;
    const isExpanded = expandedFolders.has(item.path);
    const notePath = `/notes/${item.path.replace(".md", "")}/`;
    const isCurrentNote = pathname === notePath;

    if (isFolder) {
      const folder = item as Folder;
      return (
        <div key={folder.path}>
          <ContextMenu>
            <ContextMenuTrigger>
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
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem
                onClick={() => {
                  setCreateType("file");
                  setCreatePath(folder.path);
                  setIsCreating(true);
                }}
              >
                New File
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  setCreateType("folder");
                  setCreatePath(folder.path);
                  setIsCreating(true);
                }}
              >
                New Folder
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => handleDelete(folder.path, "FOLDER")}
              >
                Delete Folder
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          {isExpanded && (
            <div className="ml-4">{folder.children.map(renderItem)}</div>
          )}
        </div>
      );
    } else {
      const note = item as Note;
      return (
        <ContextMenu>
          <ContextMenuTrigger>
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
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => handleDelete(note.path, "FILE")}>
              Delete File
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    }
  };

  return (
    <>
      <div className="min-h-[500px] p-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Notes</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setCreateType("file");
              setCreatePath("");
              setIsCreating(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
        {virtualTree.children.map(renderItem)}
      </div>

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create New {createType === "file" ? "File" : "Folder"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={
                  createType === "file" ? "File name" : "Folder name"
                }
              />
            </div>
          </div>
          <Button
            onClick={handleCreate}
            disabled={!newItemName}
            className="w-full"
          >
            Create
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
