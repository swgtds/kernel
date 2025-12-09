import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { GithubKnowledgeBackend } from '../knowledge/githubBackend';
import { knowledgeAgent } from '../agents/knowledgeAgent';
import { ChatService } from '../services/chat';
import { RegisterRepoRequest, RegisterRepoResponse, ChatRequest, ChatResponse } from '../types';

const router = Router();
const githubBackend = new GithubKnowledgeBackend();
const chatService = new ChatService();

// Schema validation
const registerRepoSchema = z.object({
  githubUrl: z.string().url().refine((url: string) => url.includes('github.com'), {
    message: 'Must be a valid GitHub URL',
  }),
});

const chatSchema = z.object({
  repoId: z.string().min(1),
  message: z.string().min(1),
  conversationId: z.string().optional(),
});

// Register GitHub Repository
router.post('/register', async (req: Request, res: Response) => {
  try {
    const validatedData = registerRepoSchema.parse(req.body);
    const { githubUrl } = validatedData;

    // Ingest the repository
    const repoId = await githubBackend.ingest(githubUrl);

    // Generate summary
    const summary = await githubBackend.generateSummary(githubUrl);

    const response: RegisterRepoResponse = {
      repoId,
      summary,
      githubUrl,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error registering repository:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    res.status(500).json({
      error: 'Failed to register repository',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Chat with Repository
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const validatedData = chatSchema.parse(req.body);
    const { repoId, message, conversationId } = validatedData;

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = chatService.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({
          error: 'Conversation not found',
        });
      }
    } else {
      conversation = chatService.createConversation(repoId);
    }

    // Add user message to conversation
    chatService.addMessage(conversation.id, {
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Get recent conversation history
    const recentMessages = chatService.getRecentMessages(conversation.id, 6);

    // Process the query with the knowledge agent
    const agentResponse = await knowledgeAgent.processQuery(
      githubBackend,
      repoId,
      message,
      recentMessages.slice(0, -1) // Exclude the current message we just added
    );

    // Add assistant response to conversation
    chatService.addMessage(conversation.id, {
      role: 'assistant',
      content: agentResponse.answer,
      timestamp: new Date(),
    });

    const response: ChatResponse = {
      conversationId: conversation.id,
      answer: agentResponse.answer,
      sources: agentResponse.sources,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in chat:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    res.status(500).json({
      error: 'Failed to process chat',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get Repository Information
router.get('/:repoId', async (req: Request, res: Response) => {
  try {
    const { repoId } = req.params;
    
    const repoInfo = githubBackend.getRepoInfo(repoId);
    if (!repoInfo) {
      return res.status(404).json({
        error: 'Repository not found',
      });
    }

    res.status(200).json({
      repoId,
      githubUrl: repoInfo.url,
      owner: repoInfo.owner,
      repo: repoInfo.repo,
    });
  } catch (error) {
    console.error('Error getting repository info:', error);
    res.status(500).json({
      error: 'Failed to get repository information',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as repoRouter };