// types/Room.ts

import { Card, CardColor, GameState } from './Card'; // Import GameState, Card, CardColor if they are defined here

// Interface cho thông tin người chơi trong phòng
export interface RoomPlayer {
  id: string;
  name: string;
  socketId: string;
  isHost: boolean;
  isReady: boolean;
  joinedAt: Date; // Đã cập nhật: đảm bảo là kiểu Date
}

// Interface cho thông tin phòng
export interface Room {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  players: RoomPlayer[];
  maxPlayers: number;
  currentPlayers: number;
  hasPassword: boolean;
  password?: string; // Tùy chọn, không luôn có sẵn ở client
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date; // Đã cập nhật: đảm bảo là kiểu Date
  gameInProgress: boolean;
  gameState: GameState | null; // Sử dụng kiểu GameState đã định nghĩa
}

// Interface cho dữ liệu khi tạo phòng
export interface CreateRoomData {
  name: string;
  hostName: string;
  maxPlayers: number;
  password?: string;
}

// Interface cho dữ liệu khi tham gia phòng
export interface JoinRoomData {
  roomId: string;
  playerName: string;
  password?: string;
}

// Interface cho các sự kiện phòng nhận từ server
export type RoomEvent =
  | { type: 'PLAYER_JOINED'; player: RoomPlayer }
  | { type: 'PLAYER_LEFT'; playerId: string; newHost?: RoomPlayer } // newHost có thể có
  | { type: 'HOST_CHANGED'; newHostId: string }
  | { type: 'GAME_STARTED' }
  | { type: 'GAME_ENDED' }
  | { type: 'ROOM_UPDATED'; room: Room } // Gửi toàn bộ đối tượng room đã cập nhật
  | { type: 'PLAYER_KICKED'; playerId: string }
  | { type: 'KICKED_FROM_ROOM' };

// Interface cho kết quả API khi tạo/tham gia phòng
export interface CreateJoinRoomResult {
  success: boolean;
  room?: Room;
  playerId?: string;
  error?: string;
}