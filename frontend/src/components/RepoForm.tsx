"use client";

import { useState } from "react";
import { Github, Loader2 } from "lucide-react";
import { registerRepo } from "@/lib/api";
import type { RepoSummary } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function RepoForm() {
  const [githubUrl, setGithubUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl) {
      setError("Please enter a GitHub repository URL.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const result = await registerRepo(githubUrl);
      toast({
        title: "Link added",
        description: "You're all set — let's chat with this repo.",
      });
      router.push(`/chat/${result.repoId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Hmm, something went wrong. Please try again.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Couldn't add the link",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Github className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
          <span>Paste a GitHub link</span>
        </CardTitle>
        <CardDescription className="text-sm sm:text-base leading-relaxed">
          Drop the repo link here and start chatting.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
            <Input
              type="url"
              placeholder="Paste GitHub link (owner/repo)"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              disabled={isLoading}
              className="flex-grow text-sm sm:text-base min-h-[44px] sm:min-h-[40px]"
            />
            <Button
              type="submit"
              disabled={isLoading || !githubUrl}
              className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 min-h-[44px] sm:min-h-[40px] text-sm sm:text-base font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Start chat"
              )}
            </Button>
          </div>
          {error && !isLoading && (
            <Alert variant="destructive" className="mt-3">
              <AlertTitle className="text-sm font-medium">Heads up</AlertTitle>
              <AlertDescription className="text-sm leading-relaxed mt-1">{error}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
