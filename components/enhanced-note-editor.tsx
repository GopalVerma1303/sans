"use client";

import { useState, useEffect, useCallback } from "react";
import { useNotes } from "@/context/notes-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Eye,
  Edit3,
  Hash,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import debounce from "lodash/debounce";

interface EditorProps {
  noteId: string;
}

export function EnhancedNoteEditor({ noteId }: EditorProps) {
  const { virtualTree, updateNote, addNote } = useNotes();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Find note in virtual tree
  const findNote = useCallback(() => {
    const findNoteInTree = (items: (Folder | Note)[]): Note | null => {
      for (const item of items) {
        if (!("children" in item)) {
          if (item.id === noteId) return item;
        } else {
          const found = findNoteInTree(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findNoteInTree(virtualTree.children);
  }, [noteId, virtualTree]);

  useEffect(() => {
    const note = findNote();
    if (note) {
      setContent(note.content);
      setTitle(note.title);
      setTags(note.tags || []);
    }
  }, [findNote]);

  const debouncedSave = useCallback(
    debounce((newContent: string, newTitle: string, newTags: string[]) => {
      setIsSaving(true);
      updateNote(noteId, {
        content: newContent,
        title: newTitle,
        tags: newTags,
      });
      setIsSaving(false);
    }, 1000),
    [noteId],
  );

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    debouncedSave(newContent, title, tags);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    debouncedSave(content, newTitle, tags);
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      const newTags = [...tags, newTag];
      setTags(newTags);
      setNewTag("");
      debouncedSave(content, title, newTags);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    debouncedSave(content, title, newTags);
  };

  const insertMarkdown = (markdown: string) => {
    const textarea = document.querySelector("textarea");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent =
      content.substring(0, start) + markdown + content.substring(end);

    setContent(newContent);
    debouncedSave(newContent, title, tags);

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + markdown.length,
        start + markdown.length,
      );
    }, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Note title"
          className="text-2xl font-bold bg-transparent border-0 px-0 text-foreground"
        />
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-sm text-muted-foreground">Saving...</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? (
              <>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="cursor-pointer"
            onClick={() => removeTag(tag)}
          >
            #{tag} ×
          </Badge>
        ))}
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add tag"
            className="w-24 h-6 px-1"
          />
        </div>
      </div>

      {!isPreview && (
        <div className="flex items-center gap-1 pb-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("**")}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("*")}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("\n- ")}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("\n1. ")}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("\n> ")}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("```\n\n```")}
            title="Code Block"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("\n# ")}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("\n## ")}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isPreview ? (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full min-h-[500px] bg-background resize-none font-mono text-sm p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Write your note in markdown..."
        />
      )}
    </div>
  );
}
