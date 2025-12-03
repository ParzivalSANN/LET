import { Room, RoomStatus } from '../types';
import { db } from './firebase';
import { ref, onValue, set, get } from 'firebase/database';

const ROOMS_REF = 'rooms';

let isOffline = !db;

// Simple locking mechanism for localStorage to prevent race conditions
const locks = new Map<string, boolean>();

const acquireLock = async (key: string, maxRetries = 10): Promise<boolean> => {
    for (let i = 0; i < maxRetries; i++) {
        if (!locks.get(key)) {
            locks.set(key, true);
            return true;
        }
        // Wait with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.min(50 * Math.pow(2, i), 500)));
    }
    return false;
};

const releaseLock = (key: string) => {
    locks.delete(key);
};

/**
 * Subscribe to a specific room's updates
 */
export const subscribeToRoom = (roomId: string, callback: (room: Room | null) => void) => {
    if (isOffline) {
        // LocalStorage fallback - only listen to events, don't read initially
        // This prevents race condition with saveRoom
        const handleStorage = () => {
            const updated = localStorage.getItem(`room_${roomId}`);
            if (updated) {
                try {
                    callback(JSON.parse(updated));
                } catch {
                    callback(null);
                }
            }
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener(`room-update-${roomId}`, handleStorage);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener(`room-update-${roomId}`, handleStorage);
        };
    } else {
        // Firebase real-time listener
        const roomRef = ref(db, `${ROOMS_REF}/${roomId}`);
        const unsubscribe = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            callback(data || null);
        });
        return () => unsubscribe();
    }
};

/**
 * Get room by ID
 */
export const getRoomById = async (roomId: string): Promise<Room | null> => {
    if (isOffline) {
        const stored = localStorage.getItem(`room_${roomId}`);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (error) {
                console.error(`Failed to parse room ${roomId}:`, error);
                return null;
            }
        }
        return null;
    } else {
        const roomRef = ref(db, `${ROOMS_REF}/${roomId}`);
        const snapshot = await get(roomRef);
        return snapshot.exists() ? snapshot.val() : null;
    }
};

/**
 * Get room by PIN code
 */
export const getRoomByPin = async (pin: string): Promise<Room | null> => {
    if (isOffline) {
        // Search localStorage for rooms with this PIN
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('room_')) {
                const stored = localStorage.getItem(key);
                if (stored) {
                    try {
                        const room: Room = JSON.parse(stored);
                        if (room.pin === pin) {
                            return room;
                        }
                    } catch { }
                }
            }
        }
        return null;
    } else {
        // Firebase query
        const roomsRef = ref(db, ROOMS_REF);
        const snapshot = await get(roomsRef);

        if (snapshot.exists()) {
            const rooms = snapshot.val();
            for (const roomId in rooms) {
                if (rooms[roomId].pin === pin) {
                    return rooms[roomId];
                }
            }
        }
        return null;
    }
};

/**
 * Save/update room
 */
export const saveRoom = async (room: Room) => {
    const updatedRoom = { ...room, lastUpdated: Date.now() };

    if (isOffline) {
        const lockKey = `room_${room.id}`;
        const acquired = await acquireLock(lockKey);

        if (!acquired) {
            console.error(`Failed to acquire lock for room ${room.id}`);
            return updatedRoom;
        }

        try {
            localStorage.setItem(lockKey, JSON.stringify(updatedRoom));
            // Dispatch event so subscribeToRoom can pick it up
            window.dispatchEvent(new Event(`room-update-${room.id}`));
        } catch (error) {
            console.error("Failed to save room to localStorage:", error);
        } finally {
            releaseLock(lockKey);
        }
    } else {
        const roomRef = ref(db, `${ROOMS_REF}/${room.id}`);
        set(roomRef, updatedRoom).catch(err => console.error("Firebase room update failed", err));
    }

    return updatedRoom;
};

/**
 * Delete room
 */
export const deleteRoom = (roomId: string) => {
    if (isOffline) {
        localStorage.removeItem(`room_${roomId}`);
        window.dispatchEvent(new Event(`room-update-${roomId}`));
    } else {
        const roomRef = ref(db, `${ROOMS_REF}/${roomId}`);
        set(roomRef, null);
    }
};

export const isOnlineMode = () => !isOffline;
