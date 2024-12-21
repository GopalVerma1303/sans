export interface Note {
  id: string;
  title: string;
  content: string;
  path: string;
  isVirtual?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  name: string;
  path: string;
  children: (Folder | Note)[];
}

export interface PendingChange {
  type: "CREATE" | "UPDATE" | "DELETE";
  itemType: "FILE" | "FOLDER";
  path: string;
  content?: string;
  metadata?: {
    tags?: string[];
    title?: string;
  };
}
