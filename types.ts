export interface User {
  id: string;
  name: string;
  isMod: boolean;
  joinedAt: number;
  passwordHash: string;
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

export enum RoomStatus {
  WAITING = 'WAITING',           // Waiting for participants
  SUBMISSION = 'SUBMISSION',      // Collecting links
  VOTING = 'VOTING',              // Voting in progress
  RESULTS = 'RESULTS'             // Show results
}

export interface Room {
  id: string;                     // "room_abc123"
  pin: string;                    // "2847" (4 digits)
  createdBy: string;              // Moderator user ID
  createdAt: number;
  status: RoomStatus;
  users: User[];
  submissions: Submission[];
  currentSubmissionIndex: number;
  lastUpdated: number;
}

export const INITIAL_ROOM: Omit<Room, 'id' | 'pin' | 'createdBy' | 'createdAt'> = {
  status: RoomStatus.WAITING,
  users: [],
  submissions: [],
  currentSubmissionIndex: -1,
  lastUpdated: Date.now(),
};

// Legacy - keeping for backward compatibility during migration
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
