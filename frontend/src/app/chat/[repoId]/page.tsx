"use client";

import { ChatWindow } from "@/components/ChatWindow";
import { Home, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { use } from "react";

interface ChatPageProps {
  params: Promise<{
    repoId: string;
  }>;
}

// Utility functions to convert URL-safe ID to GitHub format
function parseRepoId(repoId: string) {
  // Convert "github-owner-repo" to { owner: "owner", repo: "repo" }
  const parts = repoId.split('-');
  if (parts[0] === 'github' && parts.length >= 3) {
    const owner = parts[1];
    const repo = parts.slice(2).join('-'); // In case repo name contains hyphens
    return { owner, repo };
  }
  return null;
}

function getGithubUrl(repoId: string): string {
  const parsed = parseRepoId(repoId);
  return parsed ? `https://github.com/${parsed.owner}/${parsed.repo}` : '';
}

function getDisplayName(repoId: string): string {
  const parsed = parseRepoId(repoId);
  return parsed ? `${parsed.owner}/${parsed.repo}` : repoId;
}

export default function ChatPage({ params }: ChatPageProps) {
  const { repoId } = use(params);
  const displayName = getDisplayName(repoId);
  const githubUrl = getGithubUrl(repoId);

  return (
    <main className="min-h-screen bg-background font-body text-foreground">
      <div className="container mx-auto max-w-4xl p-3 sm:p-4 md:p-8">
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4 md:mb-8">
          <div className="text-left min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight font-headline">
              <span className="block sm:inline">Chat with{' '}</span>
              <a 
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent/80 hover:underline transition-all duration-200 cursor-pointer inline-flex items-center gap-1 break-all sm:break-normal"
              >
                <span className="break-all">github/{displayName}</span>
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0" />
              </a>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
              Ask questions about the repository contents.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto flex-shrink-0">
            <Link href="/">
              <Home className="mr-1 sm:mr-2 h-4 w-4" />
              <span>Home</span>
            </Link>
          </Button>
        </header>
        
        <ChatWindow
          knowledgeType="github"
          targetId={repoId}
        />
      </div>
    </main>
  );
}
