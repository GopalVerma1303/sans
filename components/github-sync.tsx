import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Github, Save } from "lucide-react";
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

interface GitHubSyncProps {
  onSync: (token: string, repo: string) => Promise<void>;
}

export function GitHubSync({ onSync }: GitHubSyncProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState("");
  const [repo, setRepo] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await onSync(token, repo);
      setIsOpen(false);
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Github className="h-4 w-4 mr-2" />
          Sync with GitHub
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sync with GitHub</DialogTitle>
          <DialogDescription>
            Enter your GitHub personal access token and repository details to
            sync your notes.
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
          <Save className="h-4 w-4 mr-2" />
          {isSyncing ? "Syncing..." : "Save to GitHub"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
