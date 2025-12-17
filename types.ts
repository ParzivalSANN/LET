
export interface User {
  id: string;
  username: string; // Login name
  password?: string;
  nickname: string; // Randomly assigned
  avatarImage: string;
  characterColor: string;
  joinedLobbyIds: string[];
  isMod?: boolean; // Added to support moderator role
}

export enum LobbyStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export interface Submission {
  id: string;
  userId: string;
  nickname: string;
  avatarImage: string;
  url: string;
  description: string;
  votes: Record<string, number>; // voterUserId -> score
  aiCommentary?: string;
  createdAt: number;
}

export interface Lobby {
  id: string;
  creatorId: string;
  name: string;
  status: LobbyStatus;
  submissions: Submission[];
  createdAt: number;
  endedAt?: number;
}

export interface GameState {
  lobbies: Record<string, Lobby>;
  users: Record<string, User>;
}

export const INITIAL_STATE: GameState = {
  lobbies: {},
  users: {}
};