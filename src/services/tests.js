import { databases, APPWRITE_CONFIG } from '../config/appwrite';
import { ID, Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

// Test Create చేయి
export const createTest = async (title, classId, subjectId, duration, totalMarks, scheduledAt) => {
  try {
    const result = await databases.createDocument(
      DB, C.tests, ID.unique(),
      {
        title,
        classId,
        subjectId,
        duration,
        totalMarks,
        scheduledAt,
        isActive: true,
      }
    );
    return { success: true, test: result };
  } catch (error) {
    console.log('createTest error:', error.message);
    return { success: false, error: error.message };
  }
};

// Tests తీసుకో
export const getTestsByClass = async (classId) => {
  try {
    const result = await databases.listDocuments(
      DB, C.tests,
      [Query.equal('classId', classId),
       Query.equal('isActive', true)]
    );
    return { success: true, data: result.documents };
  } catch (error) {
    console.log('getTests error:', error.message);
    return { success: false, error: error.message };
  }
};

// Test Delete చేయి
export const deleteTest = async (testId) => {
  try {
    await databases.deleteDocument(DB, C.tests, testId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Submission Create చేయి
export const createSubmission = async (studentId, testId, answers, score) => {
  try {
    const result = await databases.createDocument(
      DB, C.submissions, ID.unique(),
      {
        studentId,
        testId,
        quizId: '',
        answers: JSON.stringify(answers),
        score,
        submittedAt: new Date().toISOString(),
      }
    );
    return { success: true, submission: result };
  } catch (error) {
    console.log('createSubmission error:', error.message);
    return { success: false, error: error.message };
  }
};

// Submissions తీసుకో
export const getSubmissionsByTest = async (testId) => {
  try {
    const result = await databases.listDocuments(
      DB, C.submissions,
      [Query.equal('testId', testId)]
    );
    return { success: true, data: result.documents };
  } catch (error) {
    return { success: false, error: error.message };
  }
};