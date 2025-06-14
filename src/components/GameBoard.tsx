import React from 'react';
import { GameState, CardColor } from '../types/Card';
import Card from './Card';
import { ArrowRight, RotateCcw, Zap } from 'lucide-react';

interface GameBoardProps {
  gameState: GameState;
  onDrawCard: () => void;
  onColorChoice?: (color: CardColor) => void;
  showColorPicker?: boolean;
  onHandleStackedDraw?: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  gameState, 
  onDrawCard, 
  onColorChoice,
  showColorPicker = false,
  onHandleStackedDraw
}) => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] relative">
      {/* Direction indicator */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-white/70">
        {gameState.direction === 'clockwise' ? (
          <ArrowRight className="w-5 h-5" />
        ) : (
          <RotateCcw className="w-5 h-5" />
        )}
        <span className="text-sm capitalize">{gameState.direction}</span>
      </div>

      {/* Stacking indicator */}
      {gameState.stackingType !== 'none' && gameState.stackedDrawCount > 0 && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2 text-red-200">
            <Zap className="w-5 h-5" />
            <span className="font-bold">
              Stacked: {gameState.stackedDrawCount} cards
            </span>
          </div>
          <div className="text-red-300 text-sm text-center">
            {gameState.stackingType === 'draw-two' ? 'Stack +2 or +4, or draw all' : 'Stack +4 only, or draw all'}
          </div>
        </div>
      )}

      {/* Center play area */}
      <div className="flex items-center gap-8">
        {/* Draw pile */}
        <div className="relative group">
          <div 
            className="w-20 h-28 bg-gradient-to-br from-blue-900 to-purple-900 rounded-xl border-2 border-white/20 shadow-lg cursor-pointer hover:scale-105 transition-transform duration-200 flex items-center justify-center text-white font-bold"
            onClick={gameState.stackingType !== 'none' && onHandleStackedDraw ? onHandleStackedDraw : onDrawCard}
          >
            <div className="text-center">
              <div className="text-lg">
                {gameState.stackingType !== 'none' ? '💥' : 'UNO'}
              </div>
              <div className="text-xs text-white/70">
                {gameState.stackingType !== 'none' 
                  ? `Draw ${gameState.stackedDrawCount}` 
                  : gameState.drawPile.length
                }
              </div>
            </div>
          </div>
          <div className="absolute -top-1 -left-1 w-20 h-28 bg-gradient-to-br from-blue-800 to-purple-800 rounded-xl border-2 border-white/10 -z-10" />
          <div className="absolute -top-2 -left-2 w-20 h-28 bg-gradient-to-br from-blue-700 to-purple-700 rounded-xl border-2 border-white/5 -z-20" />
          
          {/* Tooltip */}
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {gameState.stackingType !== 'none' 
              ? `Click to draw ${gameState.stackedDrawCount} stacked cards`
              : 'Click to draw a card'
            }
          </div>
        </div>

        {/* Current top card */}
        <div className="relative">
          <Card 
            card={gameState.topCard} 
            size="large"
            className="shadow-2xl"
          />
          {gameState.wildColor && gameState.wildColor !== 'wild' && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                gameState.wildColor === 'red' ? 'bg-red-500' :
                gameState.wildColor === 'blue' ? 'bg-blue-500' :
                gameState.wildColor === 'green' ? 'bg-green-500' :
                'bg-yellow-500'
              }`} />
            </div>
          )}
        </div>
      </div>

      {/* Current player indicator */}
      <div className="mt-6 text-center">
        <div className="text-white/90 text-lg font-semibold">
          {currentPlayer.name}'s Turn
        </div>
        {gameState.isBlockAllActive && (
          <div className="mt-2 bg-orange-500/20 border border-orange-500/50 rounded-lg px-3 py-1">
            <span className="text-orange-200 text-sm font-medium">
              🛡️ BlockAll Active - Number cards only
            </span>
          </div>
        )}
        {gameState.stackingType !== 'none' && (
          <div className="mt-2 bg-red-500/20 border border-red-500/50 rounded-lg px-3 py-1">
            <span className="text-red-200 text-sm font-medium">
              🔥 {gameState.stackingType === 'draw-two' ? 'Stack +2/+4 or draw' : 'Stack +4 or draw'} {gameState.stackedDrawCount} cards
            </span>
          </div>
        )}
      </div>

      {/* Color picker modal */}
      {showColorPicker && onColorChoice && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Choose a Color
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {(['red', 'blue', 'green', 'yellow'] as CardColor[]).map(color => (
                <button
                  key={color}
                  onClick={() => onColorChoice(color)}
                  className={`w-16 h-16 rounded-xl border-4 border-white shadow-lg hover:scale-110 transition-transform duration-200 ${
                    color === 'red' ? 'bg-red-500' :
                    color === 'blue' ? 'bg-blue-500' :
                    color === 'green' ? 'bg-green-500' :
                    'bg-yellow-500'
                  }`}
                >
                  <span className="text-white font-bold capitalize text-sm">
                    {color}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;