import { FileChunk } from '../types';

export interface VectorStore {
  addChunks(chunks: FileChunk[]): Promise<void>;
  search(query: string, k?: number): Promise<FileChunk[]>;
  getChunksByRepoId(repoId: string): Promise<FileChunk[]>;
  deleteByRepoId(repoId: string): Promise<void>;
}

export class InMemoryVectorStore implements VectorStore {
  private chunks: Map<string, FileChunk> = new Map();

  async addChunks(chunks: FileChunk[]): Promise<void> {
    for (const chunk of chunks) {
      this.chunks.set(chunk.id, chunk);
    }
  }

  async search(query: string, k: number = 5): Promise<FileChunk[]> {
    // Simple text-based search for now - in production you'd use vector similarity
    const allChunks = Array.from(this.chunks.values());
    const queryLower = query.toLowerCase();
    
    const scored = allChunks
      .map(chunk => {
        const content = chunk.content.toLowerCase();
        const score = this.calculateSimpleScore(content, queryLower);
        return { ...chunk, score };
      })
      .filter(chunk => chunk.score > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, k);

    return scored;
  }

  async getChunksByRepoId(repoId: string): Promise<FileChunk[]> {
    return Array.from(this.chunks.values()).filter(
      chunk => chunk.metadata.repoId === repoId
    );
  }

  async deleteByRepoId(repoId: string): Promise<void> {
    const toDelete = [];
    for (const [id, chunk] of this.chunks.entries()) {
      if (chunk.metadata.repoId === repoId) {
        toDelete.push(id);
      }
    }
    for (const id of toDelete) {
      this.chunks.delete(id);
    }
  }

  private calculateSimpleScore(content: string, query: string): number {
    const words = query.split(/\s+/);
    let score = 0;
    
    for (const word of words) {
      if (word.length > 2) {
        const matches = (content.match(new RegExp(word, 'gi')) || []).length;
        score += matches;
      }
    }
    
    return score;
  }
}

// Export a singleton instance
export const vectorStore = new InMemoryVectorStore();