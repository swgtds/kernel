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
    const parts = repoId.split('-');
    if (parts[0] === 'github' && parts.length >= 3) {
      const owner = parts[1];
      const repo = parts.slice(2).join('-');
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
    // Auto-scroll to the bottom of the chat messages
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
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
    <Card className="flex flex-col h-[calc(100vh-120px)] sm:h-[75vh]">
      <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden pt-6">
        <ScrollArea className="flex-grow pr-4 -mr-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 text-sm",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === 'assistant' && (
                    <Avatar className="w-8 h-8">
                        <AvatarFallback><Bot className="w-5 h-5"/></AvatarFallback>
                    </Avatar>
                )}
                <div
                  className={cn(
                    "p-3 rounded-lg max-w-xs sm:max-w-sm md:max-w-xl shadow-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <p className="whitespace-pre-wrap text-foreground">{message.text}</p>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-muted-foreground/20">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="sources" className="border-none">
                          <AccordionTrigger className="text-xs font-semibold py-1 hover:no-underline">
                            Sources ({message.sources.length})
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 text-xs space-y-1 font-mono">
                            {message.sources.map((source, index) => {
                              const githubUrl = createGitHubSourceLink(source);
                              return (
                                <a
                                  key={index}
                                  href={githubUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center bg-background/50 p-2 rounded text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all duration-200 cursor-pointer group"
                                >
                                  {renderSourceIcon(source.filePath)}
                                  <span className="truncate flex-1">
                                    {source.filePath}:{source.startLine}-{source.endLine}
                                  </span>
                                  <ExternalLink className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                </a>
                              );
                            })}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  )}
                </div>
                 {message.role === 'user' && (
                    <Avatar className="w-8 h-8">
                        <AvatarFallback><User className="w-5 h-5"/></AvatarFallback>
                    </Avatar>
                 )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start gap-3 text-sm">
                <Avatar className="w-8 h-8">
                    <AvatarFallback><Bot className="w-5 h-5"/></AvatarFallback>
                </Avatar>
                <div className="p-3 rounded-lg bg-muted flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin"/>
                    <span>Thinking...</span>
                </div>
              </div>
            )}
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Bot className="h-12 w-12 mb-4" />
                <p className="text-lg">Start the conversation</p>
                <p className="text-sm">Ask anything about the repository.</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="pt-4 border-t">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative">
            <Textarea
              placeholder="Ask a question about the repository..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading}
              className="pr-12 min-h-[40px] resize-none"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
          {error && (
            <p className="text-xs text-destructive mt-2">{error}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
