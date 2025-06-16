import React from 'react';
import { ChatMessage } from '../../types/Chat';
import { STICKERS } from '../../data/stickers';

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  isOwnMessage
}) => {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSticker = (stickerId: string) => {
    return STICKERS.find(s => s.id === stickerId);
  };

  if (message.type === 'sticker') {
    const sticker = getSticker(message.content);
    
    return (
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-xs ${isOwnMessage ? 'order-2' : 'order-1'}`}>
          {!isOwnMessage && (
            <div className="text-xs text-gray-500 mb-1 px-2">
              {message.playerName}
            </div>
          )}
          <div
            className={`inline-block px-3 py-2 rounded-2xl ${
              isOwnMessage
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            <div className="text-3xl text-center">
              {sticker?.emoji || '❓'}
            </div>
            {sticker && (
              <div className="text-xs text-center mt-1 opacity-75">
                {sticker.name}
              </div>
            )}
          </div>
          <div className={`text-xs text-gray-400 mt-1 px-2 ${
            isOwnMessage ? 'text-right' : 'text-left'
          }`}>
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {!isOwnMessage && (
          <div className="text-xs text-gray-500 mb-1 px-2">
            {message.playerName}
          </div>
        )}
        <div
          className={`inline-block px-3 py-2 rounded-2xl break-words ${
            isOwnMessage
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          <div className="text-sm whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
        <div className={`text-xs text-gray-400 mt-1 px-2 ${
          isOwnMessage ? 'text-right' : 'text-left'
        }`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default ChatMessageItem;