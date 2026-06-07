import { account, databases, APPWRITE_CONFIG } from '../config/appwrite';
import { ID, Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

// ==================
// EMAIL + PASSWORD LOGIN
// ==================
export const loginWithEmail = async (email, password) => {
  try {
    try { await account.deleteSession('current'); } catch (e) {}
    await account.createEmailPasswordSession(email, password);
    const user = await account.get();
    let role = 'admin';
    try {
      const dbResult = await databases.listDocuments(
        DB, C.users, [Query.equal('$id', user.$id)]
      );
      if (dbResult.documents.length > 0) {
        role = dbResult.documents[0].role;
      } else {
        if (email.includes('teacher')) role = 'teacher';
        else if (email.includes('student')) role = 'student';
        else if (email.includes('parent')) role = 'parent';
      }
    } catch (e) {
      if (email.includes('teacher')) role = 'teacher';
      else if (email.includes('student')) role = 'student';
      else if (email.includes('parent')) role = 'parent';
    }
    return { success: true, role, userId: user.$id };
  } catch (error) {
    console.log('loginWithEmail error:', error.code, error.message);
    return { success: false, error: error.message };
  }
};

// ==================
// EMAIL OTP LOGIN (Student)
// ==================
export const sendEmailOTP = async (email) => {
  try {
    try { await account.deleteSession('current'); } catch (e) {}
    const token = await account.createEmailToken(ID.unique(), email);
    console.log('OTP sent to:', email, 'userId:', token.userId);
    return { success: true, userId: token.userId };
  } catch (error) {
    console.log('sendEmailOTP error:', error.message);
    return { success: false, error: error.message };
  }
};

export const verifyEmailOTP = async (userId, otp) => {
  try {
    const session = await account.createSession(userId, otp);
    console.log('OTP verified:', session.$id);
    return { success: true, session };
  } catch (error) {
    console.log('verifyEmailOTP error:', error.message);
    return { success: false, error: error.message };
  }
};

// ==================
// FORGOT PASSWORD
// Student OTP login తో exactly same గా పని చేస్తుంది
// తేడా: verify అయిన తర్వాత role = 'reset' గా login అవుతుంది
// ==================

// Step 1 — Student sendEmailOTP తో exact same — ఒకే function వాడతాం
// (sendEmailOTP reuse చేయవచ్చు)

// Step 2 — OTP verify చేయి + role తెలుసుకో → login అవు
export const verifyOTPAndLogin = async (userId, otp) => {
  try {
    const session = await account.createSession(userId, otp);
    console.log('Forgot OTP verified, session:', session.$id);

    // DB లో role చూడు
    const user = await account.get();
    let role = 'reset'; // default — app లో password change చేయమని చూపిస్తుంది
    try {
      const dbResult = await databases.listDocuments(
        DB, C.users, [Query.equal('$id', user.$id)]
      );
      if (dbResult.documents.length > 0) {
        // Role తెలిసినా 'reset' గా పంపు — app లో password change screen చూపించాలి
        role = 'reset';
      }
    } catch (e) {}

    return { success: true, role };
  } catch (error) {
    console.log('verifyOTPAndLogin error:', error.message);
    return { success: false, error: error.message };
  }
};

// ==================
// PASSWORD CHANGE (logged in తర్వాత — optional)
// Session active గా ఉన్నప్పుడు పని చేస్తుంది
// ==================
export const changePassword = async (newPassword) => {
  try {
    await account.updatePassword(newPassword);
    console.log('✅ Password changed');
    return { success: true };
  } catch (error) {
    console.log('changePassword error:', error.code, error.message);
    return { success: false, error: error.message };
  }
};

// ==================
// GET CURRENT USER
// ==================
export const getCurrentUser = async () => {
  try {
    const user = await account.get();
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================
// LOGOUT
// ==================
export const logout = async () => {
  try {
    await account.deleteSession('current');
    return { success: true };
  } catch (error) {
    console.log('Logout error:', error.message);
    return { success: false, error: error.message };
  }
};