
import { Lobby, User, Submission, LobbyStatus } from '../types';
import { db } from './firebase';
import { ref, onValue, set, get, update } from 'firebase/database';
import { CHARACTER_POOL } from '../data/characters';

// --- AUTH ---
export const registerUser = async (password: string, realName: string, schoolNumber: string, avatar: string, color: string): Promise<User> => {
    const userRef = ref(db, `users/${schoolNumber}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) throw new Error("Bu okul numarası zaten kayıtlı.");

    // Pool'dan bir isim seçelim (Resim zaten AI tarafından üretildi)
    const randomName = CHARACTER_POOL[Math.floor(Math.random() * CHARACTER_POOL.length)].name;

    const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        username: schoolNumber,
        password,
        realName,
        schoolNumber,
        nickname: randomName, 
        avatarImage: avatar,
        characterColor: color,
        joinedLobbyIds: []
    };
    await set(userRef, newUser);
    return newUser;
};

export const loginUser = async (schoolNumber: string, password: string): Promise<User> => {
    const userRef = ref(db, `users/${schoolNumber}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) throw new Error("Öğrenci kaydı bulunamadı.");
    const user = snapshot.val();
    if (user.password !== password) throw new Error("Hatalı şifre.");
    return user;
};

// --- LOBBY ---
export const createLobby = async (userId: string, lobbyName: string): Promise<string> => {
    const lobbyId = Math.floor(1000 + Math.random() * 9000).toString();
    const newLobby: Lobby = {
        id: lobbyId,
        creatorId: userId,
        name: lobbyName,
        status: LobbyStatus.OPEN,
        submissions: {},
        participants: { [userId]: true },
        createdAt: Date.now()
    };
    await set(ref(db, `lobbies/${lobbyId}`), newLobby);
    return lobbyId;
};

export const subscribeToLobby = (lobbyId: string, callback: (lobby: Lobby | null) => void) => {
    const lobbyRef = ref(db, `lobbies/${lobbyId}`);
    return onValue(lobbyRef, (snapshot) => {
        callback(snapshot.val());
    });
};

export const getUserJoinedLobbies = async (ids: string[]): Promise<Lobby[]> => {
    if (!ids || ids.length === 0) return [];
    const lobbies: Lobby[] = [];
    for (const id of ids) {
        const lobbyRef = ref(db, `lobbies/${id}`);
        const snap = await get(lobbyRef);
        if (snap.exists()) lobbies.push(snap.val());
    }
    return lobbies;
};

export const joinLobby = async (userId: string, lobbyId: string) => {
    await set(ref(db, `lobbies/${lobbyId}/participants/${userId}`), true);
    
    const usersRef = ref(db, `users`);
    const allUsersSnap = await get(usersRef);
    const users = allUsersSnap.val();
    const userKey = Object.keys(users).find(k => users[k].id === userId);
    if (userKey) {
        const currentJoined = users[userKey].joinedLobbyIds || [];
        if (!currentJoined.includes(lobbyId)) {
            await update(ref(db, `users/${userKey}`), {
                joinedLobbyIds: [...currentJoined, lobbyId]
            });
        }
    }
};

export const submitLink = async (lobbyId: string, submission: Submission) => {
    await set(ref(db, `lobbies/${lobbyId}/submissions/${submission.id}`), submission);
};

export const startVoting = async (lobbyId: string) => {
    const lobbyRef = ref(db, `lobbies/${lobbyId}`);
    const snap = await get(lobbyRef);
    const lobby: Lobby = snap.val();
    
    const submissionsList = Object.values(lobby.submissions || {}) as Submission[];
    const participants = Object.keys(lobby.participants).filter(pid => pid !== lobby.creatorId);

    if (submissionsList.length < 2) throw new Error("Yarışma için en az 2 link gerekli!");

    const newSubmissions: Record<string, Submission> = { ...lobby.submissions };
    const VOTES_PER_LINK = Math.min(3, participants.length - 1);
    
    const voterLoads: Record<string, number> = {};
    participants.forEach(p => voterLoads[p] = 0);

    submissionsList.forEach(sub => {
        const assigned: string[] = [];
        const possibleVoters = participants
            .filter(pid => pid !== sub.userId)
            .sort((a, b) => voterLoads[a] - voterLoads[b]);

        for (let i = 0; i < VOTES_PER_LINK; i++) {
            if (possibleVoters[i]) {
                const vid = possibleVoters[i];
                assigned.push(vid);
                voterLoads[vid]++;
            }
        }
        newSubmissions[sub.id].assignedVoters = assigned;
    });

    await update(lobbyRef, {
        status: LobbyStatus.VOTING,
        submissions: newSubmissions
    });
};

export const castVote = async (lobbyId: string, submissionId: string, voterId: string, score: number) => {
    await set(ref(db, `lobbies/${lobbyId}/submissions/${submissionId}/votes/${voterId}`), score);
};

export const closeLobby = async (lobbyId: string) => {
    await update(ref(db, `lobbies/${lobbyId}`), { status: LobbyStatus.CLOSED });
};

export const getFullUser = async (userId: string): Promise<User | null> => {
    const usersRef = ref(db, `users`);
    const snap = await get(usersRef);
    if (!snap.exists()) return null;
    const users = snap.val();
    const key = Object.keys(users).find(k => users[k].id === userId);
    return key ? users[key] : null;
};
