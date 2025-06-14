import React from 'react';
import { Player, Card as CardType } from '../types/Card';
import Card from './Card';
import { AlertTriangle } from 'lucide-react';

interface PlayerHandProps {
  player: Player;
  isCurrentPlayer: boolean;
  playableCards: CardType[];
  onCardClick?: (card: CardType) => void;
  selectedCard?: CardType;
  isOwnPlayer?: boolean; // New prop to determine if this is the current user's hand
}

const PlayerHand: React.FC<PlayerHandProps> = ({ 
  player, 
  isCurrentPlayer, 
  playableCards,
  onCardClick,
  selectedCard,
  isOwnPlayer = false
}) => {
  // Only show actual cards if this is the current user's own hand
  if (isOwnPlayer) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            {player.name}
            {player.hasCalledUno && player.cards.length === 1 && (
              <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                UNO!
              </span>
            )}
            {isCurrentPlayer && (
              <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                Lượt của bạn
              </span>
            )}
            {player.cards.length >= 30 && (
              <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Nguy hiểm!
              </span>
            )}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/70">
              {player.cards.length} lá bài
            </span>
            {player.cards.length >= 35 && (
              <span className="text-red-400 text-xs font-bold">
                BỊ LOẠI!
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap justify-center">
          {player.cards.map((card, index) => (
            <Card
              key={card.id}
              card={card}
              isPlayable={isCurrentPlayer && playableCards.some(c => c.id === card.id)}
              isSelected={selectedCard?.id === card.id}
              onClick={onCardClick ? () => onCardClick(card) : undefined}
              className={`transform transition-all duration-200 hover:-translate-y-2 ${
                index > 0 ? '-ml-8' : ''
              }`}
              size="medium"
            />
          ))}
        </div>
        
        {/* Warning for high card count */}
        {player.cards.length >= 30 && player.cards.length < 35 && (
          <div className="mt-3 bg-red-500/20 border border-red-500/50 rounded-lg p-2 text-center">
            <span className="text-red-200 text-sm font-medium">
              ⚠️ Cảnh báo: {35 - player.cards.length} lá nữa sẽ bị loại!
            </span>
          </div>
        )}
      </div>
    );
  }

  // For other players - always show card backs (hidden cards)
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-white flex items-center gap-2">
          {player.name}
          {player.hasCalledUno && player.cards.length === 1 && (
            <span className="bg-yellow-500 text-black px-1.5 py-0.5 rounded-full text-xs font-bold animate-pulse">
              UNO!
            </span>
          )}
          {isCurrentPlayer && (
            <span className="bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold">
              Đang chơi
            </span>
          )}
          {player.cards.length >= 30 && (
            <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
              <AlertTriangle className="w-2 h-2" />
              !
            </span>
          )}
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded">
            {player.cards.length} lá
          </span>
          {player.cards.length >= 35 && (
            <span className="text-red-400 text-xs font-bold">
              LOẠI
            </span>
          )}
        </div>
      </div>
      
      <div className="flex gap-1 flex-wrap">
        {player.cards.slice(0, Math.min(10, player.cards.length)).map((_, index) => (
          <div
            key={index}
            className={`w-8 h-12 bg-gradient-to-br from-blue-900 to-purple-900 rounded border border-white/20 flex items-center justify-center text-white/50 text-xs font-bold shadow-md ${
              isCurrentPlayer ? 'ring-2 ring-green-400 ring-opacity-50' : ''
            } ${
              player.cards.length >= 30 ? 'ring-2 ring-red-400 ring-opacity-50' : ''
            }`}
          >
            UNO
          </div>
        ))}
        {player.cards.length > 10 && (
          <div className="w-8 h-12 bg-white/20 rounded border border-white/20 flex items-center justify-center text-white text-xs font-bold">
            +{player.cards.length - 10}
          </div>
        )}
      </div>
      
      {/* Warning for high card count */}
      {player.cards.length >= 30 && player.cards.length < 35 && (
        <div className="mt-2 bg-red-500/20 border border-red-500/50 rounded p-1 text-center">
          <span className="text-red-200 text-xs">
            ⚠️ {35 - player.cards.length} lá nữa bị loại
          </span>
        </div>
      )}
    </div>
  );
};

export default PlayerHand;