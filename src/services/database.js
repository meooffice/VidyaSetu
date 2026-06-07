import { databases, APPWRITE_CONFIG } from '../config/appwrite';
import { Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

// Simple Cache
const cache = {};
const CACHE_TIME = 5 * 60 * 1000;

const getCached = (key) => {
  if (cache[key] && Date.now() - cache[key].time < CACHE_TIME) {
    return cache[key].data;
  }
  return null;
};

const setCache = (key, data) => {
  cache[key] = { data, time: Date.now() };
};

// ==================
// SCHOOLS
// ==================
export const getSchools = async () => {
  const cached = getCached('schools');
  if (cached) return { success: true, data: cached };
  try {
    const result = await databases.listDocuments(DB, C.schools);
    setCache('schools', result.documents);
    return { success: true, data: result.documents };
  } catch (error) {
    console.log('getSchools error:', error.message);
    return { success: false, error: error.message };
  }
};

// ==================
// CLASSES
// ==================
export const getClasses = async (schoolId) => {
  const cacheKey = `classes_${schoolId}`;
  const cached = getCached(cacheKey);
  if (cached) return { success: true, data: cached };
  try {
    const result = await databases.listDocuments(DB, C.classes, [
      Query.equal('schoolId', schoolId)
    ]);
    setCache(cacheKey, result.documents);
    return { success: true, data: result.documents };
  } catch (error) {
    console.log('getClasses error:', error.message);
    return { success: false, error: error.message };
  }
};

// ==================
// SUBJECTS
// ==================
export const getSubjects = async (classId) => {
  const cacheKey = `subjects_${classId}`;
  const cached = getCached(cacheKey);
  if (cached) return { success: true, data: cached };
  try {
    const result = await databases.listDocuments(DB, C.subjects, [
      Query.equal('classId', classId)
    ]);
    setCache(cacheKey, result.documents);
    return { success: true, data: result.documents };
  } catch (error) {
    console.log('getSubjects error:', error.message);
    return { success: false, error: error.message };
  }
};

// ==================
// CHAPTERS
// ==================
export const getChapters = async (subjectId) => {
  const cacheKey = `chapters_${subjectId}`;
  const cached = getCached(cacheKey);
  if (cached) return { success: true, data: cached };
  try {
    const result = await databases.listDocuments(DB, C.chapters, [
      Query.equal('subjectId', subjectId),
      Query.equal('isActive', true),
      Query.orderAsc('orderNo')
    ]);
    setCache(cacheKey, result.documents);
    return { success: true, data: result.documents };
  } catch (error) {
    console.log('getChapters error:', error.message);
    return { success: false, error: error.message };
  }
};

// Cache clear చేయి (data update అయినప్పుడు)
export const clearCache = (key) => {
  if (key) {
    delete cache[key];
  } else {
    Object.keys(cache).forEach(k => delete cache[k]);
  }
};