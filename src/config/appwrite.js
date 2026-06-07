import { Client, Databases, Account, Storage } from 'appwrite';

const client = new Client();

client
  .setEndpoint('https://sgp.cloud.appwrite.io/v1')
  .setProject('6a1acff90000c03f1bac');

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

export const APPWRITE_CONFIG = {
  databaseId: '6a1bf90f003d8539b1ec',
  buckets: {
    notes: '6a1bf9fc00117daee21e',
    references: '6a1bf9fc00117daee21e', // same bucket!
  },
  collections: {
    schools: 'schools',
    classes: 'classes',
    subjects: 'subjects',
    chapters: 'chapters',
    users: 'users',
    notes: 'notes',
    references: 'references',
    quizzes: 'quizzes',
    tests: 'tests',
    submissions: 'submissions',
    doubts: 'doubts',
    homework: 'homework',
    homeworkStatus: 'homework_status', // ← కొత్తది add చేయి
    messages: 'messages',
    attendance: 'attendance',
    notifications: 'notifications',
  }
};

export { client, account, databases, storage };