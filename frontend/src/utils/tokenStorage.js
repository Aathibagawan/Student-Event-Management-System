// Tokens live in localStorage. Trade-off: simple, survives refresh, but readable by any
// script on the page (XSS). Production hardening option: httpOnly cookies set by the backend.
const ACCESS = "ace_access";
const REFRESH = "ace_refresh";
const USER = "ace_user";

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS),
  getRefresh: () => localStorage.getItem(REFRESH),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem(USER));
    } catch {
      return null;
    }
  },
  save({ access, refresh, user }) {
    if (access) localStorage.setItem(ACCESS, access);
    if (refresh) localStorage.setItem(REFRESH, refresh);
    if (user) localStorage.setItem(USER, JSON.stringify(user));
  },
  clear() {
    [ACCESS, REFRESH, USER].forEach((k) => localStorage.removeItem(k));
  },
};
