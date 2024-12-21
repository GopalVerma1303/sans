import type { PendingChange } from "@/types";

const PENDING_CHANGES_KEY = "markdown-notes-pending-changes";

export function getPendingChanges(): PendingChange[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(PENDING_CHANGES_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function addPendingChange(change: PendingChange) {
  const changes = getPendingChanges();
  // Remove any existing changes for the same path
  const filteredChanges = changes.filter((c) => c.path !== change.path);
  const newChanges = [...filteredChanges, change];
  localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(newChanges));
}

export function clearPendingChanges() {
  localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify([]));
}
