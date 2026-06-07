import { databases, APPWRITE_CONFIG } from '../config/appwrite';
import { ID, Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

// User Create చేయి
export const createUser = async (userId, name, role, schoolId, classId, parentId) => {
  try {
    const result = await databases.createDocument(
      DB, C.users, userId,
      {
        name,
        role,
        schoolId,
        classId: classId || '',
        parentId: parentId || '',
        isActive: true,
        email: '',
        phone: '',
      }
    );
    return { success: true, user: result };
  } catch (error) {
    console.log('createUser error:', error.message);
    return { success: false, error: error.message };
  }
};

// User తీసుకో
export const getUser = async (userId) => {
  try {
    const result = await databases.getDocument(DB, C.users, userId);
    return { success: true, user: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Student యొక్క Parent ID తీసుకో
export const getParentIdByStudent = async (studentId) => {
  try {
    const result = await databases.listDocuments(
      DB, C.users,
      [Query.equal('$id', studentId)]
    );
    if (result.documents.length > 0) {
      return { success: true, parentId: result.documents[0].parentId };
    }
    return { success: false, parentId: null };
  } catch (error) {
    return { success: false, parentId: null };
  }
};

// Class Students తీసుకో
export const getStudentsByClass = async (classId) => {
  try {
    const result = await databases.listDocuments(
      DB, C.users,
      [Query.equal('classId', classId),
       Query.equal('role', 'student')]
    );
    return { success: true, data: result.documents };
  } catch (error) {
    return { success: false, error: error.message };
  }
};