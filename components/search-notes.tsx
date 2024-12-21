"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Tag } from "lucide-react";
import { useNotes } from "@/context/notes-context";
import type { Note } from "@/types";
import Link from "next/link";
import debounce from "lodash/debounce";

export function SearchNotes() {
  const { virtualTree } = useNotes();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Collect all available tags
  useEffect(() => {
    const tags = new Set<string>();
    const collectTags = (items: (Folder | Note)[]) => {
      items.forEach((item) => {
        if (!("children" in item) && item.tags) {
          item.tags.forEach((tag) => tags.add(tag));
        } else if ("children" in item) {
          collectTags(item.children);
        }
      });
    };
    collectTags(virtualTree.children);
    setAvailableTags(Array.from(tags));
  }, [virtualTree]);

  const searchNotes = useCallback(
    debounce((term: string, tags: string[]) => {
      const results: Note[] = [];
      const search = (items: (Folder | Note)[]) => {
        items.forEach((item) => {
          if (!("children" in item)) {
            const matchesSearch =
              term === "" ||
              item.title.toLowerCase().includes(term.toLowerCase()) ||
              item.content.toLowerCase().includes(term.toLowerCase());

            const matchesTags =
              tags.length === 0 ||
              (item.tags && tags.every((tag) => item.tags.includes(tag)));

            if (matchesSearch && matchesTags) {
              results.push(item);
            }
          } else {
            search(item.children);
          }
        });
      };
      search(virtualTree.children);
      setSearchResults(results);
    }, 300),
    [virtualTree],
  );

  useEffect(() => {
    searchNotes(searchTerm, selectedTags);
  }, [searchTerm, selectedTags, searchNotes]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => (
          <Badge
            key={tag}
            variant={selectedTags.includes(tag) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => toggleTag(tag)}
          >
            <Tag className="h-3 w-3 mr-1" />
            {tag}
          </Badge>
        ))}
      </div>

      {(searchTerm || selectedTags.length > 0) && (
        <div className="space-y-2">
          <h3 className="font-medium">
            Search Results ({searchResults.length})
          </h3>
          <div className="space-y-2">
            {searchResults.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.path.replace(".md", "")}`}
                className="block p-2 rounded-lg hover:bg-accent"
              >
                <div className="font-medium">{note.title}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {note.content.slice(0, 100)}...
                </div>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {note.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
