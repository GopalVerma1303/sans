import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  FolderIcon,
  File,
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
import type { Folder, Note } from "@/types";

interface FolderTreeProps {
  folders: Folder[];
  notes: Note[];
  selectedNoteId: string | null;
  onNoteSelect: (id: string) => void;
  onFolderCreate: (name: string, parentId: string | null) => void;
  onFolderDelete: (id: string) => void;
  onNoteCreate: (folderId: string) => void;
  onNoteDelete: (id: string) => void;
}

export function FolderTree({
  folders,
  notes,
  selectedNoteId,
  onNoteSelect,
  onFolderCreate,
  onFolderDelete,
  onNoteCreate,
  onNoteDelete,
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingIn, setCreatingIn] = useState<string | null>(null);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFolder = (parentId: string | null) => {
    if (newFolderName) {
      onFolderCreate(newFolderName, parentId);
      setNewFolderName("");
      setCreatingIn(null);
    }
  };

  const renderFolder = (folder: Folder) => {
    const childFolders = folders.filter((f) => f.parentId === folder.id);
    const folderNotes = notes.filter((n) => n.folderId === folder.id);
    const isExpanded = expandedFolders.has(folder.id);

    return (
      <div key={folder.id} className="ml-4">
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              className="flex items-center gap-1 p-1 rounded hover:bg-accent cursor-pointer"
              onClick={() => toggleFolder(folder.id)}
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
            <ContextMenuItem onClick={() => setCreatingIn(folder.id)}>
              New Folder
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onNoteCreate(folder.id)}>
              New Note
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onFolderDelete(folder.id)}>
              Delete Folder
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {isExpanded && (
          <div className="ml-4">
            {creatingIn === folder.id && (
              <div className="flex items-center gap-2 p-1">
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFolder(folder.id);
                  }}
                  placeholder="Folder name..."
                  className="h-8" // Adding a smaller height class instead of using size prop
                />
                <Button size="sm" onClick={() => handleCreateFolder(folder.id)}>
                  Create
                </Button>
              </div>
            )}
            {childFolders.map(renderFolder)}
            {folderNotes.map((note) => (
              <div
                key={note.id}
                className={`flex items-center gap-2 p-1 ml-4 rounded cursor-pointer ${
                  selectedNoteId === note.id ? "bg-accent" : "hover:bg-accent"
                }`}
                onClick={() => onNoteSelect(note.id)}
              >
                <File className="h-4 w-4" />
                <span>{note.title || "Untitled Note"}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNoteDelete(note.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-[500px] p-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Files</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCreatingIn("root")}
        >
          <Plus className="h-4 w-4 mr-1" />
          New Folder
        </Button>
      </div>

      {creatingIn === "root" && (
        <div className="flex items-center gap-2 mb-2">
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder(null);
            }}
            placeholder="Folder name..."
            className="h-8" // Adding a smaller height class instead of using size prop
          />
          <Button size="sm" onClick={() => handleCreateFolder(null)}>
            Create
          </Button>
        </div>
      )}

      {folders.filter((f) => !f.parentId).map(renderFolder)}
    </div>
  );
}
