import { Conversation, ChatMessage } from '../types';

export class ChatService {
  private conversations: Map<string, Conversation> = new Map();

  createConversation(repoId: string): Conversation {
    const conversation: Conversation = {
      id: this.generateConversationId(),
      repoId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  getConversation(conversationId: string): Conversation | undefined {
    return this.conversations.get(conversationId);
  }

  addMessage(conversationId: string, message: ChatMessage): void {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    conversation.messages.push(message);
    conversation.updatedAt = new Date();
  }

  getRecentMessages(conversationId: string, limit: number = 6): ChatMessage[] {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return [];
    }

    // Return the most recent messages (keep pairs of user/assistant)
    return conversation.messages.slice(-limit);
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}