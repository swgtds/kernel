
"use client";

import { RepoForm } from "@/components/RepoForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, Code, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const [splashState, setSplashState] = useState<'entering' | 'visible' | 'leaving' | 'hidden'>('entering');

  useEffect(() => {
    const enterTimer = setTimeout(() => {
      setSplashState('visible');
    }, 100); // Short delay to trigger 'entering' animation

    const visibleTimer = setTimeout(() => {
      setSplashState('leaving');
    }, 2000); // Stay visible for ~2 seconds

    const leaveTimer = setTimeout(() => {
      setSplashState('hidden');
    }, 3000); // Total time for splash screen

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(visibleTimer);
      clearTimeout(leaveTimer);
    };
  }, []);

  if (splashState !== 'hidden') {
    return (
      <div className="min-h-screen bg-background font-body text-foreground flex items-center justify-center overflow-hidden px-4">
        <div className={cn(
          "transition-all duration-700 ease-in-out text-center max-w-md mx-auto",
          splashState === 'entering' && 'opacity-0 translate-y-8',
          splashState === 'visible' && 'opacity-100 translate-y-0',
          splashState === 'leaving' && 'opacity-0 -translate-y-8'
        )}>
           <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-headline leading-relaxed">
             Chat with your GitHub repositories.
           </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background font-body text-foreground animate-in fade-in duration-500">
      <div className="container mx-auto max-w-4xl p-4 sm:p-6 md:p-8">
        <header className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-headline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Kernel
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mt-2 leading-relaxed px-2">
            Go from code to conversation.
          </p>
        </header>

        <Tabs defaultValue="repository" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="repository" className="flex items-center justify-center gap-2 py-3 text-sm sm:text-base">
              <Code className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">Repository</span>
              <span className="xs:hidden sm:hidden">Repo</span>
            </TabsTrigger>
            <TabsTrigger value="pdf" disabled className="flex items-center justify-center gap-1 sm:gap-2 py-3 text-sm sm:text-base opacity-50 cursor-not-allowed">
              <Book className="h-4 w-4 flex-shrink-0" />
              <div className="flex flex-col items-center leading-tight">
                <span className="text-xs sm:text-sm">PDF</span>
                <span className="text-xs text-muted-foreground/60 hidden xs:inline sm:inline">(coming soon)</span>
                <span className="text-xs text-muted-foreground/60 xs:hidden sm:hidden">(coming soon)</span>
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="repository" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
            <RepoForm />
          </TabsContent>

          <TabsContent value="pdf" className="mt-4 sm:mt-6">
             <Card className="glass-card flex flex-col items-center justify-center h-[50vh] sm:h-[60vh] md:h-[70vh] border-dashed">
                <CardHeader className="text-center px-4">
                  <CardTitle className="text-lg sm:text-xl">Coming Soon</CardTitle>
                  <CardDescription className="text-sm sm:text-base leading-relaxed">
                    Upload a PDF to chat with it.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Book className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/30" />
                </CardContent>
              </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
