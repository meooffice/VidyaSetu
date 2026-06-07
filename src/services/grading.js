import { databases, APPWRITE_CONFIG } from '../config/appwrite';
import { ID, Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

// Quiz Auto Grade చేయి
export const gradeQuizSubmission = (quizzes, answers) => {
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  const details = [];

  quizzes.forEach(quiz => {
    const userAnswer = answers[quiz.$id];
    if (!userAnswer) {
      skipped++;
      details.push({
        question: quiz.question,
        userAnswer: 'సమాధానం ఇవ్వలేదు',
        correctAnswer: quiz.answer,
        isCorrect: false,
      });
      return;
    }

    let isCorrect = false;
    if (quiz.type === 'mcq') {
      try {
        const options = JSON.parse(quiz.options);
        const answerIndex = quiz.answer.charCodeAt(0) - 65;
        isCorrect = userAnswer === options[answerIndex];
      } catch { isCorrect = false; }
    } else {
      isCorrect = userAnswer.toLowerCase().trim() ===
                 quiz.answer.toLowerCase().trim();
    }

    if (isCorrect) correct++;
    else wrong++;

    details.push({
      question: quiz.question,
      userAnswer,
      correctAnswer: quiz.answer,
      isCorrect,
      type: quiz.type,
    });
  });

  const total = quizzes.length;
  const score = correct;
  const percentage = Math.round((correct / total) * 100);
  const grade = getGrade(percentage);

  return { correct, wrong, skipped, total, score, percentage, grade, details };
};

// Grade Calculate చేయి
export const getGrade = (percentage) => {
  if (percentage >= 90) return { letter: 'A+', color: '#1b5e20', label: 'అత్యుత్తమం' };
  if (percentage >= 80) return { letter: 'A', color: '#388e3c', label: 'చాలా బాగుంది' };
  if (percentage >= 70) return { letter: 'B', color: '#f57c00', label: 'బాగుంది' };
  if (percentage >= 60) return { letter: 'C', color: '#ff8f00', label: 'సంతోషకరం' };
  if (percentage >= 50) return { letter: 'D', color: '#e65100', label: 'సగటు' };
  return { letter: 'F', color: '#e53935', label: 'మళ్ళీ చదవండి' };
};

// Submission Save చేయి
export const saveQuizSubmission = async (studentId, chapterId, answers, gradeResult) => {
  try {
    const result = await databases.createDocument(
      DB, C.submissions, ID.unique(),
      {
        studentId,
        testId: '',
        quizId: chapterId,
        answers: JSON.stringify(answers),
        score: gradeResult.score,
        submittedAt: new Date().toISOString(),
      }
    );
    return { success: true, submission: result };
  } catch (error) {
    console.log('saveSubmission error:', error.message);
    return { success: false, error: error.message };
  }
};

// Student Submissions తీసుకో
export const getStudentSubmissions = async (studentId) => {
  try {
    const result = await databases.listDocuments(
      DB, C.submissions,
      [Query.equal('studentId', studentId)]
    );
    return { success: true, data: result.documents };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// All Submissions తీసుకో (Teacher కి)
export const getAllSubmissions = async () => {
  try {
    const result = await databases.listDocuments(DB, C.submissions);
    return { success: true, data: result.documents };
  } catch (error) {
    return { success: false, error: error.message };
  }
};