import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { Note } from "@/types";

interface NotesListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onNoteSelect: (id: string) => void;
  onNoteDelete: (id: string) => void;
}

export function NotesList({
  notes,
  selectedNoteId,
  onNoteSelect,
  onNoteDelete,
}: NotesListProps) {
  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-2">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer ${
              selectedNoteId === note.id ? "bg-accent" : ""
            }`}
            onClick={() => onNoteSelect(note.id)}
          >
            <div className="flex-1 truncate">
              <h3 className="font-medium truncate">
                {note.title || "Untitled Note"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {new Date(note.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
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
    </ScrollArea>
  );
}
