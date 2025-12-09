import { env } from '../config/env';

export interface GitHubFile {
  path: string;
  content: string;
  type: 'file' | 'dir';
}

export interface RepositoryInfo {
  owner: string;
  repo: string;
  files: GitHubFile[];
  readme?: string;
}

export class GitHubLoader {
  private baseUrl = 'https://api.github.com';
  private headers: Record<string, string>;

  constructor() {
    this.headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'RepoChat-Backend',
    };

    if (env.GITHUB_TOKEN) {
      this.headers['Authorization'] = `token ${env.GITHUB_TOKEN}`;
    }
  }

  parseGitHubUrl(url: string): { owner: string; repo: string } {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub URL format');
    }
    
    let [, owner, repo] = match;
    // Remove .git suffix if present
    repo = repo.replace(/\.git$/, '');
    
    return { owner, repo };
  }

  async loadRepository(githubUrl: string): Promise<RepositoryInfo> {
    const { owner, repo } = this.parseGitHubUrl(githubUrl);
    
    try {
      const files = await this.fetchAllFiles(owner, repo);
      const readme = await this.fetchReadme(owner, repo);
      
      return {
        owner,
        repo,
        files,
        readme,
      };
    } catch (error) {
      throw new Error(`Failed to load repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fetchAllFiles(owner: string, repo: string, path: string = ''): Promise<GitHubFile[]> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`;
    
    const response = await fetch(url, { headers: this.headers });
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const items = await response.json();
    const files: GitHubFile[] = [];
    
    for (const item of items) {
      if (this.shouldIgnore(item.path)) {
        continue;
      }
      
      if (item.type === 'file') {
        if (this.isTextFile(item.path)) {
          const content = await this.fetchFileContent(item.download_url);
          files.push({
            path: item.path,
            content,
            type: 'file',
          });
        }
      } else if (item.type === 'dir') {
        // Recursively fetch directory contents
        const subFiles = await this.fetchAllFiles(owner, repo, item.path);
        files.push(...subFiles);
      }
    }
    
    return files;
  }

  private async fetchFileContent(downloadUrl: string): Promise<string> {
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file content: ${response.statusText}`);
    }
    return response.text();
  }

  private async fetchReadme(owner: string, repo: string): Promise<string | undefined> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/readme`, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        return undefined;
      }
      
      const data = await response.json();
      return Buffer.from(data.content, 'base64').toString('utf-8');
    } catch {
      return undefined;
    }
  }

  private shouldIgnore(path: string): boolean {
    const ignoredPatterns = [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /coverage/,
      /\.next/,
      /\.vscode/,
      /\.idea/,
      /target/,
      /bin/,
      /obj/,
      /\.cache/,
    ];

    return ignoredPatterns.some(pattern => pattern.test(path));
  }

  private isTextFile(path: string): boolean {
    const textExtensions = [
      '.ts', '.js', '.tsx', '.jsx',
      '.py', '.go', '.rs', '.java', '.c', '.cpp', '.h',
      '.md', '.txt', '.json', '.yml', '.yaml', '.toml',
      '.html', '.css', '.scss', '.less',
      '.sh', '.bash', '.zsh',
      '.sql', '.graphql',
      '.env', '.gitignore', '.dockerignore',
      '.Dockerfile', 'Dockerfile',
    ];

    const extension = path.substring(path.lastIndexOf('.'));
    const filename = path.substring(path.lastIndexOf('/') + 1);
    
    return textExtensions.includes(extension) || 
           textExtensions.includes(filename) ||
           filename === 'Makefile' ||
           filename === 'Dockerfile';
  }
}