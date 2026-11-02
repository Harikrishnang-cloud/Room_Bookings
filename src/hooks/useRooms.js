import { useState, useEffect, useCallback } from 'react';
import { subscribeRooms, initializeSampleRooms } from '../services/roomService';

export function useRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeRooms(
      (data) => {
        setRooms(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message || 'Failed to load rooms');
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleInitSamples = useCallback(async () => {
    try {
      setLoading(true);
      await initializeSampleRooms();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { rooms, loading, error, initializeSampleRooms: handleInitSamples };
}
