import { databases, APPWRITE_CONFIG } from '../config/appwrite';
import { ID, Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

// Doubt Post చేయి
export const postDoubt = async (question, studentId, chapterId) => {
  try {
    const result = await databases.createDocument(
      DB, C.doubts, ID.unique(),
      {
        question,
        studentId,
        chapterId,
        answer: '',
        teacherId: '',
        isApproved: false,
        status: 'pending',
      }
    );
    return { success: true, doubt: result };
  } catch (error) {
    console.log('postDoubt error:', error.message);
    return { success: false, error: error.message };
  }
};

// Chapter Doubts తీసుకో
export const getDoubtsByChapter = async (chapterId) => {
  try {
    const result = await databases.listDocuments(
      DB, C.doubts,
      [Query.equal('chapterId', chapterId),
       Query.equal('isApproved', true)]
    );
    return { success: true, data: result.documents };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// All Doubts తీసుకో (Teacher కి)
export const getAllDoubts = async () => {
  try {
    const result = await databases.listDocuments(
      DB, C.doubts,
      [Query.orderDesc('$createdAt')]
    );
    return { success: true, data: result.documents };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Student Doubts తీసుకో
export const getStudentDoubts = async (studentId) => {
  try {
    const result = await databases.listDocuments(
      DB, C.doubts,
      [Query.equal('studentId', studentId),
       Query.orderDesc('$createdAt')]
    );
    return { success: true, data: result.documents };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Doubt Approve + Answer చేయి
export const approveAndAnswerDoubt = async (doubtId, answer, teacherId) => {
  try {
    const result = await databases.updateDocument(
      DB, C.doubts, doubtId,
      {
        answer,
        teacherId,
        isApproved: true,
        status: 'answered',
      }
    );
    return { success: true, doubt: result };
  } catch (error) {
    console.log('approveDoubt error:', error.message);
    return { success: false, error: error.message };
  }
};

// Doubt Reject చేయి
export const rejectDoubt = async (doubtId) => {
  try {
    const result = await databases.updateDocument(
      DB, C.doubts, doubtId,
      { status: 'rejected', isApproved: false }
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Doubt Delete చేయి
export const deleteDoubt = async (doubtId) => {
  try {
    await databases.deleteDocument(DB, C.doubts, doubtId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};