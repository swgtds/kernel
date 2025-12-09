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
      <div className="container mx-auto max-w-4xl p-2 sm:p-4 md:p-8">
        <header className="flex justify-between items-center mb-4 sm:mb-8">
          <div className="text-left">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-headline truncate">
              Chat with{' '}
              <a 
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent/80 hover:underline transition-all duration-200 cursor-pointer inline-flex items-center gap-1"
              >
                github/{displayName}
                <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </h1>
            <p className="text-sm sm:text-md text-muted-foreground mt-1">
              Ask questions about the repository contents.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="sm:size-auto">
            <Link href="/">
              <Home className="mr-0 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
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
