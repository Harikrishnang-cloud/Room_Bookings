import {
  db,
  isFirebaseConfigured,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from './firebase';
import { mockStore } from './mockDataStore';
import { logActivity } from './activityService';

const COLLECTION_NAME = 'rooms';

/**
 * Subscribes to real-time rooms updates
 */
export function subscribeRooms(callback, onError) {
  if (!isFirebaseConfigured || !db) {
    return mockStore.subscribe('rooms', (data) => {
      // sort by roomNumber naturally
      const sorted = [...data].sort((a, b) =>
        a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true })
      );
      callback(sorted);
    });
  }

  const q = query(collection(db, COLLECTION_NAME), orderBy('roomNumber', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const rooms = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      callback(rooms);
    },
    (err) => {
      console.error('Error fetching rooms from Firestore:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Add a new room
 */
export async function addRoom({ roomNumber, roomName = '', description = '' }) {
  if (!roomNumber || !roomNumber.trim()) {
    throw new Error('Room number is required');
  }

  const newRoomData = {
    roomNumber: roomNumber.trim(),
    roomName: roomName.trim(),
    description: description.trim(),
    manualStatus: 'Available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!isFirebaseConfigured || !db) {
    const rooms = mockStore.getRooms();
    // Check if room number already exists
    if (rooms.some((r) => r.roomNumber.toLowerCase() === newRoomData.roomNumber.toLowerCase())) {
      throw new Error(`Room ${newRoomData.roomNumber} already exists`);
    }
    const created = {
      ...newRoomData,
      id: `room-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    mockStore.setRooms([...rooms, created]);
    await logActivity({
      roomId: created.id,
      roomNumber: created.roomNumber,
      activityType: 'Room Created',
      description: `Room ${created.roomNumber} created`,
    });
    return created;
  }

  // Firestore duplicate check
  const roomsSnap = await getDocs(collection(db, COLLECTION_NAME));
  const exists = roomsSnap.docs.some(
    (d) => d.data().roomNumber?.toLowerCase() === newRoomData.roomNumber.toLowerCase()
  );
  if (exists) {
    throw new Error(`Room ${newRoomData.roomNumber} already exists`);
  }

  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...newRoomData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await logActivity({
    roomId: docRef.id,
    roomNumber: newRoomData.roomNumber,
    activityType: 'Room Created',
    description: `Room ${newRoomData.roomNumber} created`,
  });

  return { id: docRef.id, ...newRoomData };
}

/**
 * Update room info
 */
export async function updateRoom(roomId, updates) {
  if (!roomId) throw new Error('Room ID is required');

  const safeUpdates = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (!isFirebaseConfigured || !db) {
    const rooms = mockStore.getRooms();
    const updated = rooms.map((r) => (r.id === roomId ? { ...r, ...safeUpdates } : r));
    mockStore.setRooms(updated);
    return;
  }

  const docRef = doc(db, COLLECTION_NAME, roomId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Change room manual status (e.g., 'Cleaning' or 'Available')
 */
export async function setRoomManualStatus(roomId, manualStatus, roomNumber = '') {
  await updateRoom(roomId, { manualStatus });
  await logActivity({
    roomId,
    roomNumber,
    activityType: manualStatus === 'Cleaning' ? 'Cleaning' : 'Status Changed',
    description: `Room ${roomNumber || ''} marked as ${manualStatus}`,
  });
}

/**
 * Delete a room (only if no active booking exists)
 */
export async function deleteRoom(roomId, existingBookings = []) {
  if (!roomId) throw new Error('Room ID is required');

  const hasActiveBooking = existingBookings.some(
    (b) => b.roomId === roomId && (b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Checked In')
  );

  if (hasActiveBooking) {
    throw new Error('Cannot delete a room that has active or upcoming confirmed bookings');
  }

  if (!isFirebaseConfigured || !db) {
    const rooms = mockStore.getRooms();
    const filtered = rooms.filter((r) => r.id !== roomId);
    mockStore.setRooms(filtered);
    return;
  }

  await deleteDoc(doc(db, COLLECTION_NAME, roomId));
}
