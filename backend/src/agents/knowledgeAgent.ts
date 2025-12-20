import OpenAI from 'openai';
import { env } from '../config/env';
import { KnowledgeBackend, RetrievedChunk } from '../knowledge/types';
import { ChatMessage, SourceReference } from '../types';

interface AgentResponse {
  answer: string;
  sources: SourceReference[];
}

export class KnowledgeAgent {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  async processQuery(
    backend: KnowledgeBackend,
    targetId: string,
    userMessage: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<AgentResponse> {
    try {
      // Retrieve relevant context from the knowledge backend
      const retrievedChunks = await backend.retrieve(targetId, userMessage);
      
      console.log(`[DEBUG] Query: "${userMessage}"`);
      console.log(`[DEBUG] Retrieved ${retrievedChunks.length} chunks for repoId: ${targetId}`);
      console.log(`[DEBUG] Chunk file paths:`, retrievedChunks.map(c => c.metadata.filePath));
      
      // Build the context from retrieved chunks
      const context = this.buildContext(retrievedChunks);
      
      // Create the system prompt
      const systemPrompt = this.createSystemPrompt(context);
      
      // Build conversation messages
      const messages = this.buildMessages(systemPrompt, conversationHistory, userMessage);
      
      // Get response from OpenAI
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 1000,
        temperature: 0.1,
      });

      const answer = response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
      
      console.log(`[DEBUG] Generated answer length: ${answer.length} characters`);
      
      // Extract sources from retrieved chunks
      const sources = this.extractSources(retrievedChunks);

      return { answer, sources };
    } catch (error) {
      console.error('[ERROR] Failed to process query:', error);
      throw new Error(`Failed to process query: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildContext(chunks: RetrievedChunk[]): string {
    if (chunks.length === 0) {
      return 'No relevant context found.';
    }

    return chunks
      .map((chunk, index) => {
        return `[Source ${index + 1}: ${chunk.metadata.filePath}:${chunk.metadata.startLine}-${chunk.metadata.endLine}]
${chunk.content}
`;
      })
      .join('\n---\n\n');
  }

  private createSystemPrompt(context: string): string {
    return `You are an AI assistant that answers questions strictly based on the provided repository context. 

Your guidelines:
1. Answer ONLY based on the provided context below
2. If the context doesn't contain relevant information, clearly state that you don't have enough information
3. When referencing code or files, mention the specific file paths and line numbers when available
4. Be concise but comprehensive in your explanations
5. If you're explaining code, break it down step by step
6. Do not make assumptions or add information not present in the context
7. For programming language questions: Look at file extensions (.java, .py, .js, etc.), build files (pom.xml, package.json, etc.), and code syntax to determine languages used
8. When asked about technologies or languages, examine the context for configuration files, dependencies, and code patterns

Context:
${context}

Remember: Only use information from the context above to answer questions. If you see file extensions like .java, build files like pom.xml, or Java syntax patterns, you can confidently identify Java usage. Similarly for other languages.`;
  }

  private buildMessages(
    systemPrompt: string, 
    conversationHistory: ChatMessage[], 
    currentMessage: string
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history (keeping it limited to avoid token limits)
    for (const msg of conversationHistory.slice(-6)) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: currentMessage
    });

    return messages;
  }

  private extractSources(chunks: RetrievedChunk[]): SourceReference[] {
    return chunks.map(chunk => ({
      filePath: chunk.metadata.filePath,
      startLine: chunk.metadata.startLine,
      endLine: chunk.metadata.endLine,
    }));
  }
}

// Export a singleton instance
export const knowledgeAgent = new KnowledgeAgent();