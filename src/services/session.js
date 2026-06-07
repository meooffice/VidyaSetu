import { account } from '../config/appwrite';
import { createNotification } from './notifications';

let sessionTimer = null;
let warningTimer = null;
let sessionStartTime = null;

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 నిమిషాలు
const WARNING_TIME = 25 * 60 * 1000;    // 25 నిమిషాలకు warning

// Session Start చేయి
export const startSession = (onTimeout, onWarning) => {
  sessionStartTime = new Date();
  clearTimers();

  // 25 నిమిషాలకు warning
  warningTimer = setTimeout(() => {
    if (onWarning) onWarning();
  }, WARNING_TIME);

  // 30 నిమిషాలకు auto logout
  sessionTimer = setTimeout(async () => {
    await autoLogout(onTimeout);
  }, SESSION_TIMEOUT);

  console.log('Session started:', sessionStartTime);
};

// Session Reset చేయి (activity వచ్చినప్పుడు)
export const resetSession = (onTimeout, onWarning) => {
  startSession(onTimeout, onWarning);
};

// Auto Logout
export const autoLogout = async (onTimeout) => {
  clearTimers();
  try {
    await account.deleteSession('current');
  } catch (e) {}
  if (onTimeout) onTimeout();
  console.log('Auto logged out due to inactivity');
};

// Timers Clear చేయి
export const clearTimers = () => {
  if (sessionTimer) clearTimeout(sessionTimer);
  if (warningTimer) clearTimeout(warningTimer);
  sessionTimer = null;
  warningTimer = null;
};

// Session Duration తీసుకో
export const getSessionDuration = () => {
  if (!sessionStartTime) return 0;
  return Math.floor((new Date() - sessionStartTime) / 1000 / 60);
};