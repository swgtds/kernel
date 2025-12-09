import OpenAI from 'openai';
import { env } from '../config/env';
import { FileChunk } from '../types';

export interface ChunkOptions {
  maxTokens: number;
  overlapTokens: number;
}

export class IngestionService {
  private openai: OpenAI;
  private defaultOptions: ChunkOptions = {
    maxTokens: 800,
    overlapTokens: 100,
  };

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });
      
      return response.data[0].embedding;
    } catch (error) {
      throw new Error(`Failed to create embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texts,
      });
      
      return response.data.map(item => item.embedding);
    } catch (error) {
      throw new Error(`Failed to create embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  chunkFile(
    filePath: string,
    content: string,
    repoId: string,
    options: Partial<ChunkOptions> = {}
  ): FileChunk[] {
    const opts = { ...this.defaultOptions, ...options };
    const lines = content.split('\n');
    const chunks: FileChunk[] = [];

    if (lines.length === 0) {
      return chunks;
    }

    let currentChunk = '';
    let startLine = 1;
    let currentLine = 1;

    for (const line of lines) {
      const lineWithNewline = line + '\n';
      const potentialChunk = currentChunk + lineWithNewline;
      
      // Rough token estimation: ~4 characters per token
      if (this.estimateTokens(potentialChunk) > opts.maxTokens && currentChunk.length > 0) {
        // Create chunk
        chunks.push({
          id: this.generateChunkId(repoId, filePath, startLine, currentLine - 1),
          content: currentChunk.trim(),
          metadata: {
            filePath,
            startLine,
            endLine: currentLine - 1,
            repoId,
          },
        });

        // Start new chunk with overlap
        const overlapLines = this.getOverlapLines(currentChunk, opts.overlapTokens);
        currentChunk = overlapLines + lineWithNewline;
        startLine = Math.max(1, currentLine - this.countLines(overlapLines));
      } else {
        currentChunk = potentialChunk;
      }
      
      currentLine++;
    }

    // Add final chunk if there's content
    if (currentChunk.trim().length > 0) {
      chunks.push({
        id: this.generateChunkId(repoId, filePath, startLine, currentLine - 1),
        content: currentChunk.trim(),
        metadata: {
          filePath,
          startLine,
          endLine: currentLine - 1,
          repoId,
        },
      });
    }

    return chunks;
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 4 characters per token
    return Math.ceil(text.length / 4);
  }

  private generateChunkId(repoId: string, filePath: string, startLine: number, endLine: number): string {
    return `${repoId}:${filePath}:${startLine}-${endLine}`;
  }

  private getOverlapLines(content: string, targetTokens: number): string {
    const lines = content.split('\n');
    let overlap = '';
    let tokens = 0;
    
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i] + '\n';
      const lineTokens = this.estimateTokens(line);
      
      if (tokens + lineTokens <= targetTokens) {
        overlap = line + overlap;
        tokens += lineTokens;
      } else {
        break;
      }
    }
    
    return overlap;
  }

  private countLines(text: string): number {
    return text.split('\n').length - 1;
  }

  async generateRepositorySummary(readme: string | undefined, fileTree: string[]): Promise<string> {
    const prompt = `Based on the following repository information, generate a concise 2-3 sentence summary:

README content:
${readme || 'No README available'}

File structure:
${fileTree.slice(0, 20).join('\n')}
${fileTree.length > 20 ? '... and more files' : ''}

Provide a brief summary of what this repository is about and its main purpose.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.3,
      });

      return response.choices[0]?.message?.content || 'Repository summary not available';
    } catch (error) {
      console.error('Failed to generate summary:', error);
      return 'Repository summary generation failed';
    }
  }
}