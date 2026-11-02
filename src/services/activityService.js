/**
 * Activity Service (Timeline removed per user request)
 * Retains safe no-op stubs so existing calls continue functioning smoothly.
 */

export function subscribeActivities(callback) {
  if (typeof callback === 'function') {
    callback([]);
  }
  return () => {};
}

export async function logActivity() {
  // Activity timeline logging disabled
  return null;
}
