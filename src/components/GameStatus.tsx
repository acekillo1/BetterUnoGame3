import React from 'react';
import { GameState } from '../types/Card';
import { Trophy, Users, Zap, RotateCcw, AlertTriangle } from 'lucide-react';

interface GameStatusProps {
  gameState: GameState;
  onUnoCall: () => void;
  onRestart: () => void;
  isMultiplayer?: boolean;
  isHost?: boolean;
}

const GameStatus: React.FC<GameStatusProps> = ({ 
  gameState, 
  onUnoCall, 
  onRestart, 
  isMultiplayer = false,
  isHost = false 
}) => {
  const humanPlayer = gameState.players.find(p => p.isHuman);
  const canCallUno = humanPlayer && humanPlayer.cards.length === 1 && !humanPlayer.hasCalledUno;

  if (gameState.gamePhase === 'finished') {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Trophy className="w-8 h-8 text-yellow-400" />
          <h2 className="text-2xl font-bold text-white">Trận đấu kết thúc!</h2>
        </div>
        
        <div className="mb-6">
          <p className="text-lg text-white/90 mb-2">
            🎉 <strong>{gameState.winner?.name}</strong> đã thắng!
          </p>
          
          {/* Show eliminated players */}
          {gameState.eliminatedPlayers.length > 0 && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-center gap-2 text-red-200 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Người chơi bị loại (35+ bài)</span>
              </div>
              <div className="text-red-300 text-sm">
                {gameState.eliminatedPlayers.length} người chơi đã bị loại
              </div>
            </div>
          )}
          
          {/* Show final scores */}
          <div className="bg-white/5 rounded-lg p-4 mb-4">
            <h3 className="text-white font-medium mb-3">Kết quả cuối cùng:</h3>
            <div className="space-y-2">
              {gameState.players
                .sort((a, b) => a.cards.length - b.cards.length)
                .map((player, index) => (
                <div key={player.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-amber-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-white">{player.name}</span>
                    {player.id === gameState.winner?.id && (
                      <span className="text-yellow-400">👑</span>
                    )}
                  </div>
                  <span className="text-white/70">{player.cards.length} lá bài</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 justify-center">
          {isMultiplayer ? (
            <>
              {isHost ? (
                <button
                  onClick={onRestart}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  <RotateCcw className="w-5 h-5" />
                  Chơi Trận Mới
                </button>
              ) : (
                <div className="text-white/70 text-sm">
                  Chờ Host bắt đầu trận mới...
                </div>
              )}
            </>
          ) : (
            <button
              onClick={onRestart}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <RotateCcw className="w-5 h-5" />
              Chơi Lại
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
      <div className="flex items-center justify-between">
        {/* Game info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white/70">
            <Users className="w-4 h-4" />
            <span className="text-sm">{gameState.players.length} người chơi</span>
          </div>
          
          <div className="flex items-center gap-2 text-white/70">
            <Zap className="w-4 h-4" />
            <span className="text-sm">Còn lại: {gameState.drawPile.length} lá</span>
          </div>

          {/* Current player indicator */}
          <div className="text-white/70 text-sm">
            Lượt: <span className="text-white font-medium">
              {gameState.players[gameState.currentPlayerIndex]?.name}
            </span>
          </div>

          {/* Stacking indicator */}
          {gameState.stackingType !== 'none' && gameState.stackedDrawCount > 0 && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded-lg px-3 py-1">
              <Zap className="w-4 h-4 text-red-300" />
              <span className="text-red-200 text-sm font-medium">
                Stack: {gameState.stackedDrawCount}
              </span>
            </div>
          )}

          {/* Eliminated players count */}
          {gameState.eliminatedPlayers.length > 0 && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded-lg px-3 py-1">
              <AlertTriangle className="w-4 h-4 text-red-300" />
              <span className="text-red-200 text-sm">
                {gameState.eliminatedPlayers.length} loại
              </span>
            </div>
          )}
        </div>

        {/* UNO button */}
        {canCallUno && (
          <button
            onClick={onUnoCall}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg animate-pulse"
          >
            Gọi UNO!
          </button>
        )}
        
        {humanPlayer?.hasCalledUno && humanPlayer.cards.length === 1 && (
          <div className="bg-yellow-500 text-black px-3 py-2 rounded-xl font-bold">
            Đã gọi UNO! ✨
          </div>
        )}
      </div>
    </div>
  );
};

export default GameStatus;