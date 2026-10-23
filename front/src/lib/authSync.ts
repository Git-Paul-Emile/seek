const AUTH_LOGOUT_EVENT = "seek:auth-logout";
const AUTH_LOGOUT_STORAGE_KEY = "seek:auth-logout";

type LogoutListener = () => void;

export function broadcastGlobalLogout() {
  const payload = String(Date.now());

  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT, { detail: payload }));

  try {
    window.localStorage.setItem(AUTH_LOGOUT_STORAGE_KEY, payload);
  } catch {
    // Ignore storage failures in private mode or restricted environments.
  }
}

export function subscribeGlobalLogout(listener: LogoutListener) {
  const handleCustomEvent = () => listener();
  const handleStorage = (event: StorageEvent) => {
    if (event.key === AUTH_LOGOUT_STORAGE_KEY && event.newValue) {
      listener();
    }
  };

  window.addEventListener(AUTH_LOGOUT_EVENT, handleCustomEvent);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(AUTH_LOGOUT_EVENT, handleCustomEvent);
    window.removeEventListener("storage", handleStorage);
  };
}
