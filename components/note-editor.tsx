import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import type { Note } from "@/types";

interface NoteEditorProps {
  note: Note;
  isPreview: boolean;
  onChange: (note: Note) => void;
}

export function NoteEditor({ note, isPreview, onChange }: NoteEditorProps) {
  const [localNote, setLocalNote] = useState(note);

  useEffect(() => {
    setLocalNote(note);
  }, [note]);

  const handleChange = (field: keyof Note, value: string) => {
    const updatedNote = {
      ...localNote,
      [field]: value,
      updatedAt: new Date().toISOString(),
    };
    setLocalNote(updatedNote);
    onChange(updatedNote);
  };

  if (isPreview) {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <h1>{note.title || "Untitled Note"}</h1>
        <ReactMarkdown>{note.content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        value={localNote.title}
        onChange={(e) => handleChange("title", e.target.value)}
        placeholder="Note title"
      />
      <Textarea
        value={localNote.content}
        onChange={(e) => handleChange("content", e.target.value)}
        placeholder="Write your note in markdown..."
        className="min-h-[400px] font-mono"
      />
    </div>
  );
}
