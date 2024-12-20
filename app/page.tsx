"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNotes } from "@/hooks/use-notes";
import { NoteEditor } from "@/components/note-editor";
import { NotesList } from "@/components/notes-list";
import { GitHubSync } from "@/components/github-sync";
import { Plus, Github } from "lucide-react";

export default function NotesApp() {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const { notes, addNote, updateNote, deleteNote, syncWithGitHub } = useNotes();
  const [isPreview, setIsPreview] = useState(false);

  const selectedNote = selectedNoteId
    ? notes.find((note) => note.id === selectedNoteId)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center justify-between h-16">
          <h1 className="text-xl font-bold">Markdown Notes</h1>
          <div className="flex items-center gap-2">
            <GitHubSync onSync={syncWithGitHub} />
          </div>
        </div>
      </header>

      <main className="container py-4">
        <div className="grid grid-cols-[300px_1fr] gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Notes</h2>
              <Button
                size="sm"
                onClick={() => {
                  const newNote = {
                    id: Date.now().toString(),
                    title: "Untitled Note",
                    content: "",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
                  addNote(newNote);
                  setSelectedNoteId(newNote.id);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                New Note
              </Button>
            </div>
            <NotesList
              notes={notes}
              selectedNoteId={selectedNoteId}
              onNoteSelect={setSelectedNoteId}
              onNoteDelete={deleteNote}
            />
          </div>

          <div className="border rounded-lg p-4">
            {selectedNote ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">
                    {selectedNote.title || "Untitled Note"}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPreview(!isPreview)}
                  >
                    {isPreview ? "Edit" : "Preview"}
                  </Button>
                </div>
                <NoteEditor
                  note={selectedNote}
                  isPreview={isPreview}
                  onChange={(updatedNote) => updateNote(updatedNote)}
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                Select a note or create a new one
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
