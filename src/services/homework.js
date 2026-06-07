import { databases, APPWRITE_CONFIG } from '../config/appwrite';
import { ID, Query } from 'appwrite';
import { createNotification } from './notifications';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

// ==================
// Homework Create (Teacher)
// ==================
export const createHomework = async (
  title, description, classId, subjectId, teacherId, dueDate
) => {
  try {
    const result = await databases.createDocument(
      DB, C.homework, ID.unique(),
      {
        title,
        description,
        classId,
        subjectId,
        teacherId,
        dueDate,
        fileId: '',
        studentStatus: 'pending',
        parentStatus: 'pending',
        parentConfirmedAt: '',
        studentId: '',
      }
    );
    return { success: true, homework: result };
  } catch (error) {
    console.log('createHomework error:', error.message);
    return { success: false, error: error.message };
  }
};

// ==================
// Class Homework తీసుకో (Teacher)
// ==================
export const getHomeworkByClass = async (classId) => {
  try {
    const result = await databases.listDocuments(
      DB, C.homework,
      [Query.equal('classId', classId),
       Query.orderDesc('$createdAt'),
       Query.limit(50)]
    );
    return { success: true, data: result.documents };
  } catch (error) {
    console.log('getHomeworkByClass error:', error.message);
    return { success: false, error: error.message };
  }
};

// ==================
// Student Homework — homework_status table వాడి status తీసుకో
// ==================
export const getHomeworkForStudent = async (classId, studentId) => {
  try {
    // 1. Class homework తీసుకో
    const hwResult = await databases.listDocuments(
      DB, C.homework,
      [Query.equal('classId', classId),
       Query.orderDesc('$createdAt'),
       Query.limit(50)]
    );

    if (hwResult.documents.length === 0) {
      return { success: true, data: [] };
    }

    await new Promise(r => setTimeout(r, 300));

    // 2. ఈ student యొక్క status records తీసుకో
    const statusResult = await databases.listDocuments(
      DB, C.homeworkStatus,
      [Query.equal('studentId', studentId),
       Query.limit(100)]
    );

    // status map తయారు చేయి — homeworkId → status
    const statusMap = {};
    statusResult.documents.forEach(s => {
      statusMap[s.homeworkId] = s;
    });

    // 3. Merge చేయి
    const merged = hwResult.documents.map(hw => {
      const myStatus = statusMap[hw.$id];
      return {
        ...hw,
        myStudentStatus: myStatus?.status === 'done' ||
                         myStatus?.status === 'confirmed' ||
                         myStatus?.status === 'rejected' ? 'done' : 'pending',
        myParentStatus: myStatus?.status === 'confirmed' ? 'confirmed'
                      : myStatus?.status === 'rejected'  ? 'rejected'
                      : myStatus?.status === 'done'      ? 'pending'
                      : 'pending',
        statusDocId: myStatus?.$id || null,
      };
    });

    return { success: true, data: merged };
  } catch (error) {
    console.log('getHomeworkForStudent error:', error.message);
    return { success: false, error: error.message };
  }
};

// ==================
// Student Done చేయి
// ==================
export const markStudentDone = async (
  homeworkId, studentId, studentName, parentId, teacherId = ''
) => {
  try {
    // Existing status record ఉందా?
    const existing = await databases.listDocuments(
      DB, C.homeworkStatus,
      [Query.equal('homeworkId', homeworkId),
       Query.equal('studentId', studentId)]
    );

    if (existing.documents.length > 0) {
      // Update existing
      await databases.updateDocument(
        DB, C.homeworkStatus, existing.documents[0].$id,
        { status: 'done' }
      );
    } else {
      // Create new
      await databases.createDocument(
        DB, C.homeworkStatus, ID.unique(),
        {
          homeworkId,
          studentId,
          parentId: parentId || '',
          status: 'done',
          teacherId: teacherId || '',
          confirmedAt: '',
        }
      );
    }

    // Parent కి notification పంపు
    if (parentId && parentId !== '') {
      await createNotification(
        parentId,
        '📋 Homework పూర్తి చేశారు!',
        `${studentName} homework పూర్తి చేశారు. Confirm చేయండి!`,
        'homework'
      );
    }

    return { success: true };
  } catch (error) {
    console.log('markStudentDone error:', error.message);
    return { success: false, error: error.message };
  }
};

// ==================
// Parent Confirm చేయి
// ==================
export const parentConfirmHomework = async (
  statusDocId, confirmed, teacherId = ''
) => {
  try {
    const newStatus = confirmed ? 'confirmed' : 'rejected';

    await databases.updateDocument(
      DB, C.homeworkStatus, statusDocId,
      {
        status: newStatus,
        confirmedAt: new Date().toISOString(),
      }
    );

    // Teacher కి notification పంపు
    if (teacherId && teacherId !== '') {
      await createNotification(
        teacherId,
        confirmed ? '✅ Homework Confirmed!' : '❌ Homework Rejected!',
        `Parent homework ${confirmed ? 'confirm' : 'reject'} చేశారు`,
        'homework'
      );
    }

    return { success: true };
  } catch (error) {
    console.log('parentConfirmHomework error:', error.message);
    return { success: false, error: error.message };
  }
};

// ==================
// Parent కి pending confirmation తీసుకో
// ==================
export const getPendingConfirmations = async (studentId) => {
  try {
    const result = await databases.listDocuments(
      DB, C.homeworkStatus,
      [Query.equal('studentId', studentId),
       Query.equal('status', 'done'),
       Query.limit(50)]
    );
    return { success: true, data: result.documents };
  } catch (error) {
    console.log('getPendingConfirmations error:', error.message);
    return { success: false, data: [] };
  }
};

// ==================
// All Homework (Teacher)
// ==================
export const getAllHomework = async () => {
  try {
    const result = await databases.listDocuments(
      DB, C.homework,
      [Query.orderDesc('$createdAt')]
    );
    return { success: true, data: result.documents };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================
// Delete Homework
// ==================
export const deleteHomework = async (homeworkId) => {
  try {
    await databases.deleteDocument(DB, C.homework, homeworkId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};