import { databases, APPWRITE_CONFIG } from '../config/appwrite';
import { ID, Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

// Attendance Mark చేయి
export const markAttendance = async (studentId, classId, date, status, teacherId) => {
  try {
    const result = await databases.createDocument(
      DB, C.attendance, ID.unique(),
      {
        studentId,
        classId,
        date,
        status,
        teacherId,
      }
    );
    return { success: true, attendance: result };
  } catch (error) {
    console.log('markAttendance error:', error.message);
    return { success: false, error: error.message };
  }
};

// Student Attendance తీసుకో
export const getStudentAttendance = async (studentId) => {
  try {
    const result = await databases.listDocuments(
      DB, C.attendance,
      [Query.equal('studentId', studentId),
       Query.orderDesc('date'),
       Query.limit(30)]
    );
    return { success: true, data: result.documents };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Class Attendance తీసుకో (Date వారీగా)
export const getClassAttendance = async (classId, date) => {
  try {
    const result = await databases.listDocuments(
      DB, C.attendance,
      [Query.equal('classId', classId),
       Query.equal('date', date)]
    );
    return { success: true, data: result.documents };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Attendance Stats Calculate చేయి
export const calculateAttendanceStats = (attendanceList) => {
  const total = attendanceList.length;
  const present = attendanceList.filter(a => a.status === 'present').length;
  const absent = attendanceList.filter(a => a.status === 'absent').length;
  const late = attendanceList.filter(a => a.status === 'late').length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return { total, present, absent, late, percentage };
};