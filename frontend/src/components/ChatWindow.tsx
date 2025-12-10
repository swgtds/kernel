"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Code, FileText, Loader2, ChevronDown, ExternalLink } from "lucide-react";
import { chatWithRepo } from "@/lib/api";
import type { ChatMessage, KnowledgeType, ChatMessageSource } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface ChatWindowProps {
  knowledgeType: KnowledgeType;
  targetId: string;
}

export function ChatWindow({ knowledgeType, targetId }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Utility functions to convert targetId to GitHub info
  const parseRepoId = (repoId: string) => {
    // First try old "github__owner__repo" format
    if (repoId.includes('__')) {
      const parts = repoId.split('__');
      if (parts[0] === 'github' && parts.length === 3) {
        const owner = parts[1];
        const repo = parts[2];
        return { owner, repo };
      }
    }
    
    // Try old "github-owner-repo" format  
    if (repoId.startsWith('github-')) {
      const parts = repoId.split('-');
      if (parts.length >= 3) {
        const owner = parts[1];
        const repo = parts.slice(2).join('-'); // In case repo name contains hyphens
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
  };

  const createGitHubSourceLink = (source: ChatMessageSource): string => {
    const parsed = parseRepoId(targetId);
    if (!parsed) return '';
    
    const { owner, repo } = parsed;
    const baseUrl = `https://github.com/${owner}/${repo}/blob/main/${source.filePath}`;
    
    if (source.startLine === source.endLine) {
      return `${baseUrl}#L${source.startLine}`;
    } else {
      return `${baseUrl}#L${source.startLine}-L${source.endLine}`;
    }
  };

  useEffect(() => {
    // Auto-scroll to the bottom of the chat messages with a slight delay to handle dynamic content
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }
    };

    // Immediate scroll
    scrollToBottom();
    
    // Delayed scroll to handle accordion expansion
    const timeoutId = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatWithRepo({
        repoId: targetId,
        message: currentInput,
        conversationId,
      });

      setConversationId(response.conversationId);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: response.answer,
        sources: response.sources,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      // Revert optimistic update on error
      setMessages(prev => prev.slice(0, prev.length - 1));
      setInput(currentInput);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderSourceIcon = (filePath: string) => {
    if (knowledgeType === "pdf") {
      return <FileText className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />;
    }
    return <Code className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />;
  };

  return (
    <Card className="premium-card flex flex-col h-[calc(100dvh-120px)] sm:h-[calc(100dvh-140px)] md:h-[75dvh]">
      <CardContent className="flex-grow flex flex-col gap-2 sm:gap-4 overflow-hidden pt-3 pb-3 px-2 sm:pt-6 sm:pb-6 sm:px-6">
        <ScrollArea className="flex-grow pr-1 sm:pr-4 -mr-1 sm:-mr-4" ref={scrollAreaRef}>
          <div className="space-y-3 sm:space-y-4 md:space-y-6 pb-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2 sm:gap-3 text-sm w-full",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === 'assistant' && (
                    <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 mt-1">
                        <AvatarFallback className="bg-primary/10 text-primary border border-primary/20"><Bot className="w-3 h-3 sm:w-5 sm:h-5"/></AvatarFallback>
                    </Avatar>
                )}
                <div
                  className={cn(
                    "p-2 sm:p-3 rounded-lg shadow-sm min-w-0 break-words backdrop-blur-sm transition-all duration-200",
                    message.role === "user" 
                      ? "saas-button text-background max-w-[82%] sm:max-w-sm md:max-w-xl" 
                      : "bg-background/40 border border-border/30 text-foreground max-w-[85%] sm:max-w-md md:max-w-2xl hover:bg-background/60"
                  )}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed break-words">{message.text}</p>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/20 w-full">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="sources" className="border-none">
                          <AccordionTrigger className="text-xs font-semibold py-2 px-0 hover:no-underline justify-between [&[data-state=open]>svg]:rotate-180 text-primary">
                            <span className="text-left">Sources ({message.sources.length})</span>
                          </AccordionTrigger>
                          <AccordionContent className="pt-1 pb-0 px-0 overflow-hidden">
                            <div className="space-y-1">
                              {message.sources.map((source, index) => {
                                const githubUrl = createGitHubSourceLink(source);
                                return (
                                  <a
                                    key={index}
                                    href={githubUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center w-full bg-background/20 p-2 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 cursor-pointer group min-h-[36px] border border-border/20 hover:border-primary/30"
                                  >
                                    <div className="flex items-center min-w-0 flex-1 gap-2">
                                      {renderSourceIcon(source.filePath)}
                                      <span className="text-xs font-mono truncate flex-1 leading-tight">
                                        {source.filePath.split('/').pop()}:{source.startLine}-{source.endLine}
                                      </span>
                                    </div>
                                    <ExternalLink className="h-3 w-3 ml-2 opacity-60 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0" />
                                  </a>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  )}
                </div>
                 {message.role === 'user' && (
                    <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 mt-1">
                        <AvatarFallback className="bg-primary/10 text-primary border border-primary/20"><User className="w-3 h-3 sm:w-5 sm:h-5"/></AvatarFallback>
                    </Avatar>
                 )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start gap-2 sm:gap-3 text-sm w-full">
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 mt-1">
                    <AvatarFallback className="bg-primary/10 text-primary border border-primary/20"><Bot className="w-3 h-3 sm:w-5 sm:h-5"/></AvatarFallback>
                </Avatar>
                <div className="p-2 sm:p-3 rounded-lg bg-background/40 border border-border/30 backdrop-blur-sm flex items-center gap-2 text-foreground max-w-[85%]">
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 text-primary"/>
                    <span className="text-sm">Thinking...</span>
                </div>
              </div>
            )}
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4 py-8">
                <Bot className="h-8 w-8 sm:h-12 sm:w-12 mb-2 sm:mb-4 text-primary/50" />
                <p className="text-base sm:text-lg font-medium text-foreground">Start the conversation</p>
                <p className="text-sm text-muted-foreground mt-1">Ask anything about the repository.</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="pt-2 sm:pt-4 border-t border-border/30">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative">
            <Textarea
              placeholder="Ask any question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading}
              className="premium-input pr-10 sm:pr-14 min-h-[44px] sm:min-h-[48px] resize-none text-sm sm:text-base border-2"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="absolute right-1.5 sm:right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8 saas-button border-0 rounded-full"
            >
              <Send className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
          {error && (
            <p className="text-xs sm:text-sm text-destructive mt-2 px-1">{error}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
