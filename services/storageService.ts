import { GameState, INITIAL_STATE, User } from '../types';
import { db } from './firebase';
import { ref, onValue, set, off, get, child, runTransaction } from 'firebase/database';

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
        // Safe Local Storage Update
        const stored = localStorage.getItem(localKey);
        let currentState = stored ? JSON.parse(stored) : INITIAL_STATE;
        
        // Check for duplicates in local state
        const exists = currentState.users.some((u: User) => u.id === user.id || (u.name === user.name && u.isMod === user.isMod));
        
        if (!exists) {
            currentState.users = [...currentState.users, user];
            localStorage.setItem(localKey, JSON.stringify(currentState));
            window.dispatchEvent(new Event('local-storage-update'));
        }
    } else {
        // Safe Firebase Transaction
        const usersRef = ref(db, dbPath);
        
        try {
            await runTransaction(usersRef, (currentUsers) => {
                if (currentUsers === null) {
                    return [user]; // Initialize if empty
                }
                
                // Check if user already exists (by ID or Name+Role)
                const exists = currentUsers.some((u: any) => u.id === user.id || (u.name === user.name && u.isMod === user.isMod));
                
                if (exists) {
                    // Abort transaction, user already there (or let it fail silently as success)
                    return; 
                }

                // Append user
                return [...currentUsers, user];
            });
        } catch (error) {
            console.error("Transaction failed: ", error);
            throw error;
        }
    }
};

export const subscribeToGame = (roomId: string, callback: (state: GameState) => void) => {
  // Unsubscribe from previous if exists
  if (currentRef && !isOffline) {
    off(currentRef);
  }

  const dbPath = `games/${roomId}`;
  const localKey = `${STORAGE_KEY_PREFIX}${roomId}`;
  
  currentCallback = callback;

  if (isOffline) {
    // Local Storage Listener for specific room
    const handleStorage = () => {
        const stored = localStorage.getItem(localKey);
        if (stored) {
            try {
                callback(sanitizeState(JSON.parse(stored)));
            } catch (e) {
                console.error("Storage parse error", e);
                callback(INITIAL_STATE);
            }
        } else {
            callback(INITIAL_STATE);
        }
    };
    
    // Remove old listeners to prevent duplication
    window.removeEventListener('local-storage-update', handleStorage);
    window.addEventListener('local-storage-update', handleStorage);
    
    // Initial load
    const stored = localStorage.getItem(localKey);
    if (stored) {
        callback(sanitizeState(JSON.parse(stored)));
    } else {
        callback(INITIAL_STATE);
    }

    return () => {
        window.removeEventListener('local-storage-update', handleStorage);
    };
  } else {
    // Firebase Listener
    const gameRef = ref(db, dbPath);
    currentRef = gameRef;

    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(sanitizeState(data));
      } else {
        // Initialize DB if empty for this room
        // NOTE: We don't automatically set INITIAL_STATE here to avoid overwriting if a transaction is in progress
        // Just callback with initial state, let the first write handle it.
        callback(INITIAL_STATE);
      }
    });
    return () => off(gameRef);
  }
};

export const saveState = (roomId: string, state: GameState) => {
  const newState = { ...state, lastUpdated: Date.now() };
  const dbPath = `games/${roomId}`;
  const localKey = `${STORAGE_KEY_PREFIX}${roomId}`;
  
  if (isOffline) {
    localStorage.setItem(localKey, JSON.stringify(newState));
    // Dispatch event so other tabs/hooks update
    window.dispatchEvent(new Event('local-storage-update'));
  } else {
    const gameRef = ref(db, dbPath);
    // Explicitly catching write errors to prevent UI crashes
    set(gameRef, newState).catch(err => {
        console.error("Firebase update failed:", err);
    });
  }
  
  return newState;
};

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