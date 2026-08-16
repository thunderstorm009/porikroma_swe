import { aiService } from './aiService';
import { MOCK_CHAT_MESSAGES } from '../data/travelData';

export const chatService = {
  getMessages: () => Promise.resolve(MOCK_CHAT_MESSAGES),
  sendMessage: (message, context) => aiService.chat(message, context)
};
