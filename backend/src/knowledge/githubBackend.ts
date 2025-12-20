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
      console.log(`[GITHUB_BACKEND] Retrieving chunks for repoId: ${id}, query: "${query}"`);
      
      // Get all chunks to check if repository exists
      const allRepoChunks = await vectorStore.getChunksByRepoId(id);
      console.log(`[GITHUB_BACKEND] Found ${allRepoChunks.length} total chunks for repo ${id}`);
      
      if (allRepoChunks.length === 0) {
        console.log(`[GITHUB_BACKEND] No chunks found for repo ${id}. Repository may not be ingested.`);
        return [];
      }
      
      // Get relevant chunks from vector store
      const chunks = await vectorStore.search(query, 5);
      
      // Filter by repo ID and convert to RetrievedChunk format
      let relevantChunks = chunks
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

      console.log(`[GITHUB_BACKEND] Found ${relevantChunks.length} relevant chunks after search`);

      // For language-related queries, ensure we include relevant file structure info
      if (this.isLanguageQuery(query) && relevantChunks.length < 3) {
        console.log(`[GITHUB_BACKEND] Language query detected, adding more context...`);
        const languageRelevantChunks = this.getLanguageRelevantChunks(allRepoChunks, query);
        console.log(`[GITHUB_BACKEND] Found ${languageRelevantChunks.length} language-relevant chunks`);
        
        // Add language-relevant chunks if we don't have enough context
        for (const chunk of languageRelevantChunks) {
          if (!relevantChunks.find(rc => rc.metadata.filePath === chunk.metadata.filePath)) {
            relevantChunks.push({
              content: chunk.content,
              metadata: {
                filePath: chunk.metadata.filePath,
                startLine: chunk.metadata.startLine,
                endLine: chunk.metadata.endLine,
                score: 0.5,
              },
            });
          }
        }
        
        // Limit to reasonable number
        relevantChunks = relevantChunks.slice(0, 8);
      }

      console.log(`[GITHUB_BACKEND] Final result: ${relevantChunks.length} chunks`);
      return relevantChunks;
    } catch (error) {
      console.error(`[GITHUB_BACKEND] Error in retrieve:`, error);
      throw new Error(`Failed to retrieve chunks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private isLanguageQuery(query: string): boolean {
    const languageKeywords = [
      'written in', 'language', 'java', 'javascript', 'python', 'typescript', 
      'c++', 'c#', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin'
    ];
    const queryLower = query.toLowerCase();
    return languageKeywords.some(keyword => queryLower.includes(keyword));
  }

  private getLanguageRelevantChunks(chunks: FileChunk[], query: string): FileChunk[] {
    const configFiles = [
      'pom.xml', 'build.gradle', 'package.json', 'tsconfig.json', 
      'requirements.txt', 'cargo.toml', 'go.mod', 'composer.json'
    ];
    
    const readmeFiles = ['readme', 'README'];
    
    return chunks.filter(chunk => {
      const filePath = chunk.metadata.filePath.toLowerCase();
      
      // Include build/config files
      if (configFiles.some(config => filePath.includes(config.toLowerCase()))) {
        return true;
      }
      
      // Include README files
      if (readmeFiles.some(readme => filePath.includes(readme))) {
        return true;
      }
      
      // Include files with relevant extensions
      if (query.toLowerCase().includes('java') && filePath.endsWith('.java')) {
        return true;
      }
      
      return false;
    }).slice(0, 3); // Limit to avoid overwhelming context
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