/**
 * Clean Local Reactive Store (localStorage backed)
 * Zero dummy/demo data: starts completely fresh and empty.
 */

const STORAGE_KEYS = {
  ROOMS: 'room_booking_rooms',
  BOOKINGS: 'room_booking_bookings',
  ACTIVITIES: 'room_booking_activities',
  DEMO_CLEARED: 'room_booking_demo_cleaned_v2',
};

// Automatically clear any legacy demo data from localStorage on first run
(function clearLegacyDemoData() {
  try {
    if (!localStorage.getItem(STORAGE_KEYS.DEMO_CLEARED)) {
      localStorage.removeItem(STORAGE_KEYS.ROOMS);
      localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
      localStorage.setItem(STORAGE_KEYS.DEMO_CLEARED, 'true');
    }
  } catch (e) {
    console.error('Error clearing demo data:', e);
  }
})();

const listeners = {
  rooms: new Set(),
  bookings: new Set(),
  activities: new Set(),
};

function readStorage(key, defaultValue = []) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch (e) {
    console.error('Storage read error:', e);
    return defaultValue;
  }
}

function writeStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Storage write error:', e);
  }
}

function notify(collection) {
  const data = readStorage(STORAGE_KEYS[collection.toUpperCase()]);
  listeners[collection].forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('Listener callback error:', e);
    }
  });
}

export const mockStore = {
  getRooms() {
    return readStorage(STORAGE_KEYS.ROOMS, []);
  },

  setRooms(rooms) {
    writeStorage(STORAGE_KEYS.ROOMS, rooms);
    notify('rooms');
  },

  getBookings() {
    return readStorage(STORAGE_KEYS.BOOKINGS, []);
  },

  setBookings(bookings) {
    writeStorage(STORAGE_KEYS.BOOKINGS, bookings);
    notify('bookings');
  },

  getActivities() {
    return [];
  },

  setActivities() {
    // Activities timeline disabled
  },

  clearAllData() {
    writeStorage(STORAGE_KEYS.ROOMS, []);
    writeStorage(STORAGE_KEYS.BOOKINGS, []);
    writeStorage(STORAGE_KEYS.ACTIVITIES, []);
    notify('rooms');
    notify('bookings');
    notify('activities');
  },

  subscribe(collectionName, callback) {
    if (!listeners[collectionName]) return () => {};
    listeners[collectionName].add(callback);
    // initial dispatch
    if (collectionName === 'rooms') callback(this.getRooms());
    if (collectionName === 'bookings') callback(this.getBookings());
    if (collectionName === 'activities') callback([]);

    return () => {
      listeners[collectionName].delete(callback);
    };
  },
};
