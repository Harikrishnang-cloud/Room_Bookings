import { useState, useEffect } from 'react';
import { subscribeBookings } from '../services/bookingService';

export function useBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeBookings(
      (data) => {
        setBookings(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message || 'Failed to load bookings');
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  return { bookings, loading, error };
}
