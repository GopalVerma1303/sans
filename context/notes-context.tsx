"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {
  getPendingChanges,
  addPendingChange,
  clearPendingChanges,
} from "@/utils/local-storage";
import type { Note, Folder, PendingChange } from "@/types";

interface NotesContextType {
  virtualTree: Folder;
  pendingChanges: PendingChange[];
  addNote: (path: string, title: string) => void;
  addFolder: (path: string) => void;
  deleteItem: (path: string, itemType: "FILE" | "FOLDER") => void;
  updateNote: (
    id: string,
    updates: { content?: string; title?: string; tags?: string[] },
  ) => void;
  syncChanges: () => Promise<void>;
  isSyncing: boolean;
}

const NotesContext = createContext<NotesContextType | null>(null);

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
}

const VIRTUAL_NOTES_KEY = "virtual-notes";

export function NotesProvider({
  children,
  initialTree,
}: {
  children: React.ReactNode;
  initialTree: Folder;
}) {
  const [virtualTree, setVirtualTree] = useState<Folder>(initialTree);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load virtual notes from localStorage
  useEffect(() => {
    const storedNotes = localStorage.getItem(VIRTUAL_NOTES_KEY);
    if (storedNotes) {
      const virtualNotes = JSON.parse(storedNotes);
      const newTree = { ...initialTree };

      virtualNotes.forEach((note: Note) => {
        const pathParts = note.path.split("/");
        const folderPath = pathParts.slice(0, -1).join("/");
        addToTree(newTree, folderPath, { ...note, isVirtual: true });
      });

      setVirtualTree(newTree);
    }
  }, [initialTree]);

  // Save virtual notes to localStorage
  const saveVirtualNotes = (tree: Folder) => {
    const virtualNotes: Note[] = [];

    const collectVirtualNotes = (items: (Folder | Note)[]) => {
      items.forEach((item) => {
        if (!("children" in item) && item.isVirtual) {
          virtualNotes.push(item);
        } else if ("children" in item) {
          collectVirtualNotes(item.children);
        }
      });
    };

    collectVirtualNotes(tree.children);
    localStorage.setItem(VIRTUAL_NOTES_KEY, JSON.stringify(virtualNotes));
  };

  // Apply pending changes to create virtual tree
  useEffect(() => {
    const newTree = { ...initialTree };

    pendingChanges.forEach((change) => {
      if (change.type === "CREATE") {
        if (change.itemType === "FILE") {
          const pathParts = change.path.split("/");
          const fileName = pathParts.pop()!;
          const folderPath = pathParts.join("/");

          const newNote: Note = {
            slug: fileName.replace(".md", ""),
            title: fileName.replace(".md", ""),
            content: change.content || "",
            path: change.path,
            id: crypto.randomUUID(), // Added id for updateNote
            isVirtual: false,
            updatedAt: new Date().toISOString(),
          };

          addToTree(newTree, folderPath, newNote);
        } else {
          // Create folder
          const newFolder: Folder = {
            name: change.path.split("/").pop()!,
            path: change.path,
            children: [],
          };
          addToTree(
            newTree,
            change.path.split("/").slice(0, -1).join("/"),
            newFolder,
          );
        }
      } else if (change.type === "DELETE") {
        removeFromTree(newTree, change.path);
      } else if (change.type === "UPDATE") {
        updateInTree(newTree, change.path, change.content!);
      }
    });

    setVirtualTree(newTree);
    saveVirtualNotes(newTree); // Save after applying changes
  }, [pendingChanges, initialTree]);

  const addToTree = (tree: Folder, path: string, item: Folder | Note) => {
    if (!path) {
      tree.children.push(item);
      return;
    }

    const parts = path.split("/");
    let current = tree;

    parts.forEach((part) => {
      let child = current.children.find(
        (c) => "children" in c && c.name === part,
      ) as Folder | undefined;

      if (!child) {
        child = {
          name: part,
          path: `${current.path}/${part}`,
          children: [],
        };
        current.children.push(child);
      }
      current = child;
    });

    current.children.push(item);
  };

  const removeFromTree = (tree: Folder, path: string) => {
    const parts = path.split("/");
    let current = tree;

    for (let i = 0; i < parts.length - 1; i++) {
      const child = current.children.find(
        (c) => "children" in c && c.name === parts[i],
      ) as Folder | undefined;

      if (!child) return;
      current = child;
    }

    const lastPart = parts[parts.length - 1];
    current.children = current.children.filter((item) => {
      if ("children" in item) {
        return item.name !== lastPart;
      }
      return item.path !== path;
    });
  };

  const updateInTree = (tree: Folder, path: string, content: string) => {
    const parts = path.split("/");
    let current = tree;

    for (let i = 0; i < parts.length - 1; i++) {
      const child = current.children.find(
        (c) => "children" in c && c.name === parts[i],
      ) as Folder | undefined;

      if (!child) return;
      current = child;
    }

    const note = current.children.find(
      (item) => !("children" in item) && item.path === path,
    ) as Note | undefined;

    if (note) {
      note.content = content;
      note.updatedAt = new Date().toISOString();
    }
  };

  const addChange = (change: PendingChange) => {
    addPendingChange(change);
    setPendingChanges(getPendingChanges());
  };

  const addNote = (path: string, title: string) => {
    const content = `---\ntitle: ${title}\n---\n\n`;
    addChange({
      type: "CREATE",
      itemType: "FILE",
      path: `${path}/${title}.md`,
      content,
    });
  };

  const addFolder = (path: string) => {
    addChange({
      type: "CREATE",
      itemType: "FOLDER",
      path,
    });
  };

  const deleteItem = (path: string, itemType: "FILE" | "FOLDER") => {
    addChange({
      type: "DELETE",
      itemType,
      path,
    });
  };

  const updateNote = (
    id: string,
    updates: { content?: string; title?: string; tags?: string[] },
  ) => {
    const updateNoteInTree = (items: (Folder | Note)[]): boolean => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!("children" in item)) {
          if (item.id === id) {
            items[i] = {
              ...item,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
            return true;
          }
        } else {
          if (updateNoteInTree(item.children)) return true;
        }
      }
      return false;
    };

    const newTree = { ...virtualTree };
    if (updateNoteInTree(newTree.children)) {
      setVirtualTree(newTree);
      saveVirtualNotes(newTree);
    }
  };

  const syncChanges = async () => {
    setIsSyncing(true);
    try {
      const token = localStorage.getItem("github-token");
      const repo = localStorage.getItem("github-repo");

      if (!token || !repo) {
        throw new Error("GitHub credentials not found");
      }

      for (const change of pendingChanges) {
        const path = `content/${change.path}`;

        if (change.type === "DELETE") {
          await deleteFromGitHub(path, token, repo);
        } else if (change.type === "CREATE" || change.type === "UPDATE") {
          await commitToGitHub(path, change.content || "", token, repo);
        }
      }

      clearPendingChanges();
      setPendingChanges([]);
    } catch (error) {
      console.error("Failed to sync changes:", error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <NotesContext.Provider
      value={{
        virtualTree,
        pendingChanges,
        addNote,
        addFolder,
        deleteItem,
        updateNote,
        syncChanges,
        isSyncing,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

async function commitToGitHub(
  path: string,
  content: string,
  token: string,
  repo: string,
) {
  const response = await fetch(
    `https://api.github.com/repos/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Update ${path}`,
        content: Buffer.from(content).toString("base64"),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to commit to GitHub: ${response.statusText}`);
  }
}

async function deleteFromGitHub(path: string, token: string, repo: string) {
  const response = await fetch(
    `https://api.github.com/repos/${repo}/contents/${path}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Delete ${path}`,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to delete from GitHub: ${response.statusText}`);
  }
}
