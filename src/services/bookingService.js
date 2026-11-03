import {db,isFirebaseConfigured,collection,doc,addDoc,updateDoc,deleteDoc,
  getDocs,getDoc,serverTimestamp,onSnapshot,query,orderBy,runTransaction,} from './firebase';
import { mockStore } from './mockDataStore';
import { checkBookingConflict, validateBookingForm } from '../utils/bookingValidation';
import { BOOKING_STATUSES } from '../utils/availability';
import { logActivity } from './activityService';
import { updateRoom } from './roomService';

const COLLECTION_NAME = 'bookings';

/**
 * Subscribes to real-time bookings updates
 */
export function subscribeBookings(callback, onError) {
  if (!isFirebaseConfigured || !db) {
    return mockStore.subscribe('bookings', (data) => {
      // sort by checkInDateTime asc
      const sorted = [...data].sort((a, b) => {
        const da = new Date(a.checkInDateTime).getTime() || 0;
        const db = new Date(b.checkInDateTime).getTime() || 0;
        return da - db;
      });
      callback(sorted);
    });
  }

  return onSnapshot(
    collection(db, COLLECTION_NAME),
    (snapshot) => {
      const bookings = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        // Normalize checkInDateTime and checkOutDateTime if stored as Firestore Timestamps or strings
        let checkIn = d.checkInDateTime;
        if (checkIn && typeof checkIn.toDate === 'function') {
          checkIn = checkIn.toDate().toISOString();
        }
        let checkOut = d.checkOutDateTime;
        if (checkOut && typeof checkOut.toDate === 'function') {
          checkOut = checkOut.toDate().toISOString();
        }
        return {
          id: docSnap.id,
          ...d,
          checkInDateTime: checkIn,
          checkOutDateTime: checkOut,
        };
      });

      // Sort by checkInDateTime ascending
      bookings.sort((a, b) => {
        const da = new Date(a.checkInDateTime).getTime() || 0;
        const db = new Date(b.checkInDateTime).getTime() || 0;
        return da - db;
      });

      callback(bookings);
    },
    (err) => {
      console.error('Error fetching bookings from Firestore:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Creates a new booking with conflict validation
 */
export async function createBooking(data, roomNumber = '') {
  const validation = validateBookingForm(data);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(firstError);
  }

  const newBookingData = {
    guestName: data.guestName.trim(),
    mobileNumber: data.mobileNumber.trim(),
    roomId: data.roomId,
    durationOption: data.durationOption || '1day',
    durationHours: Number(data.durationHours) || 24,
    durationLabel: data.durationLabel || '1 Day',
    paymentMethod: data.paymentMethod || 'Cash',
    checkInDateTime: typeof data.checkInDateTime === 'string' ? data.checkInDateTime : data.checkInDateTime.toISOString(),
    checkOutDateTime: typeof data.checkOutDateTime === 'string' ? data.checkOutDateTime : data.checkOutDateTime.toISOString(),
    numberOfGuests: Number(data.numberOfGuests) || 1,
    bookingAmount: Number(data.bookingAmount) || 0,
    advanceAmount: Number(data.advanceAmount) || 0,
    notes: data.notes ? data.notes.trim() : '',
    bookingStatus: data.bookingStatus || BOOKING_STATUSES.CONFIRMED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!isFirebaseConfigured || !db) {
    const existing = mockStore.getBookings();
    const conflictCheck = checkBookingConflict({
      roomId: newBookingData.roomId,
      checkInDateTime: newBookingData.checkInDateTime,
      checkOutDateTime: newBookingData.checkOutDateTime,
      existingBookings: existing,
    });

    if (conflictCheck.hasConflict) {
      throw new Error(conflictCheck.message);
    }

    const created = {
      ...newBookingData,
      id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    };

    mockStore.setBookings([...existing, created]);

    await logActivity({
      roomId: created.roomId,
      roomNumber,
      bookingId: created.id,
      guestName: created.guestName,
      activityType: created.bookingStatus === BOOKING_STATUSES.CHECKED_IN ? 'Guest Check-in' : 'Booking Created',
      activityDateTime: created.checkInDateTime,
      description: `Booking for ${created.guestName} (${created.numberOfGuests} guests) confirmed in Room ${roomNumber}`,
    });

    return created;
  }

  // Firestore transaction / conflict validation
  const bookingsRef = collection(db, COLLECTION_NAME);
  const snap = await getDocs(bookingsRef);
  const existingBookings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const conflictCheck = checkBookingConflict({
    roomId: newBookingData.roomId,
    checkInDateTime: newBookingData.checkInDateTime,
    checkOutDateTime: newBookingData.checkOutDateTime,
    existingBookings,
  });

  if (conflictCheck.hasConflict) {
    throw new Error(conflictCheck.message);
  }

  const docRef = await addDoc(bookingsRef, {
    ...newBookingData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await logActivity({
    roomId: newBookingData.roomId,
    roomNumber,
    bookingId: docRef.id,
    guestName: newBookingData.guestName,
    activityType: newBookingData.bookingStatus === BOOKING_STATUSES.CHECKED_IN ? 'Guest Check-in' : 'Booking Created',
    activityDateTime: newBookingData.checkInDateTime,
    description: `Booking for ${newBookingData.guestName} (${newBookingData.numberOfGuests} guests) confirmed in Room ${roomNumber}`,
  });

  return { id: docRef.id, ...newBookingData };
}

/**
 * Updates an existing booking with conflict validation
 */
export async function updateBooking(bookingId, updates, roomNumber = '') {
  if (!bookingId) throw new Error('Booking ID is required');

  const safeUpdates = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (!isFirebaseConfigured || !db) {
    const existing = mockStore.getBookings();
    const current = existing.find((b) => b.id === bookingId);
    if (!current) throw new Error('Booking not found');

    const merged = { ...current, ...safeUpdates };

    // Check conflict if room or dates were changed
    const conflictCheck = checkBookingConflict({
      roomId: merged.roomId,
      checkInDateTime: merged.checkInDateTime,
      checkOutDateTime: merged.checkOutDateTime,
      excludeBookingId: bookingId,
      existingBookings: existing,
    });

    if (conflictCheck.hasConflict) {
      throw new Error(conflictCheck.message);
    }

    const updatedList = existing.map((b) => (b.id === bookingId ? merged : b));
    mockStore.setBookings(updatedList);

    await logActivity({
      roomId: merged.roomId,
      roomNumber,
      bookingId,
      guestName: merged.guestName,
      activityType: 'Booking Updated',
      description: `Booking updated for ${merged.guestName}`,
    });

    return merged;
  }

  // Firestore update with conflict validation
  const snap = await getDocs(collection(db, COLLECTION_NAME));
  const existingBookings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const currentDoc = existingBookings.find((b) => b.id === bookingId);
  if (!currentDoc) throw new Error('Booking not found');

  const merged = { ...currentDoc, ...safeUpdates };

  const conflictCheck = checkBookingConflict({
    roomId: merged.roomId,
    checkInDateTime: merged.checkInDateTime,
    checkOutDateTime: merged.checkOutDateTime,
    excludeBookingId: bookingId,
    existingBookings,
  });

  if (conflictCheck.hasConflict) {
    throw new Error(conflictCheck.message);
  }

  const docRef = doc(db, COLLECTION_NAME, bookingId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  await logActivity({
    roomId: merged.roomId,
    roomNumber,
    bookingId,
    guestName: merged.guestName,
    activityType: 'Booking Updated',
    description: `Booking updated for ${merged.guestName}`,
  });

  return merged;
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId, roomNumber = '', reason = '') {
  if (!bookingId) throw new Error('Booking ID is required');

  if (!isFirebaseConfigured || !db) {
    const existing = mockStore.getBookings();
    const target = existing.find((b) => b.id === bookingId);
    if (!target) throw new Error('Booking not found');

    const updated = existing.map((b) =>
      b.id === bookingId
        ? {
            ...b,
            bookingStatus: BOOKING_STATUSES.CANCELLED,
            cancellationReason: reason,
            updatedAt: new Date().toISOString(),
          }
        : b
    );

    mockStore.setBookings(updated);

    await logActivity({
      roomId: target.roomId,
      roomNumber,
      bookingId,
      guestName: target.guestName,
      activityType: 'Booking Cancelled',
      description: `Booking for ${target.guestName} cancelled${reason ? `: ${reason}` : ''}`,
    });
    return;
  }

  const docRef = doc(db, COLLECTION_NAME, bookingId);
  const snap = await getDoc(docRef);
  const data = snap.data();

  await updateDoc(docRef, {
    bookingStatus: BOOKING_STATUSES.CANCELLED,
    cancellationReason: reason,
    updatedAt: serverTimestamp(),
  });

  await logActivity({
    roomId: data?.roomId || '',
    roomNumber,
    bookingId,
    guestName: data?.guestName || '',
    activityType: 'Booking Cancelled',
    description: `Booking for ${data?.guestName || 'guest'} cancelled${reason ? `: ${reason}` : ''}`,
  });
}

/**
 * Update booking status (e.g. 'Checked In', 'Checked Out')
 * When a guest checks out, the room is automatically transitioned to 'Cleaning' state
 */
export async function updateBookingStatus(bookingId, newStatus, roomNumber = '', roomId = null) {
  if (!bookingId) throw new Error('Booking ID is required');

  const updates = {
    bookingStatus: newStatus,
    updatedAt: new Date().toISOString(),
  };

  if (!isFirebaseConfigured || !db) {
    const existing = mockStore.getBookings();
    const target = existing.find((b) => b.id === bookingId);
    const targetRoomId = roomId || target?.roomId;

    const updated = existing.map((b) => (b.id === bookingId ? { ...b, ...updates } : b));
    mockStore.setBookings(updated);

    // If Checked Out, automatically set room manualStatus to 'Cleaning'
    if (newStatus === BOOKING_STATUSES.CHECKED_OUT && targetRoomId) {
      await updateRoom(targetRoomId, { manualStatus: 'Cleaning' });
    }

    await logActivity({
      roomId: targetRoomId,
      roomNumber,
      bookingId,
      guestName: target?.guestName || '',
      activityType: newStatus === BOOKING_STATUSES.CHECKED_IN ? 'Guest Check-in' : 'Guest Check-out',
      description: `Guest ${target?.guestName || ''} marked as ${newStatus} for Room ${roomNumber}`,
    });
    return;
  }

  const docRef = doc(db, COLLECTION_NAME, bookingId);
  const snap = await getDoc(docRef);
  const data = snap.data();
  const targetRoomId = roomId || data?.roomId;

  await updateDoc(docRef, {
    bookingStatus: newStatus,
    updatedAt: serverTimestamp(),
  });

  // If Checked Out, set room manualStatus to 'Cleaning'
  if (newStatus === BOOKING_STATUSES.CHECKED_OUT && targetRoomId) {
    await updateRoom(targetRoomId, { manualStatus: 'Cleaning' });
  }

  await logActivity({
    roomId: targetRoomId,
    roomNumber,
    bookingId,
    guestName: data?.guestName || '',
    activityType: newStatus === BOOKING_STATUSES.CHECKED_IN ? 'Guest Check-in' : 'Guest Check-out',
    description: `Guest ${data?.guestName || ''} marked as ${newStatus} for Room ${roomNumber}`,
  });
}
