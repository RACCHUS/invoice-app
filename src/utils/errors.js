// Turns Firebase/network errors into a message the user can act on.
export function friendlyError(action, error) {
  const code = String(error?.code || '').replace(/^firestore\//, '');
  const reasons = {
    'permission-denied': "you don't have permission. It may have already been deleted, or your sign-in expired. Refresh the page or sign in again",
    unauthenticated: 'you are signed out. Sign in again and retry',
    unavailable: "the server couldn't be reached. Check your internet connection and try again",
    'deadline-exceeded': 'the request timed out. Check your internet connection and try again',
    'not-found': 'it no longer exists. Refresh the page'
  };
  const reason = reasons[code] || String(error?.message || '').trim().replace(/\.+$/, '') || 'an unexpected error occurred';
  return `Couldn't ${action}: ${reason}.`;
}
