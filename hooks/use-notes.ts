import { useState, useEffect } from "react";
import type { Note } from "@/types";

const STORAGE_KEY = "markdown-notes";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const storedNotes = localStorage.getItem(STORAGE_KEY);
    if (storedNotes) {
      setNotes(JSON.parse(storedNotes));
    }
  }, []);

  const saveToLocalStorage = (updatedNotes: Note[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };

  const addNote = (note: Note) => {
    saveToLocalStorage([...notes, note]);
  };

  const updateNote = (updatedNote: Note) => {
    const updatedNotes = notes.map((note) =>
      note.id === updatedNote.id ? updatedNote : note,
    );
    saveToLocalStorage(updatedNotes);
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter((note) => note.id !== id);
    saveToLocalStorage(updatedNotes);
  };

  const syncWithGitHub = async (token: string, repo: string) => {
    try {
      // Convert notes to markdown files
      const files = notes.map((note) => ({
        path: `notes/${note.id}.md`,
        content: `---\ntitle: ${note.title}\ncreatedAt: ${note.createdAt}\nupdatedAt: ${note.updatedAt}\n---\n\n${note.content}`,
      }));

      // Create or update files in GitHub repository
      for (const file of files) {
        const response = await fetch(
          `https://api.github.com/repos/${repo}/contents/${file.path}`,
          {
            headers: {
              Authorization: `token ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const existingFile = response.ok ? await response.json() : null;
        const method = existingFile ? "PUT" : "PUT";
        const sha = existingFile?.sha;

        await fetch(
          `https://api.github.com/repos/${repo}/contents/${file.path}`,
          {
            method,
            headers: {
              Authorization: `token ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: `Update ${file.path}`,
              content: Buffer.from(file.content).toString("base64"),
              ...(sha ? { sha } : {}),
            }),
          },
        );
      }
    } catch (error) {
      console.error("Failed to sync with GitHub:", error);
      throw error;
    }
  };

  return {
    notes,
    addNote,
    updateNote,
    deleteNote,
    syncWithGitHub,
  };
}
