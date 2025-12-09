import { KnowledgeBackend, RetrievedChunk } from './types';
import { GitHubLoader, RepositoryInfo } from '../services/githubLoader';
import { IngestionService } from '../services/ingestion';
import { vectorStore } from '../store/vectorStore';
import { FileChunk } from '../types';

export class GithubKnowledgeBackend implements KnowledgeBackend {
  private githubLoader = new GitHubLoader();
  private ingestionService = new IngestionService();
  private repoUrlStore = new Map<string, string>(); // Store repoId -> githubUrl

  async ingest(input: unknown): Promise<string> {
    if (typeof input !== 'string') {
      throw new Error('GitHub URL must be a string');
    }

    const githubUrl = input as string;
    const repoId = this.generateRepoId(githubUrl);
    const { owner, repo } = this.githubLoader.parseGitHubUrl(githubUrl);

    // Store repository URL for later retrieval
    this.repoUrlStore.set(repoId, githubUrl);

    try {
      // Clean up any existing data for this repo
      await vectorStore.deleteByRepoId(repoId);

      // Load repository
      const repoInfo = await this.githubLoader.loadRepository(githubUrl);
      
      // Process all files into chunks
      const allChunks: FileChunk[] = [];
      
      for (const file of repoInfo.files) {
        if (file.type === 'file') {
          const chunks = this.ingestionService.chunkFile(
            file.path,
            file.content,
            repoId
          );
          allChunks.push(...chunks);
        }
      }

      // Generate embeddings for all chunks
      if (allChunks.length > 0) {
        const contents = allChunks.map(chunk => chunk.content);
        const embeddings = await this.ingestionService.createEmbeddings(contents);
        
        // Attach embeddings to chunks
        allChunks.forEach((chunk, index) => {
          chunk.embedding = embeddings[index];
        });

        // Store in vector store
        await vectorStore.addChunks(allChunks);
      }

      return repoId;
    } catch (error) {
      throw new Error(`Failed to ingest repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async retrieve(id: string, query: string): Promise<RetrievedChunk[]> {
    try {
      // Get relevant chunks from vector store
      const chunks = await vectorStore.search(query, 5);
      
      // Filter by repo ID and convert to RetrievedChunk format
      const relevantChunks = chunks
        .filter(chunk => chunk.metadata.repoId === id)
        .map(chunk => ({
          content: chunk.content,
          metadata: {
            filePath: chunk.metadata.filePath,
            startLine: chunk.metadata.startLine,
            endLine: chunk.metadata.endLine,
            score: (chunk as any).score,
          },
        }));

      return relevantChunks;
    } catch (error) {
      throw new Error(`Failed to retrieve chunks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateRepoId(githubUrl: string): string {
    const { owner, repo } = this.githubLoader.parseGitHubUrl(githubUrl);
    // Simple format: owner-repo
    return `${owner}-${repo}`;
  }

  async getRepositoryInfo(githubUrl: string): Promise<RepositoryInfo> {
    return this.githubLoader.loadRepository(githubUrl);
  }

  async generateSummary(githubUrl: string): Promise<string> {
    const repoInfo = await this.getRepositoryInfo(githubUrl);
    const fileTree = repoInfo.files.map(f => f.path);
    return this.ingestionService.generateRepositorySummary(repoInfo.readme, fileTree);
  }

  getRepoInfo(repoId: string): { url: string, owner: string, repo: string } | null {
    // Check if we have the stored URL
    const stored = this.repoUrlStore.get(repoId);
    if (stored) {
      const { owner, repo } = this.githubLoader.parseGitHubUrl(stored);
      return { url: stored, owner, repo };
    }

    // Fallback: try to parse from repoId format
    const parsed = this.parseRepoIdFallback(repoId);
    if (parsed) {
      const url = `https://github.com/${parsed.owner}/${parsed.repo}`;
      // Cache it for future requests
      this.repoUrlStore.set(repoId, url);
      return { url, owner: parsed.owner, repo: parsed.repo };
    }

    return null;
  }

  private parseRepoIdFallback(repoId: string): { owner: string, repo: string } | null {
    // First try old "github__owner__repo" format
    if (repoId.includes('__')) {
      const parts = repoId.split('__');
      if (parts[0] === 'github' && parts.length === 3) {
        return { owner: parts[1], repo: parts[2] };
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
      const repo = parts.slice(1).join('-'); // In case repo name contains hyphens
      return { owner, repo };
    }
    
    return null;
  }
}