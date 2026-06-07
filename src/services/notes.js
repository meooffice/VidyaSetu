import { databases, APPWRITE_CONFIG } from '../config/appwrite';
import { ID, Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

export const createTextNote = async (title, content, chapterId, teacherId) => {
  try {
    const result = await databases.createDocument(
      DB, C.notes, ID.unique(),
      {
        title,
        content,
        chapterId,
        teacherId,
        type: 'text',
        isApproved: true,
        fileId: '',
      }
    );
    return { success: true, note: result };
  } catch (error) {
    console.log('createTextNote error:', error.message);
    return { success: false, error: error.message };
  }
};

export const getNotesByChapter = async (chapterId) => {
  try {
    const result = await databases.listDocuments(
      DB, C.notes,
      [Query.equal('chapterId', chapterId)]
    );
    return { success: true, data: result.documents };
  } catch (error) {
    console.log('getNotesByChapter error:', error.message);
    return { success: false, error: error.message };
  }
};

export const deleteNote = async (noteId) => {
  try {
    console.log('Deleting note:', noteId);
    await databases.deleteDocument(DB, C.notes, noteId);
    console.log('Note deleted successfully');
    return { success: true };
  } catch (error) {
    console.log('deleteNote error:', error.code, error.message);
    return { success: false, error: error.message };
  }
};