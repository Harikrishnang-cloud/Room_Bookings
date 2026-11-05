import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';
import Header from '../components/Header';
import SummaryCards from '../components/SummaryCards';
import RoomGrid from '../components/RoomGrid';
import DailyActivity from '../components/DailyActivity';
import BookingForm from '../components/BookingForm';
import BookingDetailsModal from '../components/BookingDetailsModal';
import RoomDetailsModal from '../components/RoomDetailsModal';
import RoomModal from '../components/RoomModal';
import ConfirmDialog from '../components/ConfirmDialog';
import FirebaseConfigModal from '../components/FirebaseConfigModal';
import { useRooms } from '../hooks/useRooms';
import { useBookings } from '../hooks/useBookings';
import { computeRoomStatus, ROOM_STATUSES, BOOKING_STATUSES, } from '../utils/availability';
import { addRoom, updateRoom, deleteRoom, setRoomManualStatus, } from '../services/roomService';
import { createBooking, updateBooking, cancelBooking, updateBookingStatus, } from '../services/bookingService';

export default function Dashboard() {
  const { rooms, loading: loadingRooms } = useRooms();
  const { bookings, loading: loadingBookings } = useBookings();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [preselectedRoomId, setPreselectedRoomId] = useState(null);
  const [isBookingDetailsOpen, setIsBookingDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isRoomDetailsOpen, setIsRoomDetailsOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [isFirebaseConfigOpen, setIsFirebaseConfigOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    requireReason: false,
    onConfirm: () => { },
  });

  // Automatic 15-second clock tick to update real-time room statuses as time passes
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdated(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Calculate real-time status for all rooms
  const roomStatusMap = useMemo(() => {
    const map = {};
    const now = new Date();
    rooms.forEach((room) => {
      map[room.id] = computeRoomStatus(room, bookings, now);
    });
    return map;
  }, [rooms, bookings, lastUpdated]);

  // Calculate Summary Counts
  const counts = useMemo(() => {
    const res = {
      total: rooms.length,
      available: 0,
      booked: 0,
      cleaning: 0,
      checkedIn: 0,
    };

    rooms.forEach((room) => {
      const s = roomStatusMap[room.id]?.status || ROOM_STATUSES.AVAILABLE;
      if (s === ROOM_STATUSES.AVAILABLE) res.available += 1;
      else if (s === ROOM_STATUSES.BOOKED) res.booked += 1;
      else if (s === ROOM_STATUSES.CLEANING) res.cleaning += 1;
      else if (s === ROOM_STATUSES.CHECKED_IN) res.checkedIn += 1;
    });

    return res;
  }, [rooms, roomStatusMap]);

  // Filter and Search rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const statusData = roomStatusMap[room.id] || { status: ROOM_STATUSES.AVAILABLE };

      // Status filter
      if (filterStatus !== 'ALL') {
        if (statusData.status !== filterStatus) return false;
      }

      // Search query (roomNumber, guestName, mobileNumber, roomName, status, duration)
      if (searchQuery && searchQuery.trim()) {
        const rawQ = searchQuery.toLowerCase().trim();
        const cleanQ = rawQ.replace(/^(room|rm)\s+/i, '');
        const tokens = rawQ.split(/\s+/).filter(Boolean);
        const roomNumberStr = String(room.roomNumber || '').toLowerCase();
        const roomNameStr = String(room.roomName || '').toLowerCase();
        const statusStr = String(statusData.status || '').toLowerCase();
        const activeGuest = String(statusData.activeBooking?.guestName || '').toLowerCase();
        const activePhoneRaw = String(statusData.activeBooking?.mobileNumber || '').toLowerCase();
        const activePhoneDigits = activePhoneRaw.replace(/[^0-9]/g, '');
        const activeDuration = String(statusData.activeBooking?.durationLabel || '').toLowerCase();
        const activePayment = String(statusData.activeBooking?.paymentMethod || '').toLowerCase();
        const roomBookings = bookings.filter(
          (b) => b.roomId === room.id && b.bookingStatus !== BOOKING_STATUSES.CANCELLED);
        const bookingGuests = roomBookings.map((b) => String(b.guestName || '').toLowerCase()).join(' ');
        const bookingPhones = roomBookings.map((b) => String(b.mobileNumber || '').toLowerCase()).join(' ');
        const bookingPhonesDigits = bookingPhones.replace(/[^0-9]/g, '');
        const bookingPayments = roomBookings.map((b) => String(b.paymentMethod || '').toLowerCase()).join(' ');

        const allSearchable = [
          `room ${roomNumberStr}`,
          `rm ${roomNumberStr}`,
          roomNumberStr,
          roomNameStr,
          statusStr,
          activeGuest,
          activePhoneRaw,
          activePhoneDigits,
          activeDuration,
          activePayment,
          bookingGuests,
          bookingPhones,
          bookingPhonesDigits,
          bookingPayments,
        ].join(' ');

        // Direct match check on clean query
        const directMatch =
          roomNumberStr.includes(cleanQ) ||
          roomNameStr.includes(cleanQ) ||
          activeGuest.includes(cleanQ) ||
          activePhoneRaw.includes(cleanQ) ||
          (cleanQ.replace(/[^0-9]/g, '').length >= 3 &&
            (activePhoneDigits.includes(cleanQ.replace(/[^0-9]/g, '')) ||
              bookingPhonesDigits.includes(cleanQ.replace(/[^0-9]/g, ''))));

        if (directMatch) return true;

        // Check if all tokens match anywhere in searchable text
        const allTokensMatch = tokens.every((token) => {
          const cleanToken = token.replace(/^(room|rm)$/i, '');
          if (!cleanToken) return true;
          return allSearchable.includes(token) || allSearchable.includes(cleanToken);
        });

        if (!allTokensMatch) {
          return false;
        }
      }

      return true;
    });
  }, [rooms, roomStatusMap, filterStatus, searchQuery, bookings]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setLastUpdated(new Date());
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Dashboard refreshed');
    }, 400);
  }, []);

  // --- Handlers: Room Operations ---
  const handleOpenAddRoom = () => {
    setEditingRoom(null);
    setIsRoomModalOpen(true);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (formData) => {
    if (editingRoom) {
      await updateRoom(editingRoom.id, formData);
      toast.success(`Room ${formData.roomNumber} updated successfully`);
    } else {
      await addRoom(formData);
      toast.success(`Room ${formData.roomNumber} created successfully`);
    }
    setLastUpdated(new Date());
  };

  const handleDeleteRoom = (room) => {
    setConfirmConfig({
      isOpen: true,
      title: `Delete Room ${room.roomNumber}?`,
      message: 'This will permanently remove the room. Are you sure? (Rooms with active bookings cannot be deleted)',
      variant: 'danger',
      requireReason: false,
      onConfirm: async () => {
        try {
          await deleteRoom(room.id, bookings);
          toast.success(`Room ${room.roomNumber} deleted`);
          setLastUpdated(new Date());
        } catch (err) {
          toast.error(err.message || 'Failed to delete room');
        }
      },
    });
  };

  const handleSetRoomStatus = async (roomId, manualStatus, roomNumber) => {
    try {
      await setRoomManualStatus(roomId, manualStatus, roomNumber);
      toast.success(`Room ${roomNumber} marked as ${manualStatus}`);
      setLastUpdated(new Date());
    } catch (err) {
      toast.error(err.message);
    }
  };

  // --- Handlers: Booking Operations ---
  const handleOpenNewBooking = (preselectedRoom = null) => {
    setEditingBooking(null);
    setPreselectedRoomId(preselectedRoom?.id || null);
    setIsBookingFormOpen(true);
  };

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setPreselectedRoomId(booking.roomId);
    setIsBookingFormOpen(true);
  };

  const handleSaveBooking = async (payload, roomNumber) => {
    if (editingBooking) {
      await updateBooking(editingBooking.id, payload, roomNumber);
      toast.success(`Booking for ${payload.guestName} updated successfully`);
    } else {
      await createBooking(payload, roomNumber);
      toast.success(`Booking created for ${payload.guestName} in Room ${roomNumber}`);
    }
    setLastUpdated(new Date());
  };

  const handleCheckInGuest = (booking, room) => {
    setConfirmConfig({
      isOpen: true,
      title: `Check-in ${booking.guestName}?`,
      message: `Confirm guest check-in for Room ${room?.roomNumber || booking.roomId}.`,
      variant: 'primary',
      confirmText: 'Confirm Check-In',
      requireReason: false,
      onConfirm: async () => {
        try {
          await updateBookingStatus(
            booking.id,
            BOOKING_STATUSES.CHECKED_IN,
            room?.roomNumber || '',
            room?.id || booking.roomId
          );
          toast.success(`Guest ${booking.guestName} checked in to Room ${room?.roomNumber || ''}`);
          setLastUpdated(new Date());
        } catch (err) {
          toast.error(err.message || 'Failed to check in');
        }
      },
    });
  };

  const handleCheckOutGuest = (booking, room) => {
    setConfirmConfig({
      isOpen: true,
      title: `Check-out ${booking.guestName}?`,
      message: `Confirm guest departure for Room ${room?.roomNumber || ''}. The room will automatically be scheduled for cleaning.`,
      variant: 'warning',
      confirmText: 'Confirm Check-Out',
      requireReason: false,
      onConfirm: async () => {
        try {
          await updateBookingStatus(
            booking.id,
            BOOKING_STATUSES.CHECKED_OUT,
            room?.roomNumber || '',
            room?.id || booking.roomId
          );
          toast.success(`Guest checked out. Room ${room?.roomNumber || ''} marked for cleaning.`);
          setLastUpdated(new Date());
        } catch (err) {
          toast.error(err.message || 'Failed to check out');
        }
      },
    });
  };

  const handleCancelBooking = (booking, room) => {
    setConfirmConfig({
      isOpen: true,
      title: `Cancel Booking for ${booking.guestName}?`,
      message: `Are you sure you want to cancel this booking for Room ${room?.roomNumber || ''}? The room will immediately become available for other reservations.`,
      variant: 'danger',
      confirmText: 'Cancel Booking',
      requireReason: true,
      reasonPlaceholder: 'Reason for cancellation (optional)...',
      onConfirm: async (reason) => {
        try {
          await cancelBooking(booking.id, room?.roomNumber || '', reason);
          toast.success(`Booking cancelled for ${booking.guestName}`);
          setLastUpdated(new Date());
        } catch (err) {
          toast.error(err.message || 'Failed to cancel booking');
        }
      },
    });
  };

  const handleSelectBooking = (booking) => {
    setSelectedBooking(booking);
    setIsBookingDetailsOpen(true);
  };

  const handleClickRoom = (room) => {
    setSelectedRoom(room);
    setIsRoomDetailsOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <Header
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        onOpenNewBooking={() => handleOpenNewBooking()}
        onOpenNewRoom={handleOpenAddRoom}
        onOpenFirebaseConfig={() => setIsFirebaseConfigOpen(true)}
        isRefreshing={isRefreshing}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-4 sm:space-y-6 pb-24 sm:pb-8">
        <SummaryCards counts={counts} activeFilter={filterStatus} onSelectFilter={setFilterStatus} />
        <DailyActivity selectedDate={selectedDate} onDateChange={setSelectedDate} rooms={rooms} bookings={bookings} />
        <RoomGrid
          rooms={filteredRooms}
          roomStatusMap={roomStatusMap}
          filterStatus={filterStatus}
          onSelectFilter={setFilterStatus}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClickRoom={handleClickRoom}
          onBookRoom={(r) => handleOpenNewBooking(r)}
          onCheckIn={handleCheckInGuest}
          onCheckOut={handleCheckOutGuest}
          onSetStatus={handleSetRoomStatus}
          onViewBooking={handleSelectBooking}
          onOpenNewRoom={handleOpenAddRoom}
          loading={loadingRooms || loadingBookings}
        />
      </main>

      {/* Mobile Sticky Quick Action Bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3.5 py-2.5 z-40 shadow-lg flex items-center gap-2 pb-safe">
        <button
          type="button"
          onClick={handleOpenAddRoom}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-xl bg-slate-100 text-slate-800 border border-slate-300 active:bg-slate-200 transition-colors min-h-[44px] touch-manipulation"
        >
          <Plus className="w-4 h-4" />
          <span>Add Room</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenNewBooking()}
          className="flex-2 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md shadow-emerald-600/30 transition-all min-h-[44px] touch-manipulation"
        >
          <Plus className="w-4 h-4" />
          <span>New Booking</span>
        </button>
      </div>

      {/* Modals */}
      <BookingForm
        isOpen={isBookingFormOpen}
        onClose={() => setIsBookingFormOpen(false)}
        onSubmit={handleSaveBooking}
        rooms={rooms}
        bookings={bookings}
        initialData={editingBooking}
        preselectedRoomId={preselectedRoomId}
      />

      <BookingDetailsModal
        isOpen={isBookingDetailsOpen}
        onClose={() => setIsBookingDetailsOpen(false)}
        booking={selectedBooking}
        rooms={rooms}
        onEdit={handleEditBooking}
        onCheckIn={handleCheckInGuest}
        onCheckOut={handleCheckOutGuest}
        onCancel={handleCancelBooking}
      />

      <RoomDetailsModal
        isOpen={isRoomDetailsOpen}
        onClose={() => setIsRoomDetailsOpen(false)}
        room={selectedRoom}
        statusData={selectedRoom ? (roomStatusMap[selectedRoom.id] || { status: ROOM_STATUSES.AVAILABLE }) : {}}
        bookings={bookings}
        onBookRoom={(r) => handleOpenNewBooking(r)}
        onEditRoom={handleEditRoom}
        onDeleteRoom={handleDeleteRoom}
        onSetStatus={handleSetRoomStatus}
        onSelectBooking={handleSelectBooking}
      />

      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        onSubmit={handleSaveRoom}
        initialData={editingRoom}
      />

      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((p) => ({ ...p, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        confirmText={confirmConfig.confirmText}
        requireReason={confirmConfig.requireReason}
        reasonPlaceholder={confirmConfig.reasonPlaceholder}
      />

      <FirebaseConfigModal
        isOpen={isFirebaseConfigOpen}
        onClose={() => setIsFirebaseConfigOpen(false)}
      />
    </div>
  );
}
