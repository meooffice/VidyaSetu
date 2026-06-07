import { databases, APPWRITE_CONFIG } from '../config/appwrite';
import { Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

// Student Progress తీసుకో
export const getStudentProgress = async (studentId) => {
  try {
    const result = await databases.listDocuments(
      DB, C.submissions,
      [Query.equal('studentId', studentId),
       Query.orderDesc('$createdAt'),
       Query.limit(10)]
    );

    const submissions = result.documents;
    const total = submissions.length;
    const avgScore = total > 0
      ? Math.round(submissions.reduce((sum, s) => sum + (s.score || 0), 0) / total)
      : 0;

    const quizCount = submissions.filter(s => s.quizId && s.quizId !== '').length;
    const testCount = submissions.filter(s => s.testId && s.testId !== '').length;

    // Trend calculate చేయి
    const recent = submissions.slice(0, 5);
    const older = submissions.slice(5);
    const recentAvg = recent.length > 0
      ? Math.round(recent.reduce((sum, s) => sum + (s.score || 0), 0) / recent.length)
      : 0;
    const olderAvg = older.length > 0
      ? Math.round(older.reduce((sum, s) => sum + (s.score || 0), 0) / older.length)
      : 0;
    const trend = recentAvg >= olderAvg ? 'up' : 'down';

    return {
      success: true,
      data: {
        submissions,
        total,
        avgScore,
        quizCount,
        testCount,
        trend,
        recentAvg,
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Class Analytics తీసుకో (Teacher కి)
export const getClassAnalytics = async (classId) => {
  try {
    // All submissions
    const subResult = await databases.listDocuments(DB, C.submissions);
    const submissions = subResult.documents;

    const total = submissions.length;
    const avgScore = total > 0
      ? Math.round(submissions.reduce((sum, s) => sum + (s.score || 0), 0) / total)
      : 0;

    // Grade distribution
    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    submissions.forEach(s => {
      const pct = s.score || 0;
      if (pct >= 90) gradeDistribution.A++;
      else if (pct >= 80) gradeDistribution.A++;
      else if (pct >= 70) gradeDistribution.B++;
      else if (pct >= 60) gradeDistribution.C++;
      else if (pct >= 50) gradeDistribution.D++;
      else gradeDistribution.F++;
    });

    return {
      success: true,
      data: {
        total,
        avgScore,
        gradeDistribution,
        submissions,
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};