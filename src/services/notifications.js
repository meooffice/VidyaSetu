import { databases, APPWRITE_CONFIG } from '../config/appwrite';
import { ID, Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

// Notification Create చేయి
export const createNotification = async (userId, title, body, type) => {
  try {
    const result = await databases.createDocument(
      DB, C.notifications, ID.unique(),
      {
        userId,
        title,
        body,
        type,
        isRead: false,
        createdAt: new Date().toISOString(),
      }
    );
    return { success: true, notification: result };
  } catch (error) {
    console.log('createNotification error:', error.message);
    return { success: false, error: error.message };
  }
};

// User Notifications తీసుకో
export const getUserNotifications = async (userId) => {
  try {
    console.log('Loading notifications for:', userId); // ← add చేయి
    const result = await databases.listDocuments(
      DB, C.notifications,
      [Query.equal('userId', userId),
       Query.orderDesc('createdAt'),
       Query.limit(20)]
    );
    console.log('Notifications found:', result.total); // ← add చేయి
    return { success: true, data: result.documents };
  } catch (error) {
    console.log('Notifications error:', error.message); // ← add చేయి
    return { success: false, error: error.message };
  }
};
// Notification Read చేయి
export const markNotificationRead = async (notificationId) => {
  try {
    await databases.updateDocument(
      DB, C.notifications, notificationId,
      { isRead: true }
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// All Notifications Read చేయి
export const markAllRead = async (userId) => {
  try {
    const result = await getUserNotifications(userId);
    if (result.success) {
      for (const notif of result.data) {
        if (!notif.isRead) {
          await markNotificationRead(notif.$id);
        }
      }
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Unread Count తీసుకో
export const getUnreadCount = async (userId) => {
  try {
    const result = await databases.listDocuments(
      DB, C.notifications,
      [Query.equal('userId', userId),
       Query.equal('isRead', false)]
    );
    return { success: true, count: result.total };
  } catch (error) {
    return { success: false, count: 0 };
  }
};