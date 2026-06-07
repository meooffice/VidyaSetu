import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Modal
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { account, databases, APPWRITE_CONFIG } from '../../config/appwrite';
import { ID, Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

// ── Simple CSV Parser ────────────────────────────────────────────────────────
const parseCSV = (text) => {
  // Empty lines తీసేయి
  const lines = text.trim().split('\n').filter(l => l.trim());

  if (lines.length < 2) {
    console.log('Not enough lines:', lines.length);
    return [];
  }

  console.log('Header line:', lines[0]);
  console.log('First data line:', lines[1]);

  // Header parse చేయి — BOM మరియు quotes తీసేయి
  const headers = lines[0]
    .split(',')
    .map(h => h.trim()
      .replace(/"/g, '')
      .replace(/\uFEFF/g, '')
      .toLowerCase()
    );

  console.log('Headers found:', headers);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Quoted values handle చేయి
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] || '';
    });

    // student_name లేదా student_email ఉంటేనే add చేయి
    if (obj.student_name || obj.student_email) {
      rows.push(obj);
    }
  }

  console.log('Total valid rows:', rows.length);
  return rows;
};

// ── Result Modal ─────────────────────────────────────────────────────────────
function ResultModal({ visible, results, onClose }) {
  if (!visible) return null;
  const success = results.filter(r => r.status === 'success');
  const failed  = results.filter(r => r.status === 'error');
  return (
    <Modal transparent animationType="slide" visible={visible}>
      <View style={rStyles.overlay}>
        <View style={rStyles.box}>
          <Text style={rStyles.title}>📊 Import Results</Text>
          <View style={rStyles.stats}>
            <View style={[rStyles.stat, { backgroundColor: '#e8f5e9' }]}>
              <Text style={[rStyles.statNum, { color: '#388e3c' }]}>
                {success.length}
              </Text>
              <Text style={rStyles.statLabel}>✅ Success</Text>
            </View>
            <View style={[rStyles.stat, { backgroundColor: '#ffebee' }]}>
              <Text style={[rStyles.statNum, { color: '#e53935' }]}>
                {failed.length}
              </Text>
              <Text style={rStyles.statLabel}>❌ Failed</Text>
            </View>
          </View>
          <ScrollView style={rStyles.list}>
            {results.map((r, i) => (
              <View key={i} style={[rStyles.item,
                r.status === 'success' ? rStyles.itemOk : rStyles.itemErr]}>
                <Text style={rStyles.itemIcon}>
                  {r.status === 'success' ? '✅' : '❌'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={rStyles.itemName}>{r.name}</Text>
                  {r.error ? (
                    <Text style={rStyles.itemError}>{r.error}</Text>
                  ) : (
                    <Text style={rStyles.itemOkText}>
                      Created successfully
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={rStyles.closeBtn} onPress={onClose}>
            <Text style={rStyles.closeBtnText}>సరే, Close చేయి</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BulkUploadScreen({ onBack }) {
  const [csvData,       setCsvData]       = useState([]);
  const [fileName,      setFileName]      = useState('');
  const [loading,       setLoading]       = useState(false);
  const [importing,     setImporting]     = useState(false);
  const [progress,      setProgress]      = useState({ current: 0, total: 0 });
  const [results,       setResults]       = useState([]);
  const [showResults,   setShowResults]   = useState(false);
  const [classes,       setClasses]       = useState([]);
  const [classesLoaded, setClassesLoaded] = useState(false);

  // Classes load చేయి
  const loadClasses = async () => {
    if (classesLoaded) return classes;
    try {
      const schoolResult = await databases.listDocuments(DB, C.schools);
      if (schoolResult.documents.length === 0) return [];
      const classResult = await databases.listDocuments(
        DB, C.classes,
        [Query.equal('schoolId', schoolResult.documents[0].$id)]
      );
      setClasses(classResult.documents);
      setClassesLoaded(true);
      return classResult.documents;
    } catch (e) {
      console.log('loadClasses error:', e.message);
      return [];
    }
  };

  // Class name తో classId వెతుకు — "10-A" → classId
  const findClassId = (classList, classSection) => {
    if (!classSection) return '';
    const normalized = classSection.trim().toLowerCase();
    const found = classList.find(cls => {
      const display = cls.section
        ? `${cls.name} - ${cls.section}`.toLowerCase()
        : cls.name.toLowerCase();
      const display2 = cls.section
        ? `${cls.name}-${cls.section}`.toLowerCase()
        : cls.name.toLowerCase();
      return display === normalized ||
             display2 === normalized ||
             cls.name.toLowerCase() === normalized;
    });
    return found?.$id || '';
  };

  // CSV/Excel File pick చేయి
  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      console.log('File picked:', file.name);
      setFileName(file.name);
      setLoading(true);

      // fetch తో directly చదువు
      const response = await fetch(file.uri);
      let content = await response.text();

      if (!content || content.trim().length === 0) {
        throw new Error('File empty గా ఉంది!');
      }

      // BOM తీసేయి
      content = content.replace(/^\uFEFF/, '');
      content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      console.log('Content length:', content.length);

      const parsed = parseCSV(content);
      console.log('Parsed rows:', parsed.length, parsed);

      if (parsed.length === 0) {
        throw new Error('Data rows కనిపించలేదు!');
      }

      setCsvData([...parsed]); // ← spread operator వాడు — re-render force చేయి
      setLoading(false);

    } catch (e) {
      setLoading(false);
      console.log('File error:', e.message);
      Alert.alert('❌ Error', e.message);
    }
  };

  // Template Download & Share చేయి
  const handleDownloadTemplate = async () => {
    try {
      const templateContent = `student_name,student_email,class_section,parent_name,parent_email,parent_phone
Rahul Kumar,rahul@school.com,10-A,Ravi Kumar,ravi.kumar@gmail.com,9876543210
Priya Sharma,priya@school.com,10-A,Sunita Sharma,sunita.sharma@gmail.com,9876543211
Arjun Reddy,arjun@school.com,10-B,Suresh Reddy,suresh.reddy@gmail.com,9876543212
Swathi Nayak,swathi@school.com,10-B,,,
Kiran Babu,kiran@school.com,10-C,Lakshmi Babu,lakshmi.babu@gmail.com,9876543214`;

      const fileUri = FileSystem.documentDirectory + 'vidyasetu_students_template.csv';

      await FileSystem.writeAsStringAsync(fileUri, templateContent, {
        encoding: 'utf8',
      });

      console.log('Template saved to:', fileUri);

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'VidyaSetu Student Template',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert(
          'Share Available కాదు',
          `File ఇక్కడ save అయింది:\n${fileUri}`
        );
      }
    } catch (e) {
      console.log('Template error:', e.message);
      Alert.alert('Error', e.message);
    }
  };

  // Bulk Import చేయి
  const handleImport = async () => {
    if (csvData.length === 0) {
      Alert.alert('తప్పు', 'ముందు CSV file upload చేయండి!');
      return;
    }

    Alert.alert(
      'Confirm Import',
      `${csvData.length} records import చేయాలా?\nఇది time తీసుకుంటుంది!`,
      [
        { text: 'రద్దు', style: 'cancel' },
        { text: 'Import చేయి', onPress: startImport },
      ]
    );
  };

  const startImport = async () => {
    setImporting(true);
    setProgress({ current: 0, total: csvData.length });

    // Classes load చేయి
    const classList = await loadClasses();
    const importResults = [];

    // School ID తీసుకో
    let schoolId = '';
    try {
      const schools = await databases.listDocuments(DB, C.schools);
      schoolId = schools.documents[0]?.$id || '';
    } catch (e) {}

    // Step 1: Parents create చేయి (students కంటే ముందు)
    const parentMap = {}; // email → $id mapping

    const parentRows = csvData.filter(
      row => row.parent_email && row.parent_email.includes('@')
    );
    const uniqueParents = [];
    const seenParents = new Set();
    parentRows.forEach(row => {
      if (!seenParents.has(row.parent_email)) {
        seenParents.add(row.parent_email);
        uniqueParents.push(row);
      }
    });

    console.log('Unique parents to create:', uniqueParents.length);

    for (let i = 0; i < uniqueParents.length; i++) {
      const row = uniqueParents[i];
      setProgress({ current: i + 1, total: csvData.length });

      if (!row.parent_email || !row.parent_name) continue;

      try {
        // Parent Auth account create చేయి
        const password = 'Parent@1234';
        let parentAuthId;

        try {
          const authUser = await account.create(
            ID.unique(),
            row.parent_email.trim(),
            password,
            row.parent_name.trim()
          );
          parentAuthId = authUser.$id;
          await new Promise(r => setTimeout(r, 400));
        } catch (e) {
          // Already exists అయి ఉంటే DB నుండి తీసుకో
          if (e.code === 409) {
            const existing = await databases.listDocuments(
              DB, C.users,
              [Query.equal('email', row.parent_email.trim())]
            );
            if (existing.documents.length > 0) {
              parentAuthId = existing.documents[0].$id;
              parentMap[row.parent_email.trim()] = parentAuthId;
              continue;
            }
          }
          throw e;
        }

        // Parent DB record
        await databases.createDocument(
          DB, C.users, parentAuthId,
          {
            name:     row.parent_name.trim(),
            email:    row.parent_email.trim(),
            phone:    row.parent_phone?.trim() || '',
            role:     'parent',
            schoolId: schoolId,
            classId:  '',
            parentId: '',
            isActive: true,
          }
        );

        parentMap[row.parent_email.trim()] = parentAuthId;
        await new Promise(r => setTimeout(r, 300));

        importResults.push({
          name:   `👨‍👩‍👧 ${row.parent_name}`,
          status: 'success',
        });
      } catch (e) {
        importResults.push({
          name:  `👨‍👩‍👧 ${row.parent_name} (${row.parent_email})`,
          status: 'error',
          error:  e.message,
        });
      }
    }

    // Step 2: Students create చేయి
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      setProgress({ current: uniqueParents.length + i + 1, total: csvData.length + uniqueParents.length });

      if (!row.student_name || !row.student_email) continue;

      try {
        // Class ID వెతుకు
        const classId = findClassId(classList, row.class_section);

        // Parent ID వెతుకు
        const parentId = row.parent_email
          ? (parentMap[row.parent_email.trim()] || '')
          : '';

        // Student Auth create చేయి
        let studentAuthId;
        try {
          const authUser = await account.create(
            ID.unique(),
            row.student_email.trim(),
            'Student@1234',
            row.student_name.trim()
          );
          studentAuthId = authUser.$id;
          await new Promise(r => setTimeout(r, 400));
        } catch (e) {
          if (e.code === 409) {
            // Already exists
            const existing = await databases.listDocuments(
              DB, C.users,
              [Query.equal('email', row.student_email.trim())]
            );
            if (existing.documents.length > 0) {
              importResults.push({
                name:   `👨‍🎓 ${row.student_name}`,
                status: 'error',
                error:  'Email already exists',
              });
              continue;
            }
          }
          throw e;
        }

        // Student DB record
        await databases.createDocument(
          DB, C.users, studentAuthId,
          {
            name:     row.student_name.trim(),
            email:    row.student_email.trim(),
            phone:    '',
            role:     'student',
            schoolId: schoolId,
            classId:  classId,
            parentId: parentId,
            isActive: true,
          }
        );

        await new Promise(r => setTimeout(r, 300));

        importResults.push({
          name:   `👨‍🎓 ${row.student_name} → ${row.class_section || 'No class'}${parentId ? ' + Parent linked' : ''}`,
          status: 'success',
        });
      } catch (e) {
        importResults.push({
          name:   `👨‍🎓 ${row.student_name} (${row.student_email})`,
          status: 'error',
          error:  e.message,
        });
      }
    }

    setImporting(false);
    setResults(importResults);
    setShowResults(true);
    setCsvData([]);
    setFileName('');
  };

  return (
    <View style={styles.container}>
      <ResultModal
        visible={showResults}
        results={results}
        onClose={() => setShowResults(false)}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← వెనక్కి</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📤 Bulk Upload</Text>
        <Text style={styles.headerSub}>CSV నుండి Students & Parents</Text>
      </View>

      <ScrollView style={styles.content}>

        {/* Instructions */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📋 ఎలా చేయాలి?</Text>
          <Text style={styles.infoText}>
            1. CSV file తయారు చేయి (Excel లో save as CSV){'\n'}
            2. Format: student_name, student_email, class_section, parent_name, parent_email, parent_phone{'\n'}
            3. File upload చేయి → Preview చూడు → Import చేయి{'\n'}
            4. Students కి default password: <Text style={styles.bold}>Student@1234</Text>{'\n'}
            5. Parents కి default password: <Text style={styles.bold}>Parent@1234</Text>
          </Text>
          <TouchableOpacity
            style={styles.templateBtn}
            onPress={handleDownloadTemplate}>
            <Text style={styles.templateBtnText}>
              📥 Template Download / Share చేయి
            </Text>
          </TouchableOpacity>
        </View>

        {/* Upload Section */}
        <View style={styles.uploadBox}>
          <Text style={styles.uploadIcon}>📁</Text>
          <Text style={styles.uploadTitle}>CSV File Upload చేయి</Text>
          <Text style={styles.uploadSub}>
            Excel లో data enter చేసి CSV గా save చేసి upload చేయండి
          </Text>
          {fileName ? (
            <View style={styles.fileChip}>
              <Text style={styles.fileChipText}>📄 {fileName}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={handlePickFile}>
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={styles.uploadBtnText}>
                  {fileName ? '🔄 వేరే File ఎంచుకో' : '📂 File ఎంచుకో'}
                </Text>
            }
          </TouchableOpacity>
        </View>

        {/* Preview */}
        {csvData.length > 0 && (
          <View style={styles.previewBox}>
            <Text style={styles.previewTitle}>
              👀 Preview — {csvData.length} records:
            </Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
                <Text style={[styles.statNum, { color: '#388e3c' }]}>
                  {csvData.filter(r => r.student_email).length}
                </Text>
                <Text style={styles.statLabel}>👨‍🎓 Students</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
                <Text style={[styles.statNum, { color: '#1565c0' }]}>
                  {new Set(
                    csvData
                      .filter(r => r.parent_email)
                      .map(r => r.parent_email)
                  ).size}
                </Text>
                <Text style={styles.statLabel}>👨‍👩‍👧 Parents</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
                <Text style={[styles.statNum, { color: '#f57c00' }]}>
                  {new Set(
                    csvData
                      .filter(r => r.class_section)
                      .map(r => r.class_section)
                  ).size}
                </Text>
                <Text style={styles.statLabel}>📚 Classes</Text>
              </View>
            </View>

            {/* First 5 rows preview */}
            <Text style={styles.previewSubtitle}>మొదటి 5 records:</Text>
            {csvData.slice(0, 5).map((row, i) => (
              <View key={i} style={styles.previewRow}>
                <View style={styles.previewStudent}>
                  <Text style={styles.previewStudentName}>
                    👨‍🎓 {row.student_name}
                  </Text>
                  <Text style={styles.previewStudentEmail}>
                    {row.student_email}
                  </Text>
                </View>
                <View style={styles.previewRight}>
                  {row.class_section ? (
                    <Text style={styles.classBadge}>{row.class_section}</Text>
                  ) : (
                    <Text style={styles.noClass}>No class</Text>
                  )}
                  {row.parent_name ? (
                    <Text style={styles.parentBadge}>
                      👨‍👩‍👧 {row.parent_name}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
            {csvData.length > 5 && (
              <Text style={styles.moreText}>
                ... మరియు {csvData.length - 5} records
              </Text>
            )}

            {/* Import Button */}
            <TouchableOpacity
              style={styles.importBtn}
              onPress={handleImport}>
              <Text style={styles.importBtnText}>
                🚀 {csvData.length} records Import చేయి
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Progress */}
        {importing && (
          <View style={styles.progressBox}>
            <ActivityIndicator color="#e53935" size="large" />
            <Text style={styles.progressText}>
              Import అవుతుంది... {progress.current}/{progress.total}
            </Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, {
                width: progress.total > 0
                  ? `${(progress.current / progress.total) * 100}%`
                  : '0%'
              }]} />
            </View>
            <Text style={styles.progressNote}>
              ⏳ దయచేసి wait చేయండి... app close చేయకండి!
            </Text>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>💡 Tips:</Text>
          <Text style={styles.tipText}>
            • Class section "10-A" గా రాయండి (SchoolSetup లో add చేసినట్టు)
          </Text>
          <Text style={styles.tipText}>
            • Parent లేని students కి parent_email column ని empty వదలండి
          </Text>
          <Text style={styles.tipText}>
            • ఒక్క Parent కి multiple students link చేయవచ్చు (same parent_email)
          </Text>
          <Text style={styles.tipText}>
            • Import తర్వాత students OTP తో login చేయగలరు
          </Text>
          <Text style={styles.tipText}>
            • Parents email+password తో login చేయగలరు
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f5f5f5' },
  header:         { backgroundColor: '#e53935', padding: 20, paddingTop: 50 },
  backBtn:        { marginBottom: 5 },
  backBtnText:    { color: 'white', fontSize: 16, fontFamily: 'SreeKrushnadevaraya' },
  headerTitle:    { fontSize: 22, fontWeight: 'bold', color: 'white', fontFamily: 'SreeKrushnadevaraya' },
  headerSub:      { fontSize: 14, color: '#ffcdd2', fontFamily: 'BalooTammudu2' },
  content:        { flex: 1, padding: 15 },

  infoBox: {
    backgroundColor: '#e3f2fd', borderRadius: 12, padding: 15,
    marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#1565c0',
  },
  infoTitle:      { fontSize: 16, fontWeight: 'bold', color: '#0d47a1', fontFamily: 'SreeKrushnadevaraya', marginBottom: 8 },
  infoText:       { fontSize: 13, color: '#1565c0', fontFamily: 'SreeKrushnadevaraya', lineHeight: 22 },
  bold:           { fontWeight: 'bold' },
  templateBtn:    { backgroundColor: '#1565c0', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  templateBtnText:{ color: 'white', fontSize: 14, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },

  uploadBox: {
    backgroundColor: 'white', borderRadius: 15, padding: 25,
    alignItems: 'center', marginBottom: 15, elevation: 2,
    borderWidth: 2, borderColor: '#e0e0e0', borderStyle: 'dashed',
  },
  uploadIcon:     { fontSize: 50, marginBottom: 10 },
  uploadTitle:    { fontSize: 18, fontWeight: 'bold', color: '#333', fontFamily: 'SreeKrushnadevaraya', marginBottom: 5 },
  uploadSub:      { fontSize: 13, color: '#666', fontFamily: 'SreeKrushnadevaraya', textAlign: 'center', marginBottom: 15 },
  fileChip: {
    backgroundColor: '#e8f5e9', borderRadius: 20,
    paddingHorizontal: 15, paddingVertical: 6, marginBottom: 10,
  },
  fileChipText:   { fontSize: 13, color: '#388e3c', fontFamily: 'BalooTammudu2' },
  uploadBtn: {
    backgroundColor: '#e53935', paddingHorizontal: 30,
    paddingVertical: 12, borderRadius: 25,
  },
  uploadBtnText:  { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },

  previewBox:     { backgroundColor: 'white', borderRadius: 15, padding: 15, marginBottom: 15, elevation: 2 },
  previewTitle:   { fontSize: 16, fontWeight: 'bold', color: '#333', fontFamily: 'SreeKrushnadevaraya', marginBottom: 12 },
  statsRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statCard:       { width: '31%', borderRadius: 10, padding: 10, alignItems: 'center' },
  statNum:        { fontSize: 24, fontWeight: 'bold', fontFamily: 'BalooTammudu2' },
  statLabel:      { fontSize: 11, color: '#666', fontFamily: 'SreeKrushnadevaraya', textAlign: 'center' },
  previewSubtitle:{ fontSize: 14, color: '#666', fontFamily: 'SreeKrushnadevaraya', marginBottom: 8 },
  previewRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  previewStudent: { flex: 1 },
  previewStudentName: { fontSize: 14, fontWeight: 'bold', color: '#333', fontFamily: 'SreeKrushnadevaraya' },
  previewStudentEmail:{ fontSize: 11, color: '#888', fontFamily: 'BalooTammudu2' },
  previewRight:   { alignItems: 'flex-end' },
  classBadge: {
    backgroundColor: '#e8f5e9', color: '#388e3c',
    fontSize: 12, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 10, fontFamily: 'SreeKrushnadevaraya', marginBottom: 3,
  },
  noClass:        { fontSize: 11, color: '#bbb', fontFamily: 'SreeKrushnadevaraya' },
  parentBadge:    { fontSize: 11, color: '#1565c0', fontFamily: 'SreeKrushnadevaraya' },
  moreText:       { fontSize: 13, color: '#999', fontFamily: 'SreeKrushnadevaraya', textAlign: 'center', marginTop: 8 },
  importBtn: {
    backgroundColor: '#388e3c', padding: 15, borderRadius: 10,
    alignItems: 'center', marginTop: 15,
  },
  importBtnText:  { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },

  progressBox: {
    backgroundColor: 'white', borderRadius: 15, padding: 25,
    alignItems: 'center', marginBottom: 15, elevation: 2,
  },
  progressText:   { fontSize: 16, color: '#333', fontFamily: 'SreeKrushnadevaraya', marginTop: 12, marginBottom: 10 },
  progressBarBg: {
    width: '100%', height: 8, backgroundColor: '#e0e0e0',
    borderRadius: 4, marginBottom: 10,
  },
  progressBarFill:{ height: 8, backgroundColor: '#e53935', borderRadius: 4 },
  progressNote:   { fontSize: 13, color: '#f57c00', fontFamily: 'SreeKrushnadevaraya' },

  tipsBox: {
    backgroundColor: '#fff8e1', borderRadius: 12, padding: 15,
    marginBottom: 30, borderLeftWidth: 3, borderLeftColor: '#f57c00',
  },
  tipsTitle:      { fontSize: 15, fontWeight: 'bold', color: '#e65100', fontFamily: 'SreeKrushnadevaraya', marginBottom: 8 },
  tipText:        { fontSize: 13, color: '#555', fontFamily: 'SreeKrushnadevaraya', marginBottom: 5, lineHeight: 20 },
});

const rStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', padding: 20,
  },
  box: {
    backgroundColor: 'white', borderRadius: 15,
    padding: 20, maxHeight: '80%', elevation: 5,
  },
  title:          { fontSize: 20, fontWeight: 'bold', color: '#333', fontFamily: 'SreeKrushnadevaraya', textAlign: 'center', marginBottom: 15 },
  stats:          { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
  stat:           { borderRadius: 10, padding: 12, alignItems: 'center', width: '40%' },
  statNum:        { fontSize: 28, fontWeight: 'bold', fontFamily: 'BalooTammudu2' },
  statLabel:      { fontSize: 12, color: '#666', fontFamily: 'SreeKrushnadevaraya' },
  list:           { maxHeight: 300 },
  item: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 8, borderRadius: 8, marginBottom: 6,
  },
  itemOk:         { backgroundColor: '#f1f8e9' },
  itemErr:        { backgroundColor: '#ffebee' },
  itemIcon:       { fontSize: 16, marginRight: 8, marginTop: 2 },
  itemName:       { fontSize: 14, color: '#333', fontFamily: 'SreeKrushnadevaraya', flex: 1 },
  itemError:      { fontSize: 12, color: '#e53935', fontFamily: 'BalooTammudu2', marginTop: 2 },
  itemOkText:     { fontSize: 12, color: '#388e3c', fontFamily: 'BalooTammudu2', marginTop: 2 },
  closeBtn: {
    backgroundColor: '#e53935', padding: 14,
    borderRadius: 10, alignItems: 'center', marginTop: 15,
  },
  closeBtnText:   { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
});