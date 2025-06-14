import React from 'react';
import { Player, Card as CardType } from '../types/Card';
import Card from './Card';

interface PlayerHandProps {
  player: Player;
  isCurrentPlayer: boolean;
  playableCards: CardType[];
  onCardClick?: (card: CardType) => void;
  selectedCard?: CardType;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ 
  player, 
  isCurrentPlayer, 
  playableCards,
  onCardClick,
  selectedCard
}) => {
  if (player.isHuman) {
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
          </h3>
          <span className="text-sm text-white/70">
            {player.cards.length} lá bài
          </span>
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
      </div>
    );
  }

  // AI/Other players - show card backs with proper styling
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
        </h4>
        <span className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded">
          {player.cards.length} lá
        </span>
      </div>
      
      <div className="flex gap-1 flex-wrap">
        {player.cards.slice(0, Math.min(10, player.cards.length)).map((_, index) => (
          <div
            key={index}
            className={`w-8 h-12 bg-gradient-to-br from-blue-900 to-purple-900 rounded border border-white/20 flex items-center justify-center text-white/50 text-xs font-bold shadow-md ${
              isCurrentPlayer ? 'ring-2 ring-green-400 ring-opacity-50' : ''
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
    </div>
  );
};

export default PlayerHand;