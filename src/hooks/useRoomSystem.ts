import { useState, useEffect, useCallback } from 'react';
import { Room, RoomPlayer, CreateRoomData, JoinRoomData, RoomEvent, CreateJoinRoomResult } from '../types/Room';
import { GameState, Player, Card, CardColor } from '../types/Card';
import { socketService } from '../services/SocketService';
import { createDeck, shuffleDeck, canPlayCard } from '../utils/cardUtils';

interface RoomSystemState {
  currentRoom: Room | null;
  currentPlayerId: string | null;
  isHost: boolean;
  activeRooms: Omit<Room, 'password'>[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  gameState: GameState | null;
}

export function useRoomSystem() {
  const [state, setState] = useState<RoomSystemState>({
    currentRoom: null,
    currentPlayerId: null,
    isHost: false,
    activeRooms: [],
    loading: false,
    error: null,
    isConnected: false,
    gameState: null
  });

  const transformRoomPlayer = useCallback((playerData: any): RoomPlayer => {
    return {
      ...playerData,
      joinedAt: new Date(playerData.joinedAt)
    };
  }, []);

  const transformRoomData = useCallback((roomData: any): Room => {
    return {
      ...roomData,
      createdAt: new Date(roomData.createdAt),
      players: roomData.players.map(transformRoomPlayer)
    };
  }, [transformRoomPlayer]);

  // Track connection status
  useEffect(() => {
    const checkConnection = () => {
      setState(prev => ({ 
        ...prev, 
        isConnected: socketService.isSocketConnected() 
      }));
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize game state (HOST ONLY)
  const initializeGameState = useCallback((room: Room) => {
    const deck = shuffleDeck(createDeck());
    
    const players: Player[] = room.players.map(roomPlayer => ({
      id: roomPlayer.id,
      name: roomPlayer.name,
      cards: [],
      isHuman: true,
      hasCalledUno: false
    }));

    // Deal 7 cards to each player
    let cardIndex = 0;
    for (let i = 0; i < 7; i++) {
      players.forEach(player => {
        if (cardIndex < deck.length) {
          player.cards.push(deck[cardIndex++]);
        }
      });
    }

    // Find first number card for top card
    let topCardIndex = cardIndex;
    while (topCardIndex < deck.length && deck[topCardIndex].type !== 'number') {
      topCardIndex++;
    }

    const topCard = deck[topCardIndex] || deck[cardIndex];
    const remainingDeck = deck.filter((_, index) => index !== topCardIndex && index >= cardIndex);

    const gameState: GameState = {
      players,
      currentPlayerIndex: 0,
      direction: 'clockwise',
      topCard,
      drawPile: remainingDeck,
      discardPile: [topCard],
      gamePhase: 'playing',
      isBlockAllActive: false,
      wildColor: undefined,
      winner: undefined,
      lastPlayedCard: undefined,
    };

    setState(prev => ({ ...prev, gameState }));
    
    // Broadcast initial game state to all players
    socketService.broadcastGameState(gameState);
  }, []);

  // Apply game action (HOST ONLY)
  const applyGameAction = useCallback((action: any) => {
    if (!state.isHost || !state.gameState) return;

    setState(prev => {
      if (!prev.gameState) return prev;

      let newGameState = { ...prev.gameState };

      switch (action.type) {
        case 'PLAY_CARD':
          newGameState = applyPlayCard(newGameState, action.playerId, action.card, action.chosenColor);
          break;
        case 'DRAW_CARD':
          newGameState = applyDrawCard(newGameState, action.playerId, action.count);
          break;
        case 'CALL_UNO':
          newGameState = applyCallUno(newGameState, action.playerId);
          break;
      }

      // Broadcast updated game state
      socketService.broadcastGameState(newGameState);
      
      return { ...prev, gameState: newGameState };
    });
  }, [state.isHost, state.gameState]);

  // Game action functions
  const applyPlayCard = (gameState: GameState, playerId: string, card: Card, chosenColor?: CardColor): GameState => {
    const newState = { ...gameState };
    const player = newState.players.find(p => p.id === playerId);
    const currentPlayer = newState.players[newState.currentPlayerIndex];
    
    if (!player || player.id !== currentPlayer.id) return gameState;
    
    if (!canPlayCard(card, newState.topCard, newState.wildColor)) return gameState;
    
    if (newState.isBlockAllActive && card.type !== 'number') return gameState;

    // Remove card from player's hand
    player.cards = player.cards.filter(c => c.id !== card.id);
    
    // Add to discard pile
    newState.discardPile.push(card);
    newState.topCard = card;
    newState.lastPlayedCard = card;
    
    // Handle wild color
    if (card.type === 'wild' || card.type === 'wild-draw-four') {
      newState.wildColor = chosenColor || 'red';
    } else {
      newState.wildColor = undefined;
    }

    // Reset BlockAll effect
    newState.isBlockAllActive = false;
    
    // Check for UNO
    if (player.cards.length === 1 && !player.hasCalledUno) {
      player.hasCalledUno = true;
    }

    // Check win condition
    if (player.cards.length === 0) {
      newState.gamePhase = 'finished';
      newState.winner = player;
      return newState;
    }

    // Apply card effects and determine next player
    let nextPlayerIndex = getNextPlayerIndex(newState.currentPlayerIndex, newState.players.length, newState.direction);
    
    switch (card.type) {
      case 'skip':
        nextPlayerIndex = getNextPlayerIndex(nextPlayerIndex, newState.players.length, newState.direction);
        break;
        
      case 'reverse':
        newState.direction = newState.direction === 'clockwise' ? 'counterclockwise' : 'clockwise';
        if (newState.players.length === 2) {
          nextPlayerIndex = getNextPlayerIndex(nextPlayerIndex, newState.players.length, newState.direction);
        }
        break;
        
      case 'draw-two':
        drawCardsForPlayer(newState, nextPlayerIndex, 2);
        nextPlayerIndex = getNextPlayerIndex(nextPlayerIndex, newState.players.length, newState.direction);
        break;
        
      case 'wild-draw-four':
        drawCardsForPlayer(newState, nextPlayerIndex, 4);
        nextPlayerIndex = getNextPlayerIndex(nextPlayerIndex, newState.players.length, newState.direction);
        break;
        
      case 'swap-hands':
        const otherPlayers = newState.players.filter(p => p.id !== player.id);
        if (otherPlayers.length > 0) {
          const targetPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
          const tempCards = player.cards;
          player.cards = targetPlayer.cards;
          targetPlayer.cards = tempCards;
        }
        break;
        
      case 'draw-minus-two':
        const nextPlayer = newState.players[nextPlayerIndex];
        if (nextPlayer.cards.length >= 2) {
          for (let i = 0; i < 2; i++) {
            const randomIndex = Math.floor(Math.random() * nextPlayer.cards.length);
            const discardedCard = nextPlayer.cards.splice(randomIndex, 1)[0];
            newState.discardPile.push(discardedCard);
          }
        } else {
          drawCardsForPlayer(newState, nextPlayerIndex, 2);
        }
        break;
        
      case 'shuffle-my-hand':
        const cardCount = player.cards.length;
        newState.discardPile.push(...player.cards);
        player.cards = [];
        drawCardsForPlayer(newState, newState.currentPlayerIndex, cardCount);
        break;
        
      case 'block-all':
        newState.isBlockAllActive = true;
        break;
    }

    newState.currentPlayerIndex = nextPlayerIndex;
    return newState;
  };

  const applyDrawCard = (gameState: GameState, playerId: string, count: number): GameState => {
    const newState = { ...gameState };
    const player = newState.players.find(p => p.id === playerId);
    
    if (!player) return gameState;

    drawCardsForPlayer(newState, newState.players.findIndex(p => p.id === playerId), count);
    return newState;
  };

  const applyCallUno = (gameState: GameState, playerId: string): GameState => {
    const newState = { ...gameState };
    const player = newState.players.find(p => p.id === playerId);
    
    if (player && player.cards.length === 1) {
      player.hasCalledUno = true;
    }
    
    return newState;
  };

  const loadActiveRooms = useCallback(async () => {
    if (!socketService.isSocketConnected()) {
      setState(prev => ({ ...prev, activeRooms: [] }));
      return;
    }

    try {
      const rooms = await socketService.getActiveRooms();
      setState(prev => ({ 
        ...prev, 
        activeRooms: rooms.map(transformRoomData)
      }));
    } catch (error) {
      console.error('Failed to load rooms:', error);
      setState(prev => ({ ...prev, error: 'Không thể tải danh sách phòng' }));
    }
  }, [transformRoomData]);

  const createRoom = useCallback(async (data: CreateRoomData): Promise<CreateJoinRoomResult> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await socketService.createRoom(data); 
      
      if (result.success && result.room && result.playerId) {
        const transformedRoom = transformRoomData(result.room);
        setState(prev => ({
          ...prev,
          currentRoom: transformedRoom,
          currentPlayerId: result.playerId!,
          isHost: true,
          loading: false,
          gameState: null
        }));
        return { success: true, room: transformedRoom, playerId: result.playerId };
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Không thể tạo phòng'
        }));
        return { success: false, error: result.error || 'Không thể tạo phòng' };
      }
    } catch (error: any) {
      console.error('Lỗi khi tạo phòng:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Lỗi kết nối đến server: ' + (error.message || String(error))
      }));
      return { success: false, error: 'Lỗi kết nối đến server' };
    }
  }, [transformRoomData]);

  const joinRoom = useCallback(async (data: JoinRoomData): Promise<CreateJoinRoomResult> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await socketService.joinRoom(data); 
      
      if (result.success && result.room && result.playerId) {
        const transformedRoom = transformRoomData(result.room);
        setState(prev => ({
          ...prev,
          currentRoom: transformedRoom,
          currentPlayerId: result.playerId!,
          isHost: false,
          loading: false,
          gameState: null
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Không thể tham gia phòng'
        }));
      }
      
      return result;
    } catch (error: any) {
      console.error('Lỗi khi tham gia phòng:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Lỗi kết nối đến server: ' + (error.message || String(error))
      }));
      return { success: false, error: 'Lỗi kết nối đến server' };
    }
  }, [transformRoomData]);

  const leaveRoom = useCallback(() => {
    socketService.leaveRoom();
    setState(prev => ({
      ...prev,
      currentRoom: null,
      currentPlayerId: null,
      isHost: false,
      gameState: null
    }));
  }, []);

  const kickPlayer = useCallback(async (targetPlayerId: string) => {
    if (state.isHost) {
      const result = await socketService.kickPlayer(targetPlayerId);
      return result.success;
    }
    return false;
  }, [state.isHost]);

  const startGame = useCallback(async () => {
    if (state.isHost && state.currentRoom) {
      const result = await socketService.startGame();
      if (result.success) {
        initializeGameState(state.currentRoom);
        return true;
      } else if (result.error) {
        setState(prev => ({ ...prev, error: result.error! }));
      }
      return false;
    }
    return false;
  }, [state.isHost, state.currentRoom, initializeGameState]);

  const toggleReady = useCallback(async () => {
    if (!state.isHost) {
      const result = await socketService.toggleReady();
      return result.success;
    }
    return false;
  }, [state.isHost]);

  // Game actions - only send to host for processing
  const playCard = useCallback((playerId: string, card: Card, chosenColor?: CardColor) => {
    if (!state.gameState || !state.currentPlayerId) return;
    
    if (state.isHost) {
      // Host processes the action immediately
      applyGameAction({ type: 'PLAY_CARD', playerId, card, chosenColor });
    } else {
      // Non-host sends action to server for host to process
      socketService.broadcastCardPlay(playerId, card, chosenColor);
    }
  }, [state.gameState, state.currentPlayerId, state.isHost, applyGameAction]);

  const drawCard = useCallback((playerId: string, count: number = 1) => {
    if (!state.gameState || !state.currentPlayerId) return [];
    
    if (state.isHost) {
      // Host processes the action immediately
      applyGameAction({ type: 'DRAW_CARD', playerId, count });
    } else {
      // Non-host sends action to server for host to process
      socketService.broadcastDrawCard(playerId, count);
    }
    
    return [];
  }, [state.gameState, state.currentPlayerId, state.isHost, applyGameAction]);

  const callUno = useCallback((playerId: string) => {
    if (!state.gameState) return;
    
    if (state.isHost) {
      // Host processes the action immediately
      applyGameAction({ type: 'CALL_UNO', playerId });
    } else {
      // Non-host sends action to server for host to process
      socketService.broadcastUnoCall(playerId);
    }
  }, [state.gameState, state.isHost, applyGameAction]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Setup event listeners
  useEffect(() => {
    const unsubscribeGlobal = socketService.addGlobalEventListener((event: any) => {
      switch (event.type) {
        case 'ROOMS_UPDATED':
          setState(prev => ({ 
            ...prev, 
            activeRooms: event.rooms.map(transformRoomData)
          }));
          break;
        case 'CONNECTION_FAILED':
          setState(prev => ({ 
            ...prev, 
            error: 'Mất kết nối đến server. Vui lòng thử lại.',
            isConnected: false,
            currentRoom: null, 
            currentPlayerId: null,
            isHost: false,
            gameState: null,
            activeRooms: []
          }));
          break;
      }
    });

    const unsubscribeRoom = socketService.addEventListener('current-room', (event: RoomEvent) => {
      setState(prev => {
        switch (event.type) {
          case 'PLAYER_JOINED':
            if (prev.currentRoom) {
              const updatedRoom = { ...prev.currentRoom };
              updatedRoom.players.push(transformRoomPlayer(event.player));
              updatedRoom.currentPlayers++;
              return { ...prev, currentRoom: updatedRoom };
            }
            return prev;

          case 'PLAYER_LEFT':
            if (prev.currentRoom) {
              const updatedRoom = { ...prev.currentRoom };
              updatedRoom.players = updatedRoom.players.filter(p => p.id !== event.playerId);
              updatedRoom.currentPlayers--;
              if (event.newHost) {
                updatedRoom.hostId = event.newHost.id;
                updatedRoom.hostName = event.newHost.name;
                updatedRoom.players.forEach(p => p.isHost = (p.id === event.newHost!.id));
              }
              return { ...prev, currentRoom: updatedRoom, isHost: prev.currentPlayerId === updatedRoom.hostId };
            }
            if (event.playerId === prev.currentPlayerId) {
                return { 
                    ...prev, 
                    currentRoom: null, 
                    currentPlayerId: null, 
                    isHost: false, 
                    gameState: null,
                    error: 'Bạn đã rời phòng'
                };
            }
            return prev;

          case 'HOST_CHANGED':
            const newIsHost = prev.currentPlayerId === event.newHostId;
            if (prev.currentRoom) {
              const updatedRoom = { ...prev.currentRoom };
              updatedRoom.hostId = event.newHostId;
              updatedRoom.players.forEach(p => {
                p.isHost = p.id === event.newHostId;
              });
              return { ...prev, currentRoom: updatedRoom, isHost: newIsHost };
            }
            return { ...prev, isHost: newIsHost };

          case 'GAME_STARTED':
            if (prev.currentRoom) {
              const updatedRoom = { ...prev.currentRoom };
              updatedRoom.status = 'playing';
              updatedRoom.gameInProgress = true;
              return { ...prev, currentRoom: updatedRoom };
            }
            return prev;

          case 'ROOM_UPDATED':
            return { ...prev, currentRoom: transformRoomData(event.room) };

          case 'KICKED_FROM_ROOM':
            return {
              ...prev,
              currentRoom: null,
              currentPlayerId: null,
              isHost: false,
              gameState: null,
              error: 'Bạn đã bị kick khỏi phòng'
            };

          default:
            return prev;
        }
      });
    });

    // Game events - only non-hosts listen for game state updates
    const unsubscribeGame = socketService.addGameEventListener((event: any) => {
      setState(prev => {
        switch (event.type) {
          case 'GAME_STATE_UPDATE':
            // All players receive and apply the authoritative game state from host
            return { ...prev, gameState: event.gameState };
          case 'CARD_PLAYED':
            // Host processes this action
            if (prev.isHost) {
              applyGameAction({ type: 'PLAY_CARD', playerId: event.playerId, card: event.card, chosenColor: event.chosenColor });
            }
            return prev;
          case 'CARD_DRAWN':
            // Host processes this action
            if (prev.isHost) {
              applyGameAction({ type: 'DRAW_CARD', playerId: event.playerId, count: event.count });
            }
            return prev;
          case 'UNO_CALLED':
            // Host processes this action
            if (prev.isHost) {
              applyGameAction({ type: 'CALL_UNO', playerId: event.playerId });
            }
            return prev;
          default:
            return prev;
        }
      });
    });

    return () => {
      unsubscribeGlobal();
      unsubscribeRoom();
      unsubscribeGame();
    };
  }, [transformRoomData, transformRoomPlayer, applyGameAction]);
  
  return {
    ...state,
    createRoom,
    joinRoom,
    leaveRoom,
    kickPlayer,
    startGame,
    toggleReady,
    loadActiveRooms,
    clearError,
    playCard,
    drawCard,
    callUno
  };
}

function getNextPlayerIndex(currentIndex: number, totalPlayers: number, direction: 'clockwise' | 'counterclockwise'): number {
  if (direction === 'clockwise') {
    return (currentIndex + 1) % totalPlayers;
  } else {
    return currentIndex === 0 ? totalPlayers - 1 : currentIndex - 1;
  }
}

function drawCardsForPlayer(gameState: GameState, playerIndex: number, count: number) {
  const player = gameState.players[playerIndex];
  
  for (let i = 0; i < count; i++) {
    if (gameState.drawPile.length === 0) {
      const newDrawPile = shuffleDeck(gameState.discardPile.slice(0, -1));
      gameState.drawPile = newDrawPile;
      gameState.discardPile = [gameState.topCard];
    }

    if (gameState.drawPile.length > 0) {
      const card = gameState.drawPile.pop()!;
      player.cards.push(card);

      if (player.cards.length > 50) {
        gameState.players = gameState.players.filter(p => p.id !== player.id);
        if (gameState.currentPlayerIndex >= gameState.players.length) {
          gameState.currentPlayerIndex = 0;
        }
        break;
      }
    }
  }
}