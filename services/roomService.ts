import { Room, INITIAL_ROOM, RoomStatus } from '../types';

/**
 * Generate a 4-digit PIN code for room
 */
export const generateRoomPin = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Generate unique room ID
 */
export const generateRoomId = (): string => {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a new room
 */
export const createRoom = (moderatorId: string): Room => {
    const roomId = generateRoomId();
    const pin = generateRoomPin();

    return {
        ...INITIAL_ROOM,
        id: roomId,
        pin: pin,
        createdBy: moderatorId,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
    };
};
