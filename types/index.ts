export interface Note {
  slug: string;
  title: string;
  content: string;
  path: string;
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
}
