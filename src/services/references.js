import { databases, APPWRITE_CONFIG } from '../config/appwrite';
import { ID, Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

export const createReference = async (title, chapterId, uploadedBy, type, fileId) => {
  try {
    const result = await databases.createDocument(
      DB, C.references, ID.unique(),
      {
        title,
        chapterId,
        uploadedBy,
        type,
        fileId,
      }
    );
    return { success: true, reference: result };
  } catch (error) {
    console.log('createReference error:', error.message);
    return { success: false, error: error.message };
  }
};

export const getReferencesByChapter = async (chapterId) => {
  try {
    const result = await databases.listDocuments(
      DB, C.references,
      [Query.equal('chapterId', chapterId)]
    );
    return { success: true, data: result.documents };
  } catch (error) {
    console.log('getReferencesByChapter error:', error.message);
    return { success: false, error: error.message };
  }
};

export const deleteReference = async (referenceId) => {
  try {
    console.log('Deleting reference:', referenceId);
    await databases.deleteDocument(DB, C.references, referenceId);
    console.log('Reference deleted successfully');
    return { success: true };
  } catch (error) {
    console.log('deleteReference error:', error.code, error.message);
    return { success: false, error: error.message };
  }
};