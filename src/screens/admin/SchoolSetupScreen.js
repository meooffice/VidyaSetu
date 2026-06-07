import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator,
  Alert, Modal
} from 'react-native';
import { databases, APPWRITE_CONFIG } from '../../config/appwrite';
import { ID, Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

export default function SchoolSetupScreen({ onBack }) {
  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('school');
  const [saving, setSaving] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Confirm Modal
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    message: '',
    onConfirm: null,
  });

  // School form
  const [schoolName, setSchoolName] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('ఆంధ్రప్రదేశ్');
  const [medium, setMedium] = useState('telugu');

  // Class form
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('A');

  // Subject form
  const [subjectName, setSubjectName] = useState('');

  // Chapter form
  const [chapterName, setChapterName] = useState('');
  const [chapterOrder, setChapterOrder] = useState('1');

  const showAlert = (message) => {
    Alert.alert('సందేశం', message, [{ text: 'సరే', style: 'default' }]);
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmModal({ visible: true, message, onConfirm });
  };

  const handleConfirmYes = () => {
    const fn = confirmModal.onConfirm;
    setConfirmModal({ visible: false, message: '', onConfirm: null });
    if (fn) fn();
  };

  const handleConfirmNo = () => {
    setConfirmModal({ visible: false, message: '', onConfirm: null });
  };

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    setLoading(true);
    try {
      const result = await databases.listDocuments(DB, C.schools);
      setSchools(result.documents);
      if (result.documents.length > 0) {
        setSelectedSchool(result.documents[0]);
        loadClasses(result.documents[0].$id);
      }
    } catch (e) {
      console.log('loadSchools error:', e.message);
    }
    setLoading(false);
  };

  const loadClasses = async (schoolId) => {
    try {
      const result = await databases.listDocuments(
        DB, C.classes,
        [Query.equal('schoolId', schoolId)]
      );
      setClasses(result.documents);
    } catch (e) {
      console.log('loadClasses error:', e.message);
    }
  };

  const loadSubjects = async (classId) => {
    try {
      const result = await databases.listDocuments(
        DB, C.subjects,
        [Query.equal('classId', classId)]
      );
      setSubjects(result.documents);
    } catch (e) {
      console.log('loadSubjects error:', e.message);
    }
  };

  const loadChapters = async (subjectId) => {
    try {
      const result = await databases.listDocuments(
        DB, C.chapters,
        [Query.equal('subjectId', subjectId),
         Query.orderAsc('orderNo')]
      );
      setChapters(result.documents);
    } catch (e) {
      console.log('loadChapters error:', e.message);
    }
  };

  const handleAddSchool = async () => {
    if (!schoolName || !district) {
      showAlert('పాఠశాల పేరు మరియు జిల్లా రాయండి!');
      return;
    }
    setSaving(true);
    try {
      const result = await databases.createDocument(
        DB, C.schools, ID.unique(),
        { name: schoolName, district, state, medium, adminId: 'admin-id' }
      );
      setSchools(prev => [...prev, result]);
      setSelectedSchool(result);
      setSchoolName('');
      setDistrict('');
      showAlert('✅ పాఠశాల add అయింది!');
    } catch (e) {
      showAlert('Error: ' + e.message);
    }
    setSaving(false);
  };

  const handleAddClass = async () => {
    if (!className || !selectedSchool) {
      showAlert('తరగతి పేరు రాయండి!');
      return;
    }
    setSaving(true);
    try {
      const result = await databases.createDocument(
        DB, C.classes, ID.unique(),
        { name: className, schoolId: selectedSchool.$id, section, teacherId: '' }
      );
      setClasses(prev => [...prev, result]);
      setClassName('');
      showAlert('✅ తరగతి add అయింది!');
    } catch (e) {
      showAlert('Error: ' + e.message);
    }
    setSaving(false);
  };

  const handleAddSubject = async () => {
    if (!subjectName || !selectedClass) {
      showAlert('Subject పేరు రాయండి మరియు తరగతి ఎంచుకోండి!');
      return;
    }
    setSaving(true);
    try {
      const result = await databases.createDocument(
        DB, C.subjects, ID.unique(),
        {
          name: subjectName,
          classId: selectedClass.$id,
          schoolId: selectedSchool.$id,
          medium
        }
      );
      setSubjects(prev => [...prev, result]);
      setSubjectName('');
      showAlert('✅ Subject add అయింది!');
    } catch (e) {
      showAlert('Error: ' + e.message);
    }
    setSaving(false);
  };

  const handleAddChapter = async () => {
    if (!chapterName || !selectedSubject) {
      showAlert('పాఠం పేరు రాయండి మరియు సబ్జక్ట్ ఎంచుకోండి!');
      return;
    }
    setSaving(true);
    try {
      const result = await databases.createDocument(
        DB, C.chapters, ID.unique(),
        {
          name: chapterName,
          subjectId: selectedSubject.$id,
          orderNo: parseInt(chapterOrder) || 1,
          isActive: true,
        }
      );
      setChapters(prev => [...prev, result]);
      setChapterName('');
      setChapterOrder(String(chapters.length + 2));
      showAlert('✅ పాఠం add అయింది!');
    } catch (e) {
      showAlert('Error: ' + e.message);
    }
    setSaving(false);
  };

  const handleDelete = async (collection, id, setStateFunc) => {
    showConfirm('Delete చేయాలా?', async () => {
      try {
        await databases.deleteDocument(DB, collection, id);
        setStateFunc(prev => prev.filter(item => item.$id !== id));
      } catch (e) {
        showAlert('Error: ' + e.message);
      }
    });
  };

  return (
    <View style={styles.container}>

      {/* Confirm Modal */}
      <Modal
        transparent
        visible={confirmModal.visible}
        animationType="fade"
        onRequestClose={handleConfirmNo}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalIcon}>🗑️</Text>
            <Text style={styles.modalMessage}>{confirmModal.message}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtnNo} onPress={handleConfirmNo}>
                <Text style={styles.modalBtnNoText}>వద్దు</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnYes} onPress={handleConfirmYes}>
                <Text style={styles.modalBtnYesText}>అవును, Delete చేయి</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← వెనక్కి</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏫 పాఠశాల సెటప్</Text>
      </View>

      {/* Tabs — 4 tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}>
        {[
          { key: 'school', label: '🏫 పాఠశాల' },
          { key: 'class', label: '📚 తరగతి' },
          { key: 'subject', label: '📖 సబ్జెక్ట్' },
          { key: 'chapter', label: '📝 పాఠాలు' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content}>
        {loading
          ? <ActivityIndicator color="#e53935" size="large" style={{ marginTop: 30 }} />
          : <>
              {/* SCHOOL TAB */}
              {activeTab === 'school' && (
                <View>
                  <View style={styles.form}>
                    <Text style={styles.formTitle}>కొత్త పాఠశాల:</Text>
                    <TextInput style={styles.input} placeholder="పాఠశాల పేరు"
                      placeholderTextColor="#999" value={schoolName}
                      onChangeText={setSchoolName} />
                    <TextInput style={styles.input} placeholder="జిల్లా"
                      placeholderTextColor="#999" value={district}
                      onChangeText={setDistrict} />
                    <TextInput style={styles.input} placeholder="రాష్ట్రం"
                      placeholderTextColor="#999" value={state}
                      onChangeText={setState} />
                    <Text style={styles.label}>మాధ్యమం:</Text>
                    <View style={styles.mediumRow}>
                      {['telugu', 'english'].map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[styles.mediumBtn, medium === m && styles.mediumBtnActive]}
                          onPress={() => setMedium(m)}>
                          <Text style={[styles.mediumBtnText, medium === m && { color: 'white' }]}>
                            {m === 'telugu' ? '🇮🇳 తెలుగు' : '🇬🇧 English'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={handleAddSchool}>
                      {saving
                        ? <ActivityIndicator color="white" />
                        : <Text style={styles.addBtnText}>+ పాఠశాల Add చేయి</Text>
                      }
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.listTitle}>పాఠశాలలు ({schools.length}):</Text>
                  {schools.map((school) => (
                    <View key={school.$id} style={[styles.listCard,
                      selectedSchool?.$id === school.$id && styles.listCardSelected]}>
                      <TouchableOpacity
                        style={styles.listCardContent}
                        onPress={() => {
                          setSelectedSchool(school);
                          loadClasses(school.$id);
                        }}>
                        <Text style={styles.listCardTitle}>{school.name}</Text>
                        <Text style={styles.listCardSub}>{school.district} · {school.medium}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(C.schools, school.$id, setSchools)}>
                        <Text style={styles.deleteIcon}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* CLASS TAB */}
              {activeTab === 'class' && (
                <View>
                  {!selectedSchool
                    ? <Text style={styles.warningText}>
                        ⚠️ ముందు పాఠశాల tab లో school select చేయండి!
                      </Text>
                    : <>
                        <View style={styles.selectedInfo}>
                          <Text style={styles.selectedInfoText}>🏫 {selectedSchool.name}</Text>
                        </View>
                        <View style={styles.form}>
                          <Text style={styles.formTitle}>కొత్త తరగతి:</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="తరగతి పేరు (ఉదా: 6వ తరగతి)"
                            placeholderTextColor="#999"
                            value={className}
                            onChangeText={setClassName}
                          />
                          <Text style={styles.label}>Section:</Text>
                          <View style={styles.sectionRow}>
                            {['A', 'B', 'C', 'D'].map((s) => (
                              <TouchableOpacity
                                key={s}
                                style={[styles.sectionBtn, section === s && styles.sectionBtnActive]}
                                onPress={() => setSection(s)}>
                                <Text style={[styles.sectionBtnText, section === s && { color: 'white' }]}>
                                  {s}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                          <TouchableOpacity style={styles.addBtn} onPress={handleAddClass}>
                            {saving
                              ? <ActivityIndicator color="white" />
                              : <Text style={styles.addBtnText}>+ తరగతి Add చేయి</Text>
                            }
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.listTitle}>తరగతులు ({classes.length}):</Text>
                        {classes.map((cls) => (
                          <View key={cls.$id} style={[styles.listCard,
                            selectedClass?.$id === cls.$id && styles.listCardSelected]}>
                            <TouchableOpacity
                              style={styles.listCardContent}
                              onPress={() => {
                                setSelectedClass(cls);
                                loadSubjects(cls.$id);
                                setActiveTab('subject');
                              }}>
                              <Text style={styles.listCardTitle}>{cls.name}</Text>
                              <Text style={styles.listCardSub}>Section: {cls.section}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDelete(C.classes, cls.$id, setClasses)}>
                              <Text style={styles.deleteIcon}>🗑️</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </>
                  }
                </View>
              )}

              {/* SUBJECT TAB */}
              {activeTab === 'subject' && (
                <View>
                  {!selectedClass
                    ? <Text style={styles.warningText}>
                        ⚠️ ముందు తరగతి tab లో class select చేయండి!
                      </Text>
                    : <>
                        <View style={styles.selectedInfo}>
                          <Text style={styles.selectedInfoText}>
                            📚 {selectedClass.name}
                          </Text>
                        </View>
                        <View style={styles.form}>
                          <Text style={styles.formTitle}>కొత్త Subject:</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Subject పేరు (ఉదా: తెలుగు)"
                            placeholderTextColor="#999"
                            value={subjectName}
                            onChangeText={setSubjectName}
                          />
                          <TouchableOpacity style={styles.addBtn} onPress={handleAddSubject}>
                            {saving
                              ? <ActivityIndicator color="white" />
                              : <Text style={styles.addBtnText}>+ Subject Add చేయి</Text>
                            }
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.listTitle}>
                          Subjects ({subjects.length}):
                        </Text>
                        {subjects.map((sub) => (
                          <View key={sub.$id} style={[styles.listCard,
                            selectedSubject?.$id === sub.$id && styles.listCardSelected]}>
                            <TouchableOpacity
                              style={styles.listCardContent}
                              onPress={() => {
                                setSelectedSubject(sub);
                                loadChapters(sub.$id);
                                setChapterOrder(String(chapters.length + 1));
                                setActiveTab('chapter');
                              }}>
                              <Text style={styles.listCardTitle}>{sub.name}</Text>
                              <Text style={styles.listCardSub}>
                                📝 పాఠాలు చూడటానికి నొక్కండి →
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDelete(C.subjects, sub.$id, setSubjects)}>
                              <Text style={styles.deleteIcon}>🗑️</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </>
                  }
                </View>
              )}

              {/* CHAPTER TAB */}
              {activeTab === 'chapter' && (
                <View>
                  {!selectedSubject
                    ? <Text style={styles.warningText}>
                        ⚠️ ముందు Subject tab లో subject select చేయండి!
                      </Text>
                    : <>
                        {/* Breadcrumb */}
                        <View style={styles.breadcrumb}>
                          <Text style={styles.breadcrumbText}>
                            📚 {selectedClass?.name}
                          </Text>
                          <Text style={styles.breadcrumbSep}> › </Text>
                          <Text style={styles.breadcrumbText}>
                            📖 {selectedSubject.name}
                          </Text>
                        </View>

                        <View style={styles.form}>
                          <Text style={styles.formTitle}>కొత్త పాఠం:</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="పాఠం పేరు (ఉదా: మొదటి పాఠం)"
                            placeholderTextColor="#999"
                            value={chapterName}
                            onChangeText={setChapterName}
                          />
                          <Text style={styles.label}>క్రమ సంఖ్య:</Text>
                          <TextInput
                            style={[styles.input, { width: 80 }]}
                            placeholder="1"
                            placeholderTextColor="#999"
                            value={chapterOrder}
                            onChangeText={setChapterOrder}
                            keyboardType="number-pad"
                          />
                          <TouchableOpacity style={styles.addBtn} onPress={handleAddChapter}>
                            {saving
                              ? <ActivityIndicator color="white" />
                              : <Text style={styles.addBtnText}>+ పాఠం Add చేయి</Text>
                            }
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.listTitle}>
                          పాఠాలు ({chapters.length}):
                        </Text>
                        {chapters.length === 0
                          ? <View style={styles.emptyBox}>
                              <Text style={styles.emptyIcon}>📝</Text>
                              <Text style={styles.emptyText}>
                                ఇంకా పాఠాలు లేవు — పై ఫాం లో చేర్చండి!
                              </Text>
                            </View>
                          : chapters.map((chapter) => (
                              <View key={chapter.$id} style={styles.listCard}>
                                <View style={styles.chapterNumber}>
                                  <Text style={styles.chapterNumberText}>
                                    {chapter.orderNo}
                                  </Text>
                                </View>
                                <View style={styles.listCardContent}>
                                  <Text style={styles.listCardTitle}>{chapter.name}</Text>
                                  <Text style={styles.listCardSub}>
                                    {chapter.isActive ? '✅ Active' : '❌ Inactive'}
                                  </Text>
                                </View>
                                <TouchableOpacity
                                  onPress={() => handleDelete(
                                    C.chapters, chapter.$id, setChapters
                                  )}>
                                  <Text style={styles.deleteIcon}>🗑️</Text>
                                </TouchableOpacity>
                              </View>
                            ))
                        }
                      </>
                  }
                </View>
              )}
            </>
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    elevation: 10,
  },
  modalIcon: { fontSize: 36, marginBottom: 10 },
  modalMessage: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'SreeKrushnadevaraya',
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  modalBtnNo: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginRight: 8,
  },
  modalBtnNoText: {
    fontSize: 15,
    color: '#666',
    fontFamily: 'SreeKrushnadevaraya',
  },
  modalBtnYes: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#e53935',
    alignItems: 'center',
  },
  modalBtnYesText: {
    fontSize: 15,
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
  header: {
    backgroundColor: '#e53935',
    padding: 20,
    paddingTop: 50,
  },
  backBtn: { marginBottom: 5 },
  backBtnText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'SreeKrushnadevaraya',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'SreeKrushnadevaraya',
  },
  tabsContainer: {
    backgroundColor: 'white',
    elevation: 2,
    maxHeight: 60,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#e53935' },
  tabText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'SreeKrushnadevaraya',
  },
  tabTextActive: {
    color: '#e53935',
    fontWeight: 'bold',
  },
  content: { flex: 1, padding: 15 },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    fontFamily: 'SreeKrushnadevaraya',
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
    fontFamily: 'SreeKrushnadevaraya',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 10,
    color: '#333',
    fontFamily: 'SreeKrushnadevaraya',
  },
  mediumRow: { flexDirection: 'row', marginBottom: 10 },
  mediumBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginRight: 8,
  },
  mediumBtnActive: {
    backgroundColor: '#e53935',
    borderColor: '#e53935',
  },
  mediumBtnText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'SreeKrushnadevaraya',
  },
  sectionRow: { flexDirection: 'row', marginBottom: 10 },
  sectionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionBtnActive: {
    backgroundColor: '#e53935',
    borderColor: '#e53935',
  },
  sectionBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    fontFamily: 'BalooTammudu2',
  },
  addBtn: {
    backgroundColor: '#e53935',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    fontFamily: 'SreeKrushnadevaraya',
  },
  listCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    borderLeftWidth: 3,
    borderLeftColor: '#e0e0e0',
  },
  listCardSelected: {
    borderLeftColor: '#e53935',
    backgroundColor: '#fff5f5',
  },
  listCardContent: { flex: 1 },
  listCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'SreeKrushnadevaraya',
  },
  listCardSub: {
    fontSize: 13,
    color: '#888',
    fontFamily: 'BalooTammudu2',
    marginTop: 2,
  },
  deleteIcon: { fontSize: 18, paddingLeft: 8 },
  warningText: {
    fontSize: 15,
    color: '#f57c00',
    textAlign: 'center',
    marginTop: 30,
    fontFamily: 'SreeKrushnadevaraya',
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 10,
  },
  selectedInfo: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#e53935',
  },
  selectedInfoText: {
    fontSize: 15,
    color: '#c62828',
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#f57c00',
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#e65100',
    fontFamily: 'SreeKrushnadevaraya',
    fontWeight: 'bold',
  },
  breadcrumbSep: {
    fontSize: 14,
    color: '#f57c00',
    marginHorizontal: 4,
  },
  chapterNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e53935',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  chapterNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'BalooTammudu2',
  },
  emptyBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 25,
    alignItems: 'center',
    elevation: 1,
  },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: {
    fontSize: 15,
    color: '#666',
    fontFamily: 'SreeKrushnadevaraya',
    textAlign: 'center',
  },
});