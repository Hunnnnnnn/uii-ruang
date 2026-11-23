import { User, Room, RoomType, Booking, DamageReport } from '../types';

// Seluruh data dummy telah dihapus dan digantikan 100% integrasi langsung dengan database backend
export const MOCK_USERS: User[] = [];
export const MOCK_ROOM_TYPES: RoomType[] = [];
export const MOCK_FACULTIES: Array<{ id: string; name: string }> = [];
export const MOCK_ROOMS: Room[] = [];
export const PAST_ELIGIBLE_BOOKINGS: Booking[] = [];
export const INITIAL_BOOKINGS: Booking[] = [];
export const INITIAL_DAMAGE_REPORTS: DamageReport[] = [];
