import { useState, useEffect, useCallback } from 'react';
import { Room, RoomPlayer, CreateRoomData, JoinRoomData, RoomEvent, CreateJoinRoomResult } from '../types/Room';
import { GameState, Player, Card, CardColor } from '../types/Card'; // Đảm bảo import GameState, Card, CardColor
import { socketService } from '../services/SocketService';
import { createDeck, shuffleDeck } from '../utils/cardUtils';

// Định nghĩa trạng thái của hook useRoomSystem
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

  /**
   * Helper function để chuyển đổi dữ liệu người chơi từ server (chuỗi) sang client (Date object).
   * Đảm bảo `joinedAt` luôn là Date object trên frontend.
   * @param playerData Dữ liệu người chơi thô nhận từ server.
   * @returns Đối tượng RoomPlayer đã được chuyển đổi với thuộc tính Date.
   */
  const transformRoomPlayer = useCallback((playerData: any): RoomPlayer => {
    return {
      ...playerData,
      joinedAt: new Date(playerData.joinedAt) // Chuyển đổi chuỗi `joinedAt` thành Date
    };
  }, []);

  /**
   * Helper function để chuyển đổi dữ liệu phòng từ server (chuỗi) sang client (Date object).
   * Đảm bảo `createdAt` và `joinedAt` luôn là Date object trên frontend.
   * @param roomData Dữ liệu phòng thô nhận từ server.
   * @returns Đối tượng Room đã được chuyển đổi với các thuộc tính Date.
   */
  const transformRoomData = useCallback((roomData: any): Room => {
    return {
      ...roomData,
      createdAt: new Date(roomData.createdAt), // Chuyển đổi chuỗi `createdAt` thành Date
      players: roomData.players.map(transformRoomPlayer) // Sử dụng hàm mới cho người chơi
    };
  }, [transformRoomPlayer]); // Thêm transformRoomPlayer vào dependency array

  // Theo dõi trạng thái kết nối socket
  useEffect(() => {
    const checkConnection = () => {
      setState(prev => ({ 
        ...prev, 
        isConnected: socketService.isSocketConnected() 
      }));
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000); // Kiểm tra mỗi giây
    return () => clearInterval(interval); // Dọn dẹp interval khi component unmount
  }, []);

  /**
   * Khởi tạo trạng thái game khi game bắt đầu (logic phía Host).
   * @param room Đối tượng phòng hiện tại để lấy thông tin người chơi.
   */
  const initializeGameState = useCallback((room: Room) => {
    const deck = shuffleDeck(createDeck());
    
    // Chuyển đổi người chơi trong phòng sang người chơi game (không có AI trong multiplayer)
    const players: Player[] = room.players.map(roomPlayer => ({
      id: roomPlayer.id,
      name: roomPlayer.name,
      cards: [],
      isHuman: true, // Tất cả người chơi trong multiplayer là người thật
      hasCalledUno: false
    }));

    // Chia 7 lá bài cho mỗi người chơi
    let cardIndex = 0;
    for (let i = 0; i < 7; i++) {
      players.forEach(player => {
        if (cardIndex < deck.length) {
          player.cards.push(deck[cardIndex++]);
        }
      });
    }

    // Tìm lá bài không phải hành động đầu tiên cho lá bài trên cùng
    let topCardIndex = cardIndex;
    while (topCardIndex < deck.length && deck[topCardIndex].type !== 'number') {
      topCardIndex++;
    }

    // Trường hợp dự phòng nếu không tìm thấy thẻ số (không nên xảy ra với bộ bài chuẩn)
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
      wildColor: undefined, // Khởi tạo giá trị
      winner: undefined, // Khởi tạo giá trị
      lastPlayedCard: undefined, // Khởi tạo giá trị
    };

    setState(prev => ({ ...prev, gameState }));
    
    // Phát sóng trạng thái game tới tất cả người chơi qua socket
    socketService.broadcastGameState(gameState);
  }, []);

  /**
   * Tải danh sách các phòng đang hoạt động từ server.
   */
  const loadActiveRooms = useCallback(async () => {
    if (!socketService.isSocketConnected()) {
      setState(prev => ({ ...prev, activeRooms: [] }));
      return;
    }

    try {
      const rooms = await socketService.getActiveRooms();
      setState(prev => ({ 
        ...prev, 
        activeRooms: rooms.map(transformRoomData) // Áp dụng chuyển đổi dữ liệu
      }));
    } catch (error) {
      console.error('Failed to load rooms:', error);
      setState(prev => ({ ...prev, error: 'Không thể tải danh sách phòng' }));
    }
  }, [transformRoomData]); // Thêm transformRoomData vào dependency array

  /**
   * Tạo một phòng game mới.
   * @param data Dữ liệu cần thiết để tạo phòng.
   * @returns Promise trả về kết quả tạo phòng (thành công/thất bại, thông tin phòng).
   */
  const createRoom = useCallback(async (data: CreateRoomData): Promise<CreateJoinRoomResult> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await socketService.createRoom(data); 
      
      if (result.success && result.room && result.playerId) {
        const transformedRoom = transformRoomData(result.room); // Chuyển đổi dữ liệu phòng nhận được
        setState(prev => ({
          ...prev,
          currentRoom: transformedRoom,
          currentPlayerId: result.playerId!,
          isHost: true,
          loading: false,
          gameState: null // Đặt lại trạng thái game
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
  }, [transformRoomData]); // Thêm transformRoomData vào dependency array

  /**
   * Tham gia một phòng game hiện có.
   * @param data Dữ liệu cần thiết để tham gia phòng.
   * @returns Promise trả về kết quả tham gia phòng (thành công/thất bại, thông tin phòng).
   */
  const joinRoom = useCallback(async (data: JoinRoomData): Promise<CreateJoinRoomResult> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await socketService.joinRoom(data); 
      
      if (result.success && result.room && result.playerId) {
        const transformedRoom = transformRoomData(result.room); // Chuyển đổi dữ liệu phòng nhận được
        setState(prev => ({
          ...prev,
          currentRoom: transformedRoom,
          currentPlayerId: result.playerId!,
          isHost: false,
          loading: false,
          gameState: null // Đặt lại trạng thái game
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Không thể tham gia phòng'
        }));
      }
      
      return result;
    }
     catch (error: any) {
      console.error('Lỗi khi tham gia phòng:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Lỗi kết nối đến server: ' + (error.message || String(error))
      }));
      return { success: false, error: 'Lỗi kết nối đến server' };
    }
  }, [transformRoomData]); // Thêm transformRoomData vào dependency array

  /**
   * Rời khỏi phòng hiện tại.
   */
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

  /**
   * Kick một người chơi khỏi phòng (chỉ Host mới có quyền).
   * @param targetPlayerId ID của người chơi cần kick.
   * @returns True nếu kick thành công, ngược lại False.
   */
  const kickPlayer = useCallback(async (targetPlayerId: string) => {
    if (state.isHost) {
      const result = await socketService.kickPlayer(targetPlayerId);
      return result.success;
    }
    return false;
  }, [state.isHost]);

  /**
   * Bắt đầu game (chỉ Host mới có quyền).
   * @returns True nếu game bắt đầu thành công, ngược lại False.
   */
  const startGame = useCallback(async () => {
    if (state.isHost && state.currentRoom) {
      const result = await socketService.startGame();
      if (result.success) {
        initializeGameState(state.currentRoom); // Khởi tạo trạng thái game cục bộ cho host
        return true;
      } else if (result.error) {
        setState(prev => ({ ...prev, error: result.error! }));
      }
      return false;
    }
    return false;
  }, [state.isHost, state.currentRoom, initializeGameState]);

  /**
   * Chuyển đổi trạng thái sẵn sàng của người chơi.
   * @returns True nếu trạng thái sẵn sàng thay đổi thành công, ngược lại False.
   */
  const toggleReady = useCallback(async () => {
    if (!state.isHost) {
      const result = await socketService.toggleReady();
      return result.success;
    }
    return false;
  }, [state.isHost]);

  // Các hành động trong game cho chế độ multiplayer
  const playCard = useCallback((playerId: string, card: Card, chosenColor?: CardColor) => {
    if (!state.gameState || !state.currentPlayerId) return;
    
    // Phát sóng hành động chơi bài tới tất cả người chơi qua socket
    socketService.broadcastCardPlay(playerId, card, chosenColor);
    
    // Cập nhật trạng thái cục bộ để phản hồi tức thì (sẽ bị ghi đè bởi trạng thái server sau)
    setState(prev => {
      if (!prev.gameState) return prev;
      
      const newGameState = { ...prev.gameState };
      const player = newGameState.players.find(p => p.id === playerId);
      const currentPlayer = newGameState.players[newGameState.currentPlayerIndex];
      
      if (!player || player.id !== currentPlayer.id) return prev; // Không phải lượt của người chơi hiện tại hoặc không tìm thấy người chơi
      
      player.cards = player.cards.filter(c => c.id !== card.id);
      
      newGameState.discardPile.push(card);
      newGameState.topCard = card;
      
      if (card.type === 'wild' || card.type === 'wild-draw-four') {
        newGameState.wildColor = chosenColor || 'red'; // Mặc định là đỏ nếu không được chọn
      } else {
        newGameState.wildColor = undefined;
      }
      
      if (player.cards.length === 0) {
        newGameState.gamePhase = 'finished';
        newGameState.winner = player;
      } else {
        newGameState.currentPlayerIndex = (newGameState.currentPlayerIndex + 1) % newGameState.players.length;
      }
      
      return { ...prev, gameState: newGameState };
    });
  }, [state.gameState, state.currentPlayerId]);

  const drawCard = useCallback((playerId: string, count: number = 1) => {
    if (!state.gameState || !state.currentPlayerId) return [];
    
    // Phát sóng hành động rút bài qua socket
    socketService.broadcastDrawCard(playerId, count);
    
    const drawnCards: Card[] = [];
    setState(prev => {
      if (!prev.gameState) return prev;
      
      const newGameState = { ...prev.gameState };
      const player = newGameState.players.find(p => p.id === playerId);
      
      if (!player) return prev;
      
      for (let i = 0; i < count; i++) {
        if (newGameState.drawPile.length > 0) {
          const card = newGameState.drawPile.pop()!;
          player.cards.push(card);
          drawnCards.push(card);
        }
      }
      
      return { ...prev, gameState: newGameState };
    });
    
    return drawnCards;
  }, [state.gameState, state.currentPlayerId]);

  const callUno = useCallback((playerId: string) => {
    if (!state.gameState) return;
    
    // Phát sóng hành động gọi UNO qua socket
    socketService.broadcastUnoCall(playerId);
    
    setState(prev => {
      if (!prev.gameState) return prev;
      
      const newGameState = { ...prev.gameState };
      const player = newGameState.players.find(p => p.id === playerId);
      
      if (player && player.cards.length === 1) {
        player.hasCalledUno = true;
      }
      
      return { ...prev, gameState: newGameState };
    });
  }, [state.gameState]);

  // Xóa thông báo lỗi
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Thiết lập các trình lắng nghe sự kiện từ socket
  useEffect(() => {
    // Sự kiện toàn cầu
    const unsubscribeGlobal = socketService.addGlobalEventListener((event: any) => {
      switch (event.type) {
        case 'ROOMS_UPDATED':
          // Chuyển đổi rooms khi chúng được cập nhật toàn cục
          setState(prev => ({ 
            ...prev, 
            activeRooms: event.rooms.map(transformRoomData) // Áp dụng chuyển đổi dữ liệu
          }));
          break;
        case 'CONNECTION_FAILED':
          setState(prev => ({ 
            ...prev, 
            error: 'Mất kết nối đến server. Vui lòng thử lại.',
            isConnected: false,
            // Xóa thông tin phòng và người chơi hiện tại khi mất kết nối
            currentRoom: null, 
            currentPlayerId: null,
            isHost: false,
            gameState: null,
            activeRooms: [] // Xóa cả danh sách phòng đang hoạt động
          }));
          break;
      }
    });

    // Sự kiện dành riêng cho phòng
    const unsubscribeRoom = socketService.addEventListener('current-room', (event: RoomEvent) => {
      setState(prev => {
        switch (event.type) {
          case 'PLAYER_JOINED':
            if (prev.currentRoom) {
              const updatedRoom = { ...prev.currentRoom };
              updatedRoom.players.push(transformRoomPlayer(event.player)); // <-- SỬA LỖI Ở ĐÂY
              updatedRoom.currentPlayers++;
              return { ...prev, currentRoom: updatedRoom };
            }
            return prev;

          case 'PLAYER_LEFT':
            if (prev.currentRoom) {
              const updatedRoom = { ...prev.currentRoom };
              updatedRoom.players = updatedRoom.players.filter(p => p.id !== event.playerId);
              updatedRoom.currentPlayers--;
              // Cập nhật host nếu cần
              if (event.newHost) {
                updatedRoom.hostId = event.newHost.id;
                updatedRoom.hostName = event.newHost.name;
                updatedRoom.players.forEach(p => p.isHost = (p.id === event.newHost!.id));
              }
              return { ...prev, currentRoom: updatedRoom, isHost: prev.currentPlayerId === updatedRoom.hostId };
            }
            // Nếu người chơi hiện tại rời đi (hoặc bị kick), chúng ta nên xóa thông tin phòng
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
            // Chuyển đổi dữ liệu phòng được cập nhật
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

    // Sự kiện game
    const unsubscribeGame = socketService.addGameEventListener((event: any) => {
      setState(prev => {
        switch (event.type) {
          case 'GAME_STATE_UPDATE':
            return { ...prev, gameState: event.gameState };
          case 'CARD_PLAYED':
          case 'CARD_DRAWN':
          case 'UNO_CALLED':
            // Các sự kiện này chỉ là thông báo; trạng thái game đầy đủ sẽ được gửi qua GAME_STATE_UPDATE
            // nếu bạn muốn cập nhật trạng thái game dựa trên các sự kiện này, cần logic cụ thể hơn.
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
  }, [transformRoomData, transformRoomPlayer]); // Thêm transformRoomPlayer vào dependency array
  
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
