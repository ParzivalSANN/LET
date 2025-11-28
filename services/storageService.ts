import { GameState, INITIAL_STATE } from '../types';
import { db } from './firebase';
import { ref, onValue, set } from 'firebase/database';

const STORAGE_KEY = 'linkyaris_gamestate_v1';
const DB_REF = 'gamestate';

let isOffline = !db;

// Helper to check if we are online
export const isOnlineMode = () => !isOffline;

export const subscribeToGame = (callback: (state: GameState) => void) => {
  if (isOffline) {
    // Local Storage Listener
    const handleStorage = () => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) callback(JSON.parse(stored));
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('local-storage-update', handleStorage);
    
    // Initial load
    const current = getStoredState();
    callback(current);

    return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('local-storage-update', handleStorage);
    };
  } else {
    // Firebase Listener
    const gameRef = ref(db, DB_REF);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data);
      } else {
        // Initialize DB if empty
        set(gameRef, INITIAL_STATE);
        callback(INITIAL_STATE);
      }
    });
    return () => unsubscribe();
  }
};

export const getStoredState = (): GameState => {
  // Synchronous read only works for local storage
  // For Firebase, the UI relies on the subscription
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return INITIAL_STATE;
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_STATE;
  }
};

export const saveState = (state: GameState) => {
  const newState = { ...state, lastUpdated: Date.now() };
  
  if (isOffline) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    window.dispatchEvent(new Event('local-storage-update'));
  } else {
    const gameRef = ref(db, DB_REF);
    set(gameRef, newState).catch(err => console.error("Firebase update failed", err));
  }
  
  return newState;
};

export const resetGame = () => {
  if (isOffline) {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('local-storage-update'));
  } else {
    const gameRef = ref(db, DB_REF);
    set(gameRef, INITIAL_STATE);
  }
};