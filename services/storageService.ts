import { GameState, INITIAL_STATE, User, Submission, AppStatus } from '../types';
import { db } from './firebase';
import { ref, onValue, set, off, get, child, runTransaction, update } from 'firebase/database';

const STORAGE_KEY_PREFIX = 'linkyaris_gamestate_';

let isOffline = !db;

// Helper to check if we are online
export const isOnlineMode = () => !isOffline;

// Helper to ensure state always has required arrays (Fixes 'undefined' errors)
const sanitizeState = (state: any): GameState => {
  if (!state) return INITIAL_STATE;
  
  // Sanitize submissions to ensure 'votes' is always an object and 'url' is a string
  const sanitizedSubmissions = (state.submissions || []).map((sub: any) => ({
    ...sub,
    votes: sub.votes || {}, // CRITICAL FIX: Ensure votes is never undefined
    url: sub.url || "https://example.com" // CRITICAL FIX: Ensure URL is never null
  }));

  // Sanitize users to ensure password is strictly a string (or empty string), never undefined
  const sanitizedUsers = (state.users || []).map((user: any) => ({
    ...user,
    password: user.password || "" // CRITICAL FIX: Firebase throws if this is undefined
  }));

  // Sanitize currentSubmissionIndex
  let index = state.currentSubmissionIndex;
  if (typeof index !== 'number') index = -1;

  return {
    ...INITIAL_STATE,
    ...state,
    users: sanitizedUsers, // Use sanitized users
    submissions: sanitizedSubmissions,
    currentSubmissionIndex: index,
    settings: { ...INITIAL_STATE.settings, ...(state.settings || {}) }
  };
};

let currentRef: any = null;
let currentCallback: ((state: GameState) => void) | null = null;

/**
 * Checks if a room exists without creating it or subscribing to it.
 */
export const doesRoomExist = async (roomId: string): Promise<boolean> => {
  const localKey = `${STORAGE_KEY_PREFIX}${roomId}`;
  
  if (isOffline) {
    // Check Local Storage
    return !!localStorage.getItem(localKey);
  } else {
    // Check Firebase
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `games/${roomId}`));
      return snapshot.exists();
    } catch (error) {
      console.error("Error checking room existence:", error);
      return false;
    }
  }
};

/**
 * Safely adds a user to the game using Transactions to prevent race conditions.
 */
export const addUserToGame = async (roomId: string, user: User): Promise<void> => {
    const dbPath = `games/${roomId}/users`;
    const localKey = `${STORAGE_KEY_PREFIX}${roomId}`;

    if (isOffline) {
        const stored = localStorage.getItem(localKey);
        let currentState = stored ? JSON.parse(stored) : INITIAL_STATE;
        const exists = currentState.users.some((u: User) => u.id === user.id || (u.name === user.name && u.isMod === user.isMod));
        if (!exists) {
            currentState.users = [...currentState.users, user];
            localStorage.setItem(localKey, JSON.stringify(currentState));
            window.dispatchEvent(new Event('local-storage-update'));
        }
    } else {
        const usersRef = ref(db, dbPath);
        try {
            await runTransaction(usersRef, (currentUsers) => {
                if (currentUsers === null) return [user];
                const exists = currentUsers.some((u: any) => u.id === user.id || (u.name === user.name && u.isMod === user.isMod));
                if (exists) return; // Already exists
                return [...currentUsers, user];
            });
        } catch (error) {
            console.error("Transaction failed: ", error);
            throw error;
        }
    }
};

/**
 * Safely adds a submission without overwriting other parts of the state (like users).
 */
export const addSubmissionToGame = async (roomId: string, submission: Submission): Promise<void> => {
    const dbPath = `games/${roomId}/submissions`;
    const localKey = `${STORAGE_KEY_PREFIX}${roomId}`;

    if (isOffline) {
        const stored = localStorage.getItem(localKey);
        let currentState = stored ? JSON.parse(stored) : INITIAL_STATE;
        currentState.submissions = [...(currentState.submissions || []), submission];
        localStorage.setItem(localKey, JSON.stringify(currentState));
        window.dispatchEvent(new Event('local-storage-update'));
    } else {
        const subsRef = ref(db, dbPath);
        await runTransaction(subsRef, (currentSubmissions) => {
            if (currentSubmissions === null) return [submission];
            return [...currentSubmissions, submission];
        });
    }
};

/**
 * Updates game status, settings, or index without touching users/submissions list directly.
 */
export const updateGameStatus = async (roomId: string, updates: Partial<GameState>) => {
    const dbPath = `games/${roomId}`;
    const localKey = `${STORAGE_KEY_PREFIX}${roomId}`;

    if (isOffline) {
        const stored = localStorage.getItem(localKey);
        let currentState = stored ? JSON.parse(stored) : INITIAL_STATE;
        const newState = { ...currentState, ...updates, lastUpdated: Date.now() };
        localStorage.setItem(localKey, JSON.stringify(newState));
        window.dispatchEvent(new Event('local-storage-update'));
    } else {
        // Use Firebase update() which merges fields at the path
        const gameRef = ref(db, dbPath);
        await update(gameRef, { ...updates, lastUpdated: Date.now() });
    }
};

/**
 * Updates a specific vote safely.
 */
export const submitVote = async (roomId: string, submissionIndex: number, userId: string, score: number) => {
    const dbPath = `games/${roomId}/submissions/${submissionIndex}/votes/${userId}`;
    const localKey = `${STORAGE_KEY_PREFIX}${roomId}`;

    if (isOffline) {
        const stored = localStorage.getItem(localKey);
        let currentState = stored ? JSON.parse(stored) : INITIAL_STATE;
        if (currentState.submissions && currentState.submissions[submissionIndex]) {
             if (!currentState.submissions[submissionIndex].votes) currentState.submissions[submissionIndex].votes = {};
             currentState.submissions[submissionIndex].votes[userId] = score;
             localStorage.setItem(localKey, JSON.stringify(currentState));
             window.dispatchEvent(new Event('local-storage-update'));
        }
    } else {
        const voteRef = ref(db, dbPath);
        await set(voteRef, score);
    }
};

/**
 * Updates AI Commentary for a specific submission.
 */
export const updateAiComment = async (roomId: string, submissionIndex: number, comment: string) => {
    const dbPath = `games/${roomId}/submissions/${submissionIndex}/aiCommentary`;
    const localKey = `${STORAGE_KEY_PREFIX}${roomId}`;

    if (isOffline) {
        const stored = localStorage.getItem(localKey);
        let currentState = stored ? JSON.parse(stored) : INITIAL_STATE;
        if (currentState.submissions && currentState.submissions[submissionIndex]) {
             currentState.submissions[submissionIndex].aiCommentary = comment;
             localStorage.setItem(localKey, JSON.stringify(currentState));
             window.dispatchEvent(new Event('local-storage-update'));
        }
    } else {
        const commentRef = ref(db, dbPath);
        await set(commentRef, comment);
    }
};

export const subscribeToGame = (roomId: string, callback: (state: GameState) => void) => {
  if (currentRef && !isOffline) off(currentRef);

  const dbPath = `games/${roomId}`;
  const localKey = `${STORAGE_KEY_PREFIX}${roomId}`;
  currentCallback = callback;

  if (isOffline) {
    const handleStorage = () => {
        const stored = localStorage.getItem(localKey);
        if (stored) {
            try { callback(sanitizeState(JSON.parse(stored))); } catch (e) { callback(INITIAL_STATE); }
        } else { callback(INITIAL_STATE); }
    };
    window.removeEventListener('local-storage-update', handleStorage);
    window.addEventListener('local-storage-update', handleStorage);
    const stored = localStorage.getItem(localKey);
    if (stored) callback(sanitizeState(JSON.parse(stored)));
    else callback(INITIAL_STATE);
    return () => { window.removeEventListener('local-storage-update', handleStorage); };
  } else {
    const gameRef = ref(db, dbPath);
    currentRef = gameRef;
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) callback(sanitizeState(data));
      else callback(INITIAL_STATE);
    });
    return () => off(gameRef);
  }
};

// Deprecated: Use specific update functions instead to avoid overwriting users.
export const saveState = (roomId: string, state: GameState) => {
  const newState = { ...state, lastUpdated: Date.now() };
  const dbPath = `games/${roomId}`;
  const localKey = `${STORAGE_KEY_PREFIX}${roomId}`;
  
  if (isOffline) {
    localStorage.setItem(localKey, JSON.stringify(newState));
    window.dispatchEvent(new Event('local-storage-update'));
  } else {
    const gameRef = ref(db, dbPath);
    set(gameRef, newState).catch(err => { console.error("Firebase update failed:", err); });
  }
  return newState;
};

/**
 * Hard Reset: Deletes everything.
 */
export const resetGame = (roomId: string) => {
  const dbPath = `games/${roomId}`;
  const localKey = `${STORAGE_KEY_PREFIX}${roomId}`;

  if (isOffline) {
    localStorage.removeItem(localKey);
    window.dispatchEvent(new Event('local-storage-update'));
  } else {
    const gameRef = ref(db, dbPath);
    set(gameRef, INITIAL_STATE);
  }
};

/**
 * Soft Reset: Clears submissions and status, BUT KEEPS USERS.
 * Used for starting a new round with the same people.
 */
export const softResetGame = async (roomId: string) => {
    const dbPath = `games/${roomId}`;
    const localKey = `${STORAGE_KEY_PREFIX}${roomId}`;

    if (isOffline) {
        const stored = localStorage.getItem(localKey);
        let currentState = stored ? JSON.parse(stored) : INITIAL_STATE;
        
        // Keep users, reset everything else
        const newState = {
            ...INITIAL_STATE,
            users: currentState.users || [], // PRESERVE USERS
            lastUpdated: Date.now()
        };
        
        localStorage.setItem(localKey, JSON.stringify(newState));
        window.dispatchEvent(new Event('local-storage-update'));
    } else {
        const gameRef = ref(db, dbPath);
        // We need to read users first (or assume current state is okay? No, safer to use transaction or update)
        // Since update merges, we can't easily "delete" the submissions array with update if we don't set it to null/empty.
        // Best approach: Transaction on the whole game, preserving users.
        await runTransaction(gameRef, (currentGame) => {
            if (!currentGame) return INITIAL_STATE;
            return {
                ...INITIAL_STATE,
                users: currentGame.users || [], // PRESERVE USERS
                lastUpdated: Date.now()
            };
        });
    }
};