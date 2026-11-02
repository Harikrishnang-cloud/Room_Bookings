/**
 * Mock Firestore Reactive Store (localStorage backed)
 * Used seamlessly when Firebase config is not yet supplied,
 * or as a robust development/offline fallback.
 */

const STORAGE_KEYS = {
  ROOMS: 'room_booking_rooms',
  BOOKINGS: 'room_booking_bookings',
  ACTIVITIES: 'room_booking_activities',
};

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

// 10 Sample initial rooms
export const INITIAL_ROOMS = [
  {
    id: 'room-101',
    roomNumber: '101',
    roomName: 'Deluxe Studio A',
    description: 'Cozy ground floor studio with king bed and garden view',
    manualStatus: 'Available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'room-102',
    roomNumber: '102',
    roomName: 'Deluxe Studio B',
    description: 'Quiet corner room with queen bed and workspace',
    manualStatus: 'Available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'room-103',
    roomNumber: '103',
    roomName: 'Premium Suite 1',
    description: 'Spacious 1-bedroom suite with private balcony',
    manualStatus: 'Available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'room-104',
    roomNumber: '104',
    roomName: 'Standard Double',
    description: 'Comfortable twin bed layout, ideal for short stays',
    manualStatus: 'Cleaning',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'room-105',
    roomNumber: '105',
    roomName: 'Executive Suite',
    description: 'Luxury executive suite with king bed and city view',
    manualStatus: 'Available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'room-201',
    roomNumber: '201',
    roomName: 'Family Apartment A',
    description: '2-bedroom apartment with full kitchenette',
    manualStatus: 'Available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'room-202',
    roomNumber: '202',
    roomName: 'Family Apartment B',
    description: '2-bedroom apartment with pool view terrace',
    manualStatus: 'Available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'room-203',
    roomNumber: '203',
    roomName: 'Deluxe Queen',
    description: 'Top floor quiet room with mountain view',
    manualStatus: 'Available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'room-204',
    roomNumber: '204',
    roomName: 'Penthouse Loft',
    description: 'Spacious loft with private rooftop access',
    manualStatus: 'Available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'room-205',
    roomNumber: '205',
    roomName: 'Studio Economy',
    description: 'Compact budget-friendly studio with modern shower',
    manualStatus: 'Available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Seed initial sample bookings for today for demonstration
export function getInitialBookings() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 2);
  const tomY = tomorrow.getFullYear();
  const tomM = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const tomD = String(tomorrow.getDate()).padStart(2, '0');
  const tomStr = `${tomY}-${tomM}-${tomD}`;

  return [
    {
      id: 'booking-seed-1',
      guestName: 'Alex Morgan',
      mobileNumber: '+1 555-0192',
      roomId: 'room-101',
      checkInDateTime: `${todayStr}T10:00:00`,
      checkOutDateTime: `${tomStr}T11:00:00`,
      numberOfGuests: 2,
      bookingAmount: 240,
      advanceAmount: 100,
      notes: 'Requested early check-in and extra towels',
      bookingStatus: 'Checked In',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'booking-seed-2',
      guestName: 'Sarah Jenkins',
      mobileNumber: '+1 555-0144',
      roomId: 'room-103',
      checkInDateTime: `${todayStr}T14:00:00`,
      checkOutDateTime: `${tomStr}T12:00:00`,
      numberOfGuests: 1,
      bookingAmount: 180,
      advanceAmount: 180,
      notes: 'Arriving by flight around 1:30 PM',
      bookingStatus: 'Confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function getInitialActivities() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  return [
    {
      id: 'act-1',
      roomId: 'room-101',
      bookingId: 'booking-seed-1',
      roomNumber: '101',
      guestName: 'Alex Morgan',
      activityType: 'Check-in',
      activityDateTime: `${todayStr}T10:00:00`,
      description: 'Guest checked in to Room 101',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'act-2',
      roomId: 'room-104',
      bookingId: null,
      roomNumber: '104',
      guestName: '',
      activityType: 'Cleaning',
      activityDateTime: `${todayStr}T11:30:00`,
      description: 'Room marked for sanitization and cleaning',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'act-3',
      roomId: 'room-103',
      bookingId: 'booking-seed-2',
      roomNumber: '103',
      guestName: 'Sarah Jenkins',
      activityType: 'Upcoming Arrival',
      activityDateTime: `${todayStr}T14:00:00`,
      description: 'Scheduled arrival at 02:00 PM',
      createdAt: new Date().toISOString(),
    },
  ];
}

// Storage helpers
export const mockStore = {
  getRooms() {
    let rooms = readStorage(STORAGE_KEYS.ROOMS, null);
    if (!rooms || rooms.length === 0) {
      rooms = INITIAL_ROOMS;
      writeStorage(STORAGE_KEYS.ROOMS, rooms);
    }
    return rooms;
  },

  setRooms(rooms) {
    writeStorage(STORAGE_KEYS.ROOMS, rooms);
    notify('rooms');
  },

  getBookings() {
    let bookings = readStorage(STORAGE_KEYS.BOOKINGS, null);
    if (!bookings) {
      bookings = getInitialBookings();
      writeStorage(STORAGE_KEYS.BOOKINGS, bookings);
    }
    return bookings;
  },

  setBookings(bookings) {
    writeStorage(STORAGE_KEYS.BOOKINGS, bookings);
    notify('bookings');
  },

  getActivities() {
    let activities = readStorage(STORAGE_KEYS.ACTIVITIES, null);
    if (!activities) {
      activities = getInitialActivities();
      writeStorage(STORAGE_KEYS.ACTIVITIES, activities);
    }
    return activities;
  },

  setActivities(activities) {
    writeStorage(STORAGE_KEYS.ACTIVITIES, activities);
    notify('activities');
  },

  subscribe(collectionName, callback) {
    if (!listeners[collectionName]) return () => {};
    listeners[collectionName].add(callback);
    // initial dispatch
    if (collectionName === 'rooms') callback(this.getRooms());
    if (collectionName === 'bookings') callback(this.getBookings());
    if (collectionName === 'activities') callback(this.getActivities());

    return () => {
      listeners[collectionName].delete(callback);
    };
  },
};
