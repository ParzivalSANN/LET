import { GameState, INITIAL_STATE } from '../types';
import { db } from './firebase';
import { ref, onValue, set, off } from 'firebase/database';

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
        set(gameRef, INITIAL_STATE);
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