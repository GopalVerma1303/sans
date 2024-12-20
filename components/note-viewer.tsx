"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import type { Note } from "@/types";

interface NoteViewerProps {
  note: Note;
}

export function NoteViewer({ note }: NoteViewerProps) {
  const [isPreview, setIsPreview] = useState(true);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{note.title}</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPreview(!isPreview)}
        >
          {isPreview ? "View Source" : "Preview"}
        </Button>
      </div>

      {isPreview ? (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{note.content}</ReactMarkdown>
        </div>
      ) : (
        <pre className="p-4 rounded-lg bg-muted font-mono text-sm whitespace-pre-wrap">
          {note.content}
        </pre>
      )}
    </div>
  );
}
