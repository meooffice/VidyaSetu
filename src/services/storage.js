import { storage, APPWRITE_CONFIG } from '../config/appwrite';
import { ID } from 'appwrite';

// ==================
// FILE UPLOAD
// ==================
export const uploadFile = async (file, bucketId) => {
  try {
    const result = await storage.createFile(
      bucketId,
      ID.unique(),
      file
    );
    return { success: true, fileId: result.$id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================
// FILE URL GET
// ==================
export const getFileUrl = (fileId, bucketId) => {
  try {
    const url = storage.getFileView(bucketId, fileId);
    return url;
  } catch (error) {
    return null;
  }
};

// ==================
// FILE DELETE
// ==================
export const deleteFile = async (fileId, bucketId) => {
  try {
    await storage.deleteFile(bucketId, fileId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};