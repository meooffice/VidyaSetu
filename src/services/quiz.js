import { databases, APPWRITE_CONFIG } from '../config/appwrite';
import { ID, Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

// Quiz Create చేయి
export const createQuiz = async (question, options, answer, type, chapterId, teacherId) => {
  try {
    const result = await databases.createDocument(
      DB, C.quizzes, ID.unique(),
      {
        question,
        options: JSON.stringify(options),
        answer,
        type,
        chapterId,
        teacherId,
      }
    );
    return { success: true, quiz: result };
  } catch (error) {
    console.log('createQuiz error:', error.message);
    return { success: false, error: error.message };
  }
};

// Chapter Quiz లు తీసుకో
export const getQuizzesByChapter = async (chapterId) => {
  try {
    const result = await databases.listDocuments(
      DB, C.quizzes,
      [Query.equal('chapterId', chapterId)]
    );
    return { success: true, data: result.documents };
  } catch (error) {
    console.log('getQuizzes error:', error.message);
    return { success: false, error: error.message };
  }
};

// Quiz Delete చేయి
export const deleteQuiz = async (quizId) => {
  try {
    await databases.deleteDocument(DB, C.quizzes, quizId);
    return { success: true };
  } catch (error) {
    console.log('deleteQuiz error:', error.message);
    return { success: false, error: error.message };
  }
};