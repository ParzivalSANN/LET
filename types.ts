
export interface User {
  id: string;
  username: string; 
  password?: string;
  realName: string; // Real name for moderator
  schoolNumber: string; // Student ID
  nickname: string; // Random assigned during lobby entry
  avatarImage: string;
  characterColor: string;
  joinedLobbyIds: string[];
  isMod?: boolean;
}

export enum LobbyStatus {
  OPEN = 'OPEN',
  VOTING = 'VOTING', // New state for distributed voting
  CLOSED = 'CLOSED'
}

export interface Submission {
  id: string;
  userId: string;
  nickname: string; // Anonymous nickname
  avatarImage: string;
  url: string;
  description: string;
  votes: Record<string, number>; 
  assignedVoters: string[]; // List of user IDs assigned to vote on this
  createdAt: number;
}

export interface Lobby {
  id: string;
  creatorId: string;
  name: string;
  status: LobbyStatus;
  submissions: Record<string, Submission>; // Key is submission ID
  participants: Record<string, boolean>; // userId -> active
  createdAt: number;
}
