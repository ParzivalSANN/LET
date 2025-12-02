export interface User {
  id: string;
  name: string;
  isMod: boolean;
  joinedAt: number;
}

export interface Vote {
  userId: string;
  score: number; // 1-10
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

export interface GameState {
  status: AppStatus;
  users: User[];
  submissions: Submission[];
  currentSubmissionIndex: number;
  lastUpdated: number;
}

export const INITIAL_STATE: GameState = {
  status: AppStatus.LOBBY,
  users: [],
  submissions: [],
  currentSubmissionIndex: -1,
  lastUpdated: Date.now(),
};
