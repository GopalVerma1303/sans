"use client";

import { useState, useEffect } from "react";
import {
  getPendingChanges,
  addPendingChange,
  clearPendingChanges,
} from "@/utils/local-storage";
import type { PendingChange } from "@/types";

export function useChanges() {
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setPendingChanges(getPendingChanges());
  }, []);

  const addChange = (change: PendingChange) => {
    addPendingChange(change);
    setPendingChanges(getPendingChanges());
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
      window.location.reload(); // Reload to reflect changes
    } catch (error) {
      console.error("Failed to sync changes:", error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    pendingChanges,
    addChange,
    syncChanges,
    isSyncing,
  };
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
