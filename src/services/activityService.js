

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
