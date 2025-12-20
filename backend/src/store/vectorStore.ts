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
    // Enhanced search that considers content, file extensions, and language indicators
    const allChunks = Array.from(this.chunks.values());
    const queryLower = query.toLowerCase();
    
    console.log(`[VECTOR_STORE] Searching for: "${query}" in ${allChunks.length} chunks`);
    
    const scored = allChunks
      .map(chunk => {
        const content = chunk.content.toLowerCase();
        const filePath = chunk.metadata.filePath.toLowerCase();
        
        // Calculate content score
        let score = this.calculateSimpleScore(content, queryLower);
        
        // Boost score for language-related queries
        const langScore = this.calculateLanguageScore(queryLower, filePath, content);
        score += langScore;
        
        // Boost score for file type relevance
        const fileScore = this.calculateFileTypeScore(queryLower, filePath);
        score += fileScore;
        
        if (score > 0) {
          console.log(`[VECTOR_STORE] File: ${chunk.metadata.filePath}, Score: ${score} (content:${this.calculateSimpleScore(content, queryLower)}, lang:${langScore}, file:${fileScore})`);
        }
        
        return { ...chunk, score };
      })
      .filter(chunk => chunk.score > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, k);

    console.log(`[VECTOR_STORE] Returning ${scored.length} scored results`);
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

  private calculateLanguageScore(query: string, filePath: string, content: string): number {
    let score = 0;

    // Language mapping for common queries
    const languageIndicators = {
      'java': ['.java', 'pom.xml', 'build.gradle', 'gradle.build', '.gradle'],
      'javascript': ['.js', '.jsx', 'package.json', 'npm', 'node'],
      'typescript': ['.ts', '.tsx', 'tsconfig.json'],
      'python': ['.py', '.pyx', 'requirements.txt', 'setup.py', 'pipfile'],
      'csharp': ['.cs', '.csproj', '.sln', '.net'],
      'c++': ['.cpp', '.hpp', '.cc', '.cxx'],
      'c': ['.c', '.h'],
      'go': ['.go', 'go.mod', 'go.sum'],
      'rust': ['.rs', 'cargo.toml', 'cargo.lock'],
      'php': ['.php', 'composer.json'],
      'ruby': ['.rb', 'gemfile'],
      'swift': ['.swift'],
      'kotlin': ['.kt', '.kts']
    };

    // Check if query mentions a programming language
    for (const [lang, indicators] of Object.entries(languageIndicators)) {
      if (query.includes(lang)) {
        // Check if file path contains language indicators
        for (const indicator of indicators) {
          if (filePath.includes(indicator)) {
            score += 10; // High boost for matching file extensions/config files
          }
        }
        
        // Check content for language-specific keywords
        if (lang === 'java') {
          const javaKeywords = ['public class', 'package ', 'import ', 'public static void main'];
          for (const keyword of javaKeywords) {
            if (content.includes(keyword.toLowerCase())) {
              score += 5;
            }
          }
        } else if (lang === 'javascript' || lang === 'typescript') {
          const jsKeywords = ['function ', 'const ', 'let ', 'var ', 'export ', 'import '];
          for (const keyword of jsKeywords) {
            if (content.includes(keyword.toLowerCase())) {
              score += 3;
            }
          }
        } else if (lang === 'python') {
          const pyKeywords = ['def ', 'class ', 'import ', 'from ', 'if __name__'];
          for (const keyword of pyKeywords) {
            if (content.includes(keyword.toLowerCase())) {
              score += 5;
            }
          }
        }
      }
    }

    return score;
  }

  private calculateFileTypeScore(query: string, filePath: string): number {
    let score = 0;

    // Boost for build/config files when asking about languages
    if (query.includes('written in') || query.includes('language') || query.includes('java') || query.includes('python')) {
      const configFiles = ['pom.xml', 'build.gradle', 'package.json', 'tsconfig.json', 'requirements.txt', 'cargo.toml', 'go.mod'];
      
      for (const configFile of configFiles) {
        if (filePath.includes(configFile)) {
          score += 15; // Very high boost for config files
        }
      }
      
      // Boost for README files that might contain language info
      if (filePath.includes('readme') || filePath.includes('README')) {
        score += 8;
      }
    }

    return score;
  }
}

// Export a singleton instance
export const vectorStore = new InMemoryVectorStore();