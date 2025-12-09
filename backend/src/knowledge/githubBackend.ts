import { KnowledgeBackend, RetrievedChunk } from './types';
import { GitHubLoader, RepositoryInfo } from '../services/githubLoader';
import { IngestionService } from '../services/ingestion';
import { vectorStore } from '../store/vectorStore';
import { FileChunk } from '../types';

export class GithubKnowledgeBackend implements KnowledgeBackend {
  private githubLoader = new GitHubLoader();
  private ingestionService = new IngestionService();

  async ingest(input: unknown): Promise<string> {
    if (typeof input !== 'string') {
      throw new Error('GitHub URL must be a string');
    }

    const githubUrl = input as string;
    const repoId = this.generateRepoId(githubUrl);

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
    return `github-${owner}-${repo}`;
  }

  async getRepositoryInfo(githubUrl: string): Promise<RepositoryInfo> {
    return this.githubLoader.loadRepository(githubUrl);
  }

  async generateSummary(githubUrl: string): Promise<string> {
    const repoInfo = await this.getRepositoryInfo(githubUrl);
    const fileTree = repoInfo.files.map(f => f.path);
    return this.ingestionService.generateRepositorySummary(repoInfo.readme, fileTree);
  }
}