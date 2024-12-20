import { useState, useEffect } from "react";
import type { Note, Folder } from "@/types";

const NOTES_STORAGE_KEY = "markdown-notes";
const FOLDERS_STORAGE_KEY = "markdown-folders";
const GITHUB_CREDENTIALS_KEY = "github-credentials";

interface GitHubCredentials {
  token: string;
  repo: string;
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [credentials, setCredentials] = useState<GitHubCredentials | null>(
    null,
  );

  // Load GitHub credentials from localStorage
  useEffect(() => {
    const storedCredentials = localStorage.getItem(GITHUB_CREDENTIALS_KEY);
    if (storedCredentials) {
      setCredentials(JSON.parse(storedCredentials));
    }
  }, []);

  // Initialize data from both localStorage and GitHub
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        // Load from localStorage first for immediate display
        const storedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
        const storedFolders = localStorage.getItem(FOLDERS_STORAGE_KEY);

        if (storedNotes) setNotes(JSON.parse(storedNotes));
        if (storedFolders) setFolders(JSON.parse(storedFolders));

        // Then fetch from GitHub if credentials exist
        if (credentials) {
          await fetchFromGitHub(credentials.token, credentials.repo);
        }
      } catch (error) {
        console.error("Failed to initialize data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [credentials]);

  const fetchFromGitHub = async (token: string, repo: string) => {
    try {
      // Fetch content directory structure
      const response = await fetch(
        `https://api.github.com/repos/${repo}/contents/content`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Content directory doesn't exist yet, initialize it
          return;
        }
        throw new Error("Failed to fetch content from GitHub");
      }

      const newFolders: Folder[] = [];
      const newNotes: Note[] = [];

      // Recursive function to process directory contents
      const processDirectory = async (
        path: string,
        parentId: string | null,
      ) => {
        const dirResponse = await fetch(
          `https://api.github.com/repos/${repo}/contents/${path}`,
          {
            headers: {
              Authorization: `token ${token}`,
              Accept: "application/vnd.github.v3+json",
            },
          },
        );
        const items = await dirResponse.json();

        for (const item of items) {
          if (item.type === "dir" && item.name !== ".git") {
            const folder: Folder = {
              id: Buffer.from(item.path).toString("base64"),
              name: item.name,
              parentId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            newFolders.push(folder);
            await processDirectory(item.path, folder.id);
          } else if (item.type === "file" && item.name.endsWith(".md")) {
            const contentResponse = await fetch(item.download_url);
            const content = await contentResponse.text();
            const { metadata, markdown } =
              parseMarkdownWithFrontmatter(content);

            const note: Note = {
              id: Buffer.from(item.path).toString("base64"),
              title: item.name.replace(".md", ""),
              content: markdown,
              folderId: parentId || "root",
              createdAt: metadata.createdAt || new Date().toISOString(),
              updatedAt: metadata.updatedAt || new Date().toISOString(),
            };
            newNotes.push(note);
          }
        }
      };

      await processDirectory("content", null);

      // Merge with existing data
      const mergedFolders = mergeFolders(folders, newFolders);
      const mergedNotes = mergeNotes(notes, newNotes);

      setFolders(mergedFolders);
      setNotes(mergedNotes);

      // Update localStorage
      localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(mergedFolders));
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(mergedNotes));
    } catch (error) {
      console.error("Failed to fetch from GitHub:", error);
      throw error;
    }
  };

  const parseMarkdownWithFrontmatter = (content: string) => {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return {
        metadata: {},
        markdown: content,
      };
    }

    const [, frontmatter, markdown] = match;
    const metadata = frontmatter.split("\n").reduce(
      (acc, line) => {
        const [key, value] = line.split(": ");
        if (key && value) {
          acc[key.trim()] = value.trim();
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    return { metadata, markdown: markdown.trim() };
  };

  const mergeFolders = (local: Folder[], remote: Folder[]): Folder[] => {
    const merged = new Map<string, Folder>();

    // Add all local folders
    local.forEach((folder) => merged.set(folder.id, folder));

    // Merge or add remote folders
    remote.forEach((folder) => {
      const existing = merged.get(folder.id);
      if (existing) {
        merged.set(folder.id, {
          ...folder,
          updatedAt: new Date(
            Math.max(
              new Date(existing.updatedAt).getTime(),
              new Date(folder.updatedAt).getTime(),
            ),
          ).toISOString(),
        });
      } else {
        merged.set(folder.id, folder);
      }
    });

    return Array.from(merged.values());
  };

  const mergeNotes = (local: Note[], remote: Note[]): Note[] => {
    const merged = new Map<string, Note>();

    // Add all local notes
    local.forEach((note) => merged.set(note.id, note));

    // Merge or add remote notes
    remote.forEach((note) => {
      const existing = merged.get(note.id);
      if (existing) {
        merged.set(note.id, {
          ...note,
          content:
            new Date(existing.updatedAt) > new Date(note.updatedAt)
              ? existing.content
              : note.content,
        });
      } else {
        merged.set(note.id, note);
      }
    });

    return Array.from(merged.values());
  };

  const saveCredentials = (token: string, repo: string) => {
    const credentials = { token, repo };
    localStorage.setItem(GITHUB_CREDENTIALS_KEY, JSON.stringify(credentials));
    setCredentials(credentials);
  };

  const commitToGitHub = async (
    path: string,
    content: string,
    message: string,
    token: string,
    repo: string,
  ) => {
    try {
      // Check if file exists
      const response = await fetch(
        `https://api.github.com/repos/${repo}/contents/${path}`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        },
      );

      const existingFile = response.ok ? await response.json() : null;
      const method = existingFile ? "PUT" : "PUT";
      const sha = existingFile?.sha;

      // Create or update file
      await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method,
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          message,
          content: Buffer.from(content).toString("base64"),
          ...(sha ? { sha } : {}),
        }),
      });
    } catch (error) {
      console.error("Failed to commit to GitHub:", error);
      throw error;
    }
  };

  const deleteFromGitHub = async (
    path: string,
    message: string,
    token: string,
    repo: string,
  ) => {
    try {
      // Get file SHA
      const response = await fetch(
        `https://api.github.com/repos/${repo}/contents/${path}`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        },
      );

      if (!response.ok) return; // File doesn't exist

      const file = await response.json();

      // Delete file
      await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: "DELETE",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          message,
          sha: file.sha,
        }),
      });
    } catch (error) {
      console.error("Failed to delete from GitHub:", error);
      throw error;
    }
  };

  const addFolder = async (name: string, parentId: string | null) => {
    if (!credentials) return;

    const newFolder: Folder = {
      id: Buffer.from(`content/${name}`).toString("base64"),
      name,
      parentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update local state
    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(updatedFolders));

    // Create folder in GitHub by adding a .gitkeep file
    const path = `content/${name}/.gitkeep`;
    await commitToGitHub(
      path,
      "",
      `Create folder ${name}`,
      credentials.token,
      credentials.repo,
    );

    return newFolder;
  };

  const deleteFolder = async (id: string) => {
    if (!credentials) return;

    // Get all child folders and notes
    const getChildFolderIds = (folderId: string): string[] => {
      const childFolders = folders.filter((f) => f.parentId === folderId);
      return [
        folderId,
        ...childFolders.flatMap((f) => getChildFolderIds(f.id)),
      ];
    };

    const folderIdsToDelete = getChildFolderIds(id);

    // Delete from GitHub
    const folder = folders.find((f) => f.id === id);
    if (folder && credentials) {
      const path = `content/${folder.name}`;
      await deleteFromGitHub(
        path,
        `Delete folder ${folder.name}`,
        credentials.token,
        credentials.repo,
      );
    }

    // Update local state
    const updatedNotes = notes.filter(
      (note) => !folderIdsToDelete.includes(note.folderId),
    );
    const updatedFolders = folders.filter(
      (folder) => !folderIdsToDelete.includes(folder.id),
    );

    setNotes(updatedNotes);
    setFolders(updatedFolders);

    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(updatedFolders));
  };

  const addNote = async (folderId: string) => {
    if (!credentials) return;

    const folder = folders.find((f) => f.id === folderId);
    const newNote: Note = {
      id: Buffer.from(`content/${folder?.name || ""}/untitled.md`).toString(
        "base64",
      ),
      title: "Untitled Note",
      content: "",
      folderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update local state
    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));

    // Create note in GitHub
    const content = `---
title: ${newNote.title}
createdAt: ${newNote.createdAt}
updatedAt: ${newNote.updatedAt}
---

${newNote.content}`;

    const path = `content/${folder?.name || ""}/${newNote.title}.md`;
    await commitToGitHub(
      path,
      content,
      `Create note ${newNote.title}`,
      credentials.token,
      credentials.repo,
    );

    return newNote;
  };

  const updateNote = async (updatedNote: Note) => {
    if (!credentials) return;

    // Update local state
    const updatedNotes = notes.map((note) =>
      note.id === updatedNote.id ? updatedNote : note,
    );
    setNotes(updatedNotes);
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));

    // Update note in GitHub
    const folder = folders.find((f) => f.id === updatedNote.folderId);
    const content = `---
title: ${updatedNote.title}
createdAt: ${updatedNote.createdAt}
updatedAt: ${updatedNote.updatedAt}
---

${updatedNote.content}`;

    const path = `content/${folder?.name || ""}/${updatedNote.title}.md`;
    await commitToGitHub(
      path,
      content,
      `Update note ${updatedNote.title}`,
      credentials.token,
      credentials.repo,
    );
  };

  const deleteNote = async (id: string) => {
    if (!credentials) return;

    const note = notes.find((n) => n.id === id);
    if (note) {
      const folder = folders.find((f) => f.id === note.folderId);
      const path = `content/${folder?.name || ""}/${note.title}.md`;

      // Delete from GitHub
      await deleteFromGitHub(
        path,
        `Delete note ${note.title}`,
        credentials.token,
        credentials.repo,
      );

      // Update local state
      const updatedNotes = notes.filter((n) => n.id !== id);
      setNotes(updatedNotes);
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
    }
  };

  return {
    notes,
    folders,
    isLoading,
    addFolder,
    deleteFolder,
    addNote,
    updateNote,
    deleteNote,
    saveCredentials,
    hasCredentials: !!credentials,
  };
}
