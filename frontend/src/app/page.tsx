
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
      <div className="min-h-screen bg-background font-body text-foreground flex items-center justify-center overflow-hidden">
        <div className={cn(
          "transition-all duration-700 ease-in-out",
          splashState === 'entering' && 'opacity-0 translate-y-8',
          splashState === 'visible' && 'opacity-100 translate-y-0',
          splashState === 'leaving' && 'opacity-0 -translate-y-8'
        )}>
           <p className="text-xl sm:text-2xl text-muted-foreground font-headline">Chat with your GitHub repositories.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background font-body text-foreground animate-in fade-in duration-500">
      <div className="container mx-auto max-w-4xl p-4 sm:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight font-headline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Kernel</h1>
          <p className="text-lg text-muted-foreground mt-2">Go from code to conversation.</p>
        </header>

        <Tabs defaultValue="repository" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="repository">
              <Code className="mr-2 h-4 w-4" />
              Repository
            </TabsTrigger>
            <TabsTrigger value="pdf" disabled>
              <Book className="mr-2 h-4 w-4" />
              PDF (coming soon)
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="repository" className="mt-6 space-y-6">
            <RepoForm />
          </TabsContent>

          <TabsContent value="pdf" className="mt-6">
             <Card className="flex flex-col items-center justify-center h-[70vh] border-dashed">
                <CardHeader className="text-center">
                  <CardTitle>Coming Soon</CardTitle>
                  <CardDescription>Upload a PDF to chat with it.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Book className="h-16 w-16 text-muted-foreground/30" />
                </CardContent>
              </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
