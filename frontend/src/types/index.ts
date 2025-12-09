export type Role = "user" | "assistant";

export type KnowledgeType = "github" | "pdf";

export interface ChatMessageSource {
  filePath: string;
  startLine: number;
  endLine: number;
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  sources?: ChatMessageSource[];
}

export interface RepoSummary {
  repoId: string;
  summary: string;
}

export interface ChatResponse {
  conversationId: string;
  answer: string;
  sources: ChatMessageSource[];
}
