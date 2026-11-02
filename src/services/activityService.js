import {
  db,
  isFirebaseConfigured,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from './firebase';
import { mockStore } from './mockDataStore';
import { toDate } from '../utils/dateHelpers';

const COLLECTION_NAME = 'dailyActivities';

/**
 * Subscribes to real-time daily activity updates.
 */
export function subscribeActivities(callback, onError) {
  if (!isFirebaseConfigured || !db) {
    return mockStore.subscribe('activities', (data) => {
      // sort desc by activityDateTime
      const sorted = [...data].sort((a, b) => {
        const da = toDate(a.activityDateTime)?.getTime() || 0;
        const db = toDate(b.activityDateTime)?.getTime() || 0;
        return db - da;
      });
      callback(sorted);
    });
  }

  const q = query(collection(db, COLLECTION_NAME), orderBy('activityDateTime', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      callback(items);
    },
    (err) => {
      console.error('Error fetching activities from Firestore:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Log a new activity record
 */
export async function logActivity({
  roomId,
  roomNumber = '',
  bookingId = null,
  guestName = '',
  activityType,
  activityDateTime = new Date().toISOString(),
  description = '',
}) {
  const data = {
    roomId,
    roomNumber,
    bookingId,
    guestName,
    activityType,
    activityDateTime: typeof activityDateTime === 'string' ? activityDateTime : activityDateTime.toISOString(),
    description,
    createdAt: new Date().toISOString(),
  };

  if (!isFirebaseConfigured || !db) {
    const list = mockStore.getActivities();
    const newAct = {
      ...data,
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    };
    mockStore.setActivities([newAct, ...list]);
    return newAct.id;
  }

  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}
