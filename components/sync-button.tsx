"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChanges } from "@/hooks/use-changes";
import { useToast } from "@/hooks/use-toast";

export function SyncButton() {
  const { pendingChanges, syncChanges, isSyncing } = useChanges();
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState("");
  const [repo, setRepo] = useState("");
  const { toast } = useToast();

  const handleSync = async () => {
    try {
      localStorage.setItem("github-token", token);
      localStorage.setItem("github-repo", repo);
      await syncChanges();
      setIsOpen(false);
      toast({
        title: "Changes synced successfully",
        description: "All changes have been pushed to GitHub",
      });
    } catch (error) {
      toast({
        title: "Failed to sync changes",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (pendingChanges.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative">
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
          />
          Sync Changes
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
            {pendingChanges.length}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sync to GitHub</DialogTitle>
          <DialogDescription>
            Enter your GitHub credentials to sync {pendingChanges.length}{" "}
            pending changes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="token">GitHub Token</Label>
            <Input
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              type="password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="repo">Repository (username/repo)</Label>
            <Input
              id="repo"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="username/repo"
            />
          </div>
        </div>
        <Button
          onClick={handleSync}
          disabled={!token || !repo || isSyncing}
          className="w-full"
        >
          {isSyncing ? "Syncing..." : "Sync Changes"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
