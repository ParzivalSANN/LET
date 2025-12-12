export interface User {
  id: string;
  name: string;
  isMod: boolean;
  joinedAt: number;
  password?: string; // Optional for backward compatibility, but used for reconnection
}

export interface Vote {
  userId: string;
  score: number; // 1-10, 0 means timeout/skip
}

export interface Submission {
  id: string;
  userId: string;
  userName: string;
  url: string;
  description: string;
  votes: Record<string, number>; // userId -> score mapping
  aiCommentary?: string;
}

export enum AppStatus {
  LOBBY = 'LOBBY',
  VOTING = 'VOTING',
  RESULTS = 'RESULTS'
}

export interface GameSettings {
  timerDuration: number; // saniye cinsinden
}

export interface GameState {
  status: AppStatus;
  users: User[];
  submissions: Submission[];
  currentSubmissionIndex: number;
  lastUpdated: number;
  settings: GameSettings;
  roundEndTime: number; // Timestamp for when the current round ends
}

export const INITIAL_STATE: GameState = {
  status: AppStatus.LOBBY,
  users: [],
  submissions: [],
  currentSubmissionIndex: -1,
  lastUpdated: Date.now(),
  settings: {
    timerDuration: 30 // Varsayılan 30 saniye
  },
  roundEndTime: 0
};