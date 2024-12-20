import { useState, useEffect } from "react";
import type { Note, Folder } from "@/types";

const NOTES_STORAGE_KEY = "markdown-notes";
const FOLDERS_STORAGE_KEY = "markdown-folders";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    const storedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
    const storedFolders = localStorage.getItem(FOLDERS_STORAGE_KEY);

    if (storedNotes) {
      setNotes(JSON.parse(storedNotes));
    }
    if (storedFolders) {
      setFolders(JSON.parse(storedFolders));
    }
  }, []);

  const saveNotesToLocalStorage = (updatedNotes: Note[]) => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };

  const saveFoldersToLocalStorage = (updatedFolders: Folder[]) => {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(updatedFolders));
    setFolders(updatedFolders);
  };

  const addFolder = (name: string, parentId: string | null) => {
    const newFolder: Folder = {
      id: Date.now().toString(),
      name,
      parentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveFoldersToLocalStorage([...folders, newFolder]);
  };

  const deleteFolder = (id: string) => {
    // Recursively get all child folder IDs
    const getChildFolderIds = (folderId: string): string[] => {
      const childFolders = folders.filter((f) => f.parentId === folderId);
      return [
        folderId,
        ...childFolders.flatMap((f) => getChildFolderIds(f.id)),
      ];
    };

    const folderIdsToDelete = getChildFolderIds(id);

    // Delete all notes in these folders
    const updatedNotes = notes.filter(
      (note) => !folderIdsToDelete.includes(note.folderId),
    );
    saveNotesToLocalStorage(updatedNotes);

    // Delete the folders
    const updatedFolders = folders.filter(
      (folder) => !folderIdsToDelete.includes(folder.id),
    );
    saveFoldersToLocalStorage(updatedFolders);
  };

  const addNote = (folderId: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "Untitled Note",
      content: "",
      folderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveNotesToLocalStorage([...notes, newNote]);
    return newNote;
  };

  const updateNote = (updatedNote: Note) => {
    const updatedNotes = notes.map((note) =>
      note.id === updatedNote.id ? updatedNote : note,
    );
    saveNotesToLocalStorage(updatedNotes);
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter((note) => note.id !== id);
    saveNotesToLocalStorage(updatedNotes);
  };

  const syncWithGitHub = async (token: string, repo: string) => {
    try {
      // Create a folder structure in GitHub
      const createFolderStructure = async (folder: Folder) => {
        const path = getFolderPath(folder);

        // Create folder by creating a .gitkeep file
        await fetch(
          `https://api.github.com/repos/${repo}/contents/${path}/.gitkeep`,
          {
            method: "PUT",
            headers: {
              Authorization: `token ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: `Create folder ${folder.name}`,
              content: Buffer.from("").toString("base64"),
            }),
          },
        );
      };

      // Get the full path for a folder
      const getFolderPath = (folder: Folder): string => {
        const path = ["content"];
        let currentFolder = folder;
        while (currentFolder) {
          path.unshift(currentFolder.name);
          currentFolder = folders.find((f) => f.id === currentFolder.parentId)!;
        }
        return path.join("/");
      };

      // Create all folders
      for (const folder of folders) {
        await createFolderStructure(folder);
      }

      // Create or update all notes
      for (const note of notes) {
        const folder = folders.find((f) => f.id === note.folderId);
        const path = `${getFolderPath(folder!)}/${note.title}.md`;

        const content = `---
title: ${note.title}
createdAt: ${note.createdAt}
updatedAt: ${note.updatedAt}
---

${note.content}`;

        const response = await fetch(
          `https://api.github.com/repos/${repo}/contents/${path}`,
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

        await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
          method,
          headers: {
            Authorization: `token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `Update ${path}`,
            content: Buffer.from(content).toString("base64"),
            ...(sha ? { sha } : {}),
          }),
        });
      }
    } catch (error) {
      console.error("Failed to sync with GitHub:", error);
      throw error;
    }
  };

  return {
    notes,
    folders,
    addFolder,
    deleteFolder,
    addNote,
    updateNote,
    deleteNote,
    syncWithGitHub,
  };
}
