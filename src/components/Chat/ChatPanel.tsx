import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, X, MessageCircle } from 'lucide-react';
import { ChatMessage } from '../../types/Chat';
import ChatMessageItem from './ChatMessageItem';
import StickerPicker from './StickerPicker';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentPlayerId: string;
  currentPlayerName: string;
  onSendMessage: (content: string) => void;
  onSendSticker: (stickerId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  currentPlayerId,
  currentPlayerName,
  onSendMessage,
  onSendSticker,
  isOpen,
  onToggle
}) => {
  const [messageText, setMessageText] = useState('');
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    const trimmedMessage = messageText.trim();
    if (trimmedMessage) {
      onSendMessage(trimmedMessage);
      setMessageText('');
      setShowStickerPicker(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStickerSelect = (stickerId: string) => {
    onSendSticker(stickerId);
    setShowStickerPicker(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center z-40"
      >
        <MessageCircle className="w-6 h-6" />
        {messages.length > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {messages.length > 99 ? '99+' : messages.length}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 h-96 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 flex flex-col z-40">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200/50">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-800">Chat</h3>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {messages.length}
          </span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>Chưa có tin nhắn nào</p>
            <p className="text-xs">Hãy bắt đầu trò chuyện!</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessageItem
              key={message.id}
              message={message}
              isOwnMessage={message.playerId === currentPlayerId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sticker Picker */}
      {showStickerPicker && (
        <div className="border-t border-gray-200/50">
          <StickerPicker
            onSelectSticker={handleStickerSelect}
            onClose={() => setShowStickerPicker(false)}
          />
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-200/50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStickerPicker(!showStickerPicker)}
            className={`p-2 rounded-lg transition-colors ${
              showStickerPicker
                ? 'bg-blue-100 text-blue-600'
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <Smile className="w-4 h-4" />
          </button>
          
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              maxLength={200}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {messageText.length > 150 && (
          <div className="text-xs text-gray-500 mt-1 text-right">
            {messageText.length}/200
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;