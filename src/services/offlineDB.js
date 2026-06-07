import * as SQLite from 'expo-sqlite';

let db = null;

// DB తెరువు
const getDB = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('vidyasetu.db');
    await initDB();
  }
  return db;
};

// Tables తయారు చేయి
const initDB = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT,
      content TEXT,
      chapterId TEXT,
      type TEXT,
      savedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      name TEXT,
      subjectId TEXT,
      orderNo INTEGER
    );
  `);
  console.log('Offline DB initialized');
};

// Note save చేయి
export const saveNoteOffline = async (note) => {
  try {
    const database = await getDB();
    await database.runAsync(
      `INSERT OR REPLACE INTO notes (id, title, content, chapterId, type, savedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [note.$id, note.title, note.content, note.chapterId, note.type, new Date().toISOString()]
    );
    return { success: true };
  } catch (error) {
    console.log('saveNoteOffline error:', error.message);
    return { success: false, error: error.message };
  }
};

// Offline notes చదువు
export const getOfflineNotes = async (chapterId) => {
  try {
    const database = await getDB();
    const result = await database.getAllAsync(
      'SELECT * FROM notes WHERE chapterId = ?',
      [chapterId]
    );
    return { success: true, data: result };
  } catch (error) {
    console.log('getOfflineNotes error:', error.message);
    return { success: false, error: error.message };
  }
};

// Note delete చేయి offline లో
export const deleteNoteOffline = async (noteId) => {
  try {
    const database = await getDB();
    await database.runAsync('DELETE FROM notes WHERE id = ?', [noteId]);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// అన్ని offline notes count చేయి
export const getOfflineNotesCount = async () => {
  try {
    const database = await getDB();
    const result = await database.getFirstAsync('SELECT COUNT(*) as count FROM notes');
    return { success: true, count: result.count };
  } catch (error) {
    return { success: false, count: 0 };
  }
};