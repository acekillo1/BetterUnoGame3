export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  type: 'text' | 'sticker';
  content: string; // Text content or sticker ID
  timestamp: Date;
  roomId: string;
}

export interface Sticker {
  id: string;
  emoji: string;
  name: string;
  category: 'emotions' | 'reactions' | 'game' | 'fun';
}

export type ChatEvent =
  | { type: 'MESSAGE_SENT'; message: ChatMessage }
  | { type: 'STICKER_SENT'; message: ChatMessage };