"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNotes } from "@/hooks/use-notes";
import { NoteEditor } from "@/components/note-editor";
import { FolderTree } from "@/components/folder-tree";
import { GitHubSync } from "@/components/github-sync";

export default function NotesApp() {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const {
    notes,
    folders,
    isLoading,
    addFolder,
    deleteFolder,
    addNote,
    updateNote,
    deleteNote,
    saveCredentials,
    hasCredentials,
  } = useNotes();
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
            <GitHubSync
              onSaveCredentials={saveCredentials}
              hasCredentials={hasCredentials}
            />
          </div>
        </div>
      </header>

      <main className="container py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-[500px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground">Loading your notes...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[300px_1fr] gap-4">
            <div className="border rounded-lg">
              <FolderTree
                folders={folders}
                notes={notes}
                selectedNoteId={selectedNoteId}
                onNoteSelect={setSelectedNoteId}
                onFolderCreate={addFolder}
                onFolderDelete={deleteFolder}
                onNoteCreate={(folderId) => {
                  addNote(folderId).then((newNote) => {
                    if (newNote) {
                      setSelectedNoteId(newNote.id);
                    }
                  });
                }}
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
                    onChange={updateNote}
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                  {hasCredentials
                    ? "Select a note or create a new one in a folder"
                    : "Connect your GitHub repository to start taking notes"}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
