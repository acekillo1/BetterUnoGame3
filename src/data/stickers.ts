import { Sticker } from '../types/Chat';

export const STICKERS: Sticker[] = [
  // Emotions
  { id: 'happy', emoji: '😊', name: 'Happy', category: 'emotions' },
  { id: 'laugh', emoji: '😂', name: 'Laugh', category: 'emotions' },
  { id: 'love', emoji: '😍', name: 'Love', category: 'emotions' },
  { id: 'cool', emoji: '😎', name: 'Cool', category: 'emotions' },
  { id: 'wink', emoji: '😉', name: 'Wink', category: 'emotions' },
  { id: 'sad', emoji: '😢', name: 'Sad', category: 'emotions' },
  { id: 'angry', emoji: '😠', name: 'Angry', category: 'emotions' },
  { id: 'surprised', emoji: '😲', name: 'Surprised', category: 'emotions' },

  // Reactions
  { id: 'thumbs-up', emoji: '👍', name: 'Thumbs Up', category: 'reactions' },
  { id: 'thumbs-down', emoji: '👎', name: 'Thumbs Down', category: 'reactions' },
  { id: 'clap', emoji: '👏', name: 'Clap', category: 'reactions' },
  { id: 'fire', emoji: '🔥', name: 'Fire', category: 'reactions' },
  { id: 'heart', emoji: '❤️', name: 'Heart', category: 'reactions' },
  { id: 'star', emoji: '⭐', name: 'Star', category: 'reactions' },
  { id: 'thinking', emoji: '🤔', name: 'Thinking', category: 'reactions' },
  { id: 'facepalm', emoji: '🤦', name: 'Facepalm', category: 'reactions' },

  // Game specific
  { id: 'uno', emoji: '🎯', name: 'UNO!', category: 'game' },
  { id: 'cards', emoji: '🃏', name: 'Cards', category: 'game' },
  { id: 'winner', emoji: '🏆', name: 'Winner', category: 'game' },
  { id: 'lightning', emoji: '⚡', name: 'Lightning', category: 'game' },
  { id: 'bomb', emoji: '💣', name: 'Bomb', category: 'game' },
  { id: 'target', emoji: '🎯', name: 'Target', category: 'game' },
  { id: 'dice', emoji: '🎲', name: 'Dice', category: 'game' },
  { id: 'magic', emoji: '✨', name: 'Magic', category: 'game' },

  // Fun
  { id: 'party', emoji: '🎉', name: 'Party', category: 'fun' },
  { id: 'rocket', emoji: '🚀', name: 'Rocket', category: 'fun' },
  { id: 'rainbow', emoji: '🌈', name: 'Rainbow', category: 'fun' },
  { id: 'unicorn', emoji: '🦄', name: 'Unicorn', category: 'fun' },
  { id: 'ghost', emoji: '👻', name: 'Ghost', category: 'fun' },
  { id: 'alien', emoji: '👽', name: 'Alien', category: 'fun' },
  { id: 'robot', emoji: '🤖', name: 'Robot', category: 'fun' },
  { id: 'pizza', emoji: '🍕', name: 'Pizza', category: 'fun' }
];

export const STICKER_CATEGORIES = [
  { id: 'emotions', name: 'Emotions', icon: '😊' },
  { id: 'reactions', name: 'Reactions', icon: '👍' },
  { id: 'game', name: 'Game', icon: '🎯' },
  { id: 'fun', name: 'Fun', icon: '🎉' }
] as const;