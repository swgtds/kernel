import type { RepoSummary, ChatResponse, RepoInfo } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

async function fetcher(url: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: 'An unknown error occurred.' }));
    throw new Error(errorBody.message || `Request failed with status ${res.status}`);
  }

  return res.json();
}


export async function registerRepo(githubUrl: string): Promise<RepoSummary> {
  try {
    const result = await fetcher('/api/repo/register', {
      method: 'POST',
      body: JSON.stringify({ githubUrl }),
    });
    return result;
  } catch (error) {
    console.error('Error registering repo:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to index repository: ${error.message}`);
    }
    throw new Error('Failed to index repository. The URL might be invalid or the repository inaccessible.');
  }
}

export async function getRepoInfo(repoId: string): Promise<RepoInfo> {
  try {
    const result = await fetcher(`/api/repo/${repoId}`, {
      method: 'GET',
    });
    return result;
  } catch (error) {
    console.error('Error getting repo info:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to get repository info: ${error.message}`);
    }
    throw new Error('Failed to get repository information.');
  }
}

export async function chatWithRepo(params: {
  repoId: string;
  message: string;
  conversationId?: string;
}): Promise<ChatResponse> {
  try {
    const result = await fetcher('/api/repo/chat', {
        method: 'POST',
        body: JSON.stringify({
            repoId: params.repoId,
            message: params.message,
            conversationId: params.conversationId,
        }),
    });
    return result;
  } catch (error) {
    console.error('Error chatting with repo:', error);
    if (error instanceof Error) {
        throw new Error(`Failed to get response: ${error.message}`);
    }
    throw new Error('Failed to get a response from the assistant. Please try again.');
  }
}
