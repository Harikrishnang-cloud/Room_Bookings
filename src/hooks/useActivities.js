import { useState, useEffect } from 'react';
import { subscribeActivities } from '../services/activityService';

export function useActivities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeActivities(
      (data) => {
        setActivities(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message || 'Failed to load activities');
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  return { activities, loading, error };
}
