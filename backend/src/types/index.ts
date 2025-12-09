export interface RetrievedChunk {
  content: string;
  metadata: {
    filePath: string;
    startLine: number;
    endLine: number;
    score?: number;
  };
}

export interface KnowledgeBackend {
  ingest(input: unknown): Promise<string>; // repoId / pdfId
  retrieve(id: string, query: string): Promise<RetrievedChunk[]>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  repoId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SourceReference {
  filePath: string;
  startLine: number;
  endLine: number;
}

export interface ChatResponse {
  conversationId: string;
  answer: string;
  sources: SourceReference[];
}

export interface RegisterRepoRequest {
  githubUrl: string;
}

export interface RegisterRepoResponse {
  repoId: string;
  summary: string;
  githubUrl: string;
}

export interface ChatRequest {
  repoId: string;
  message: string;
  conversationId?: string;
}

export interface FileChunk {
  id: string;
  content: string;
  metadata: {
    filePath: string;
    startLine: number;
    endLine: number;
    repoId: string;
  };
  embedding?: number[];
}