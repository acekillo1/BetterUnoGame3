import { useState, useCallback } from 'react';
import { ChatMessage } from '../types/Chat';
import { socketService } from '../services/SocketService';

interface ChatSystemState {
  messages: ChatMessage[];
  isOpen: boolean;
}

export function useChatSystem(roomId: string | null, currentPlayerId: string | null, currentPlayerName: string) {
  const [state, setState] = useState<ChatSystemState>({
    messages: [],
    isOpen: false
  });

  const sendMessage = useCallback((content: string) => {
    if (!roomId || !currentPlayerId) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      playerId: currentPlayerId,
      playerName: currentPlayerName,
      type: 'text',
      content,
      timestamp: new Date(),
      roomId
    };

    // Add to local state immediately for better UX
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }));

    // Send to server
    socketService.sendChatMessage(message);
  }, [roomId, currentPlayerId, currentPlayerName]);

  const sendSticker = useCallback((stickerId: string) => {
    if (!roomId || !currentPlayerId) return;

    const message: ChatMessage = {
      id: `sticker_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      playerId: currentPlayerId,
      playerName: currentPlayerName,
      type: 'sticker',
      content: stickerId,
      timestamp: new Date(),
      roomId
    };

    // Add to local state immediately for better UX
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }));

    // Send to server
    socketService.sendChatMessage(message);
  }, [roomId, currentPlayerId, currentPlayerName]);

  const toggleChat = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: !prev.isOpen
    }));
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setState(prev => {
      // Avoid duplicates (in case we receive our own message back)
      const exists = prev.messages.some(m => m.id === message.id);
      if (exists) return prev;

      return {
        ...prev,
        messages: [...prev.messages, message]
      };
    });
  }, []);

  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: []
    }));
  }, []);

  return {
    ...state,
    sendMessage,
    sendSticker,
    toggleChat,
    addMessage,
    clearMessages
  };
}