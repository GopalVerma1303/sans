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
