"use client";

import { ChatWindow } from "@/components/ChatWindow";
import { Home, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { use, useEffect, useState } from "react";
import { getRepoInfo } from "@/lib/api";
import type { RepoInfo } from "@/types";

interface ChatPageProps {
  params: Promise<{
    repoId: string;
  }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const { repoId } = use(params);
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRepoInfo = async () => {
      try {
        const info = await getRepoInfo(repoId);
        setRepoInfo(info);
      } catch (error) {
        console.error('Failed to fetch repo info:', error);
        // Fallback to parsing from repoId if API fails
        const fallbackInfo = parseRepoIdFallback(repoId);
        if (fallbackInfo) {
          setRepoInfo({
            repoId,
            githubUrl: `https://github.com/${fallbackInfo.owner}/${fallbackInfo.repo}`,
            owner: fallbackInfo.owner,
            repo: fallbackInfo.repo,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRepoInfo();
  }, [repoId]);

  // Fallback parsing function for old repositories
  function parseRepoIdFallback(repoId: string) {
    // First try old "github__owner__repo" format
    if (repoId.includes('__')) {
      const parts = repoId.split('__');
      if (parts[0] === 'github' && parts.length === 3) {
        return { owner: parts[1], repo: parts[2] };
      }
    }
    
    // Try old "github-owner-repo" format
    if (repoId.startsWith('github-')) {
      const parts = repoId.split('-');
      if (parts.length >= 3) {
        const owner = parts[1];
        const repo = parts.slice(2).join('-');
        return { owner, repo };
      }
    }
    
    // New format: "owner-repo" (simple format)
    const parts = repoId.split('-');
    if (parts.length >= 2) {
      const owner = parts[0];
      const repo = parts.slice(1).join('-');
      return { owner, repo };
    }
    
    return null;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background font-body text-foreground">
        <div className="container mx-auto max-w-4xl p-3 sm:p-4 md:p-8">
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Loading repository information...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background font-body text-foreground">
      <div className="container mx-auto max-w-4xl p-3 sm:p-4 md:p-8">
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4 md:mb-8">
          <div className="text-left min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight font-headline">
              <span className="block sm:inline">Chat with{' '}</span>
              {repoInfo ? (
                <a 
                  href={repoInfo.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent/80 hover:underline transition-all duration-200 cursor-pointer inline-flex items-center gap-1 break-all sm:break-normal"
                >
                  <span className="break-all">{repoInfo.owner}/{repoInfo.repo}</span>
                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0" />
                </a>
              ) : (
                <span className="text-muted-foreground">Repository</span>
              )}
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
