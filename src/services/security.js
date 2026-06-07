import { account, databases, APPWRITE_CONFIG } from '../config/appwrite';
import { ID, Query } from 'appwrite';


const DB = APPWRITE_CONFIG.databaseId;

// Device ID తీసుకో
export const getDeviceId = () => {
  return `web-device-${Date.now()}`;
};

// Current Session Check చేయి
export const checkCurrentSession = async () => {
  try {
    const sessions = await account.listSessions();
    return {
      success: true,
      sessionCount: sessions.sessions.length,
      sessions: sessions.sessions,
    };
  } catch (error) {
    return { success: false, sessionCount: 0, sessions: [] };
  }
};

// Other Sessions Delete చేయి (One Device Login)
export const deleteOtherSessions = async () => {
  try {
    await account.deleteSessions();
    // Current session మళ్ళీ create చేయాలి — ఇది logout చేస్తుంది
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Password Strength Check చేయి
export const checkPasswordStrength = (password) => {
  let strength = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password),
  };

  Object.values(checks).forEach(v => { if (v) strength++; });

  return {
    score: strength,
    checks,
    label: strength <= 2 ? 'Weak' : strength <= 3 ? 'Medium' : 'Strong',
    color: strength <= 2 ? '#e53935' : strength <= 3 ? '#f57c00' : '#388e3c',
  };
};

// Content Watermark తయారు చేయి
export const generateWatermark = (userName, userId) => {
  const date = new Date().toLocaleDateString('te-IN');
  return `${userName} | ${userId?.slice(0, 8)} | ${date}`;
};