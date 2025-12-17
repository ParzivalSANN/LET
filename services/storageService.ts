
import { Lobby, User, Submission, LobbyStatus } from '../types';
import { db } from './firebase';
import { ref, onValue, set, get, child, runTransaction, update } from 'firebase/database';

const USER_KEY = 'linkyaris_auth_user';

// --- AUTH SERVICES ---
export const registerUser = async (username: string, password: string, nickname: string, avatar: string, color: string): Promise<User> => {
    const userRef = ref(db, `users/${username.toLowerCase()}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) throw new Error("Bu kullanıcı adı zaten alınmış.");

    const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        username,
        password,
        nickname,
        avatarImage: avatar,
        characterColor: color,
        joinedLobbyIds: []
    };
    await set(userRef, newUser);
    return newUser;
};

export const loginUser = async (username: string, password: string): Promise<User> => {
    const userRef = ref(db, `users/${username.toLowerCase()}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) throw new Error("Kullanıcı bulunamadı.");
    const user = snapshot.val();
    if (user.password !== password) throw new Error("Hatalı şifre.");
    return user;
};

// --- LOBBY SERVICES ---
export const createLobby = async (userId: string, lobbyName: string): Promise<string> => {
    const lobbyId = Math.floor(1000 + Math.random() * 9000).toString();
    const newLobby: Lobby = {
        id: lobbyId,
        creatorId: userId,
        name: lobbyName,
        status: LobbyStatus.OPEN,
        submissions: [],
        createdAt: Date.now()
    };
    await set(ref(db, `lobbies/${lobbyId}`), newLobby);
    await joinLobby(userId, lobbyId);
    return lobbyId;
};

export const joinLobby = async (userId: string, lobbyId: string) => {
    const lobbyRef = ref(db, `lobbies/${lobbyId}`);
    const snap = await get(lobbyRef);
    if (!snap.exists()) throw new Error("Lobi bulunamadı.");

    // Update User's Joined Lobbies
    const userJoinedRef = ref(db, `users`);
    // Need to find the user by ID because we store by username
    const allUsersSnap = await get(userJoinedRef);
    const users = allUsersSnap.val();
    const username = Object.keys(users).find(k => users[k].id === userId);
    
    if (username) {
        const currentJoined = users[username].joinedLobbyIds || [];
        if (!currentJoined.includes(lobbyId)) {
            await update(ref(db, `users/${username}`), {
                joinedLobbyIds: [...currentJoined, lobbyId]
            });
        }
    }
};

export const addSubmission = async (lobbyId: string, submission: Submission) => {
    const lobbyRef = ref(db, `lobbies/${lobbyId}/submissions`);
    await runTransaction(lobbyRef, (current) => {
        if (!current) return [submission];
        return [...current, submission];
    });
};

export const castVote = async (lobbyId: string, submissionId: string, voterId: string, score: number) => {
    const lobbyRef = ref(db, `lobbies/${lobbyId}/submissions`);
    await runTransaction(lobbyRef, (submissions: Submission[]) => {
        if (!submissions) return [];
        return submissions.map(s => {
            if (s.id === submissionId) {
                return { ...s, votes: { ...(s.votes || {}), [voterId]: score } };
            }
            return s;
        });
    });
};

export const closeLobby = async (lobbyId: string) => {
    await update(ref(db, `lobbies/${lobbyId}`), {
        status: LobbyStatus.CLOSED,
        endedAt: Date.now()
    });
};

export const subscribeToLobby = (lobbyId: string, callback: (lobby: Lobby) => void) => {
    const lobbyRef = ref(db, `lobbies/${lobbyId}`);
    return onValue(lobbyRef, (snap) => {
        if (snap.exists()) callback(snap.val());
    });
};

export const getUserJoinedLobbies = async (lobbyIds: string[]): Promise<Lobby[]> => {
    if (!lobbyIds || lobbyIds.length === 0) return [];
    const lobbies: Lobby[] = [];
    for (const id of lobbyIds) {
        const snap = await get(ref(db, `lobbies/${id}`));
        if (snap.exists()) lobbies.push(snap.val());
    }
    return lobbies;
};
