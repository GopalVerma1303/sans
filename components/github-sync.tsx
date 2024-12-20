import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
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
  onSaveCredentials: (token: string, repo: string) => void;
  hasCredentials: boolean;
}

export function GitHubSync({
  onSaveCredentials,
  hasCredentials,
}: GitHubSyncProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState("");
  const [repo, setRepo] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSaveCredentials(token, repo);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save credentials:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Github className="h-4 w-4 mr-2" />
          {hasCredentials ? "Connected to GitHub" : "Connect GitHub"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect to GitHub</DialogTitle>
          <DialogDescription>
            Enter your GitHub personal access token and repository details to
            sync your notes. The repository will be used as your notes database.
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
          onClick={handleSave}
          disabled={!token || !repo || isSaving}
          className="w-full"
        >
          {isSaving ? "Connecting..." : "Connect Repository"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
