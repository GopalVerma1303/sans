import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Note, Folder } from "@/types";

// Add this new function to get all possible note paths
export function getAllNotePaths(dir: string = "content"): string[] {
  let results: string[] = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.relative("content", fullPath);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      results = results.concat(getAllNotePaths(fullPath));
    } else if (item.endsWith(".md")) {
      results.push(relativePath);
    }
  }

  return results;
}

export function getContentTree(contentPath: string = "content"): Folder {
  const root: Folder = {
    name: "root",
    path: contentPath,
    children: [],
  };

  function processDirectory(currentPath: string, parentFolder: Folder) {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const relativePath = path.relative("content", fullPath);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        const folder: Folder = {
          name: item,
          path: relativePath,
          children: [],
        };
        processDirectory(fullPath, folder);
        parentFolder.children.push(folder);
      } else if (item.endsWith(".md")) {
        const fileContent = fs.readFileSync(fullPath, "utf-8");
        const { data, content } = matter(fileContent);

        const note: Note = {
          slug: item.replace(".md", ""),
          title: data.title || item.replace(".md", ""),
          content: content,
          path: relativePath,
        };
        parentFolder.children.push(note);
      }
    }
  }

  processDirectory(contentPath, root);
  return root;
}

export function getNoteContent(notePath: string): Note {
  const fullPath = path.join(process.cwd(), "content", notePath);
  const fileContent = fs.readFileSync(fullPath, "utf-8");
  const { data, content } = matter(fileContent);

  return {
    slug: path.basename(notePath, ".md"),
    title: data.title || path.basename(notePath, ".md"),
    content,
    path: notePath,
  };
}
