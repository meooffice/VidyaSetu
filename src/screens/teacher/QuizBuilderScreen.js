import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, Modal
} from 'react-native';
import { createQuiz, getQuizzesByChapter, deleteQuiz } from '../../services/quiz';

// ✅ Custom Alert Modal — alert() మరియు window.confirm() కి replacement
function CustomAlert({ visible, type, title, message, buttons, onClose }) {
  if (!visible) return null;

  const isConfirm = buttons && buttons.length > 1;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.box}>
          <Text style={modalStyles.icon}>
            {type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'confirm' ? '⚠️' : 'ℹ️'}
          </Text>
          <Text style={modalStyles.title}>{title}</Text>
          {message ? <Text style={modalStyles.message}>{message}</Text> : null}
          <View style={[modalStyles.btnRow, isConfirm && { justifyContent: 'space-between' }]}>
            {buttons ? buttons.map((btn, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  modalStyles.btn,
                  btn.style === 'destructive' && modalStyles.btnDestructive,
                  btn.style === 'cancel' && modalStyles.btnCancel,
                  !btn.style && modalStyles.btnPrimary,
                ]}
                onPress={() => { onClose(); btn.onPress && btn.onPress(); }}
              >
                <Text style={[
                  modalStyles.btnText,
                  btn.style === 'cancel' && modalStyles.btnCancelText,
                ]}>
                  {btn.text}
                </Text>
              </TouchableOpacity>
            )) : (
              <TouchableOpacity style={[modalStyles.btn, modalStyles.btnPrimary]} onPress={onClose}>
                <Text style={modalStyles.btnText}>సరే</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 340,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  icon: { fontSize: 36, marginBottom: 10 },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: 'SreeKrushnadevaraya',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
    fontFamily: 'SreeKrushnadevaraya',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 9,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: '#e53935' },
  btnDestructive: { backgroundColor: '#e53935' },
  btnCancel: { backgroundColor: '#f0f0f0' },
  btnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
  btnCancelText: { color: '#555' },
});

// ✅ Main QuizBuilderScreen
export default function QuizBuilderScreen({ chapter, onBack }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quizType, setQuizType] = useState('mcq');

  // MCQ fields
  const [question, setQuestion] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [answer, setAnswer] = useState('');

  // Custom Alert state
  const [alert, setAlert] = useState({
    visible: false, type: 'info', title: '', message: '', buttons: null,
  });

  const showAlert = (type, title, message, buttons = null) => {
    setAlert({ visible: true, type, title, message, buttons });
  };
  const closeAlert = () => setAlert(a => ({ ...a, visible: false }));

  useEffect(() => { loadQuizzes(); }, []);

  const loadQuizzes = async () => {
    setLoading(true);
    const result = await getQuizzesByChapter(chapter.$id);
    if (result.success) setQuizzes(result.data);
    setLoading(false);
  };

  const resetForm = () => {
    setQuestion('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setAnswer('');
    setShowForm(false);
  };

  const handleSaveQuiz = async () => {
    if (!question || !answer) {
      showAlert('error', 'లోపం', 'ప్రశ్న మరియు సమాధానం రాయండి!');
      return;
    }

    let options = [];
    if (quizType === 'mcq') {
      if (!optionA || !optionB || !optionC || !optionD) {
        showAlert('error', 'లోపం', 'అన్ని options రాయండి!');
        return;
      }
      options = [optionA, optionB, optionC, optionD];
    } else if (quizType === 'truefalse') {
      options = ['నిజం', 'అబద్ధం'];
    }

    setSaving(true);
    const result = await createQuiz(
      question, options, answer, quizType, chapter.$id, 'teacher-id'
    );
    setSaving(false);

    if (result.success) {
      showAlert('success', '✅ Quiz సేవ్ అయింది!', '');
      resetForm();
      loadQuizzes();
    } else {
      showAlert('error', 'Error', result.error);
    }
  };

  const handleDelete = (quizId) => {
    showAlert('confirm', 'Quiz డిలీట్ చేయాలా?', 'ఈ ప్రశ్న శాశ్వతంగా తొలగించబడుతుంది!', [
      { text: 'రద్దు చేయి', style: 'cancel' },
      {
        text: 'డిలీట్ చేయి',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteQuiz(quizId);
          if (result.success) {
            setQuizzes(prev => prev.filter(q => q.$id !== quizId));
          } else {
            showAlert('error', 'Error', result.error);
          }
        },
      },
    ]);
  };

  const typeLabels = {
    mcq: '🔵 MCQ (బహుళ ఎంపిక)',
    fillblanks: '✏️ Fill in the Blanks',
    truefalse: '✅ నిజం / అబద్ధం',
  };

  const getOptions = (quiz) => {
    try { return JSON.parse(quiz.options); }
    catch { return []; }
  };

  return (
    <View style={styles.container}>
      {/* Custom Alert Modal */}
      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
        onClose={closeAlert}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← వెనక్కి</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>❓ {chapter.name}</Text>
        <Text style={styles.headerSub}>Quiz Builder</Text>
      </View>

      <ScrollView style={styles.content}>
        {!showForm && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
            <Text style={styles.addBtnText}>+ కొత్త Quiz ప్రశ్న జోడించు</Text>
          </TouchableOpacity>
        )}

        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>కొత్త Quiz ప్రశ్న:</Text>

            <Text style={styles.label}>Quiz రకం:</Text>
            <View style={styles.typeRow}>
              {['mcq', 'fillblanks', 'truefalse'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, quizType === t && styles.typeBtnActive]}
                  onPress={() => setQuizType(t)}>
                  <Text style={[styles.typeBtnText, quizType === t && styles.typeBtnTextActive]}>
                    {t === 'mcq' ? 'MCQ' : t === 'fillblanks' ? 'Fill' : 'T/F'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>ప్రశ్న:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="ప్రశ్న రాయండి..."
              placeholderTextColor="#999"
              value={question}
              onChangeText={setQuestion}
              multiline
            />

            {quizType === 'mcq' && (
              <View>
                <Text style={styles.label}>Options:</Text>
                {[
                  { label: 'A', value: optionA, setter: setOptionA },
                  { label: 'B', value: optionB, setter: setOptionB },
                  { label: 'C', value: optionC, setter: setOptionC },
                  { label: 'D', value: optionD, setter: setOptionD },
                ].map((opt) => (
                  <View key={opt.label} style={styles.optionRow}>
                    <Text style={styles.optionLabel}>{opt.label}:</Text>
                    <TextInput
                      style={[styles.input, styles.optionInput]}
                      placeholder={`Option ${opt.label}`}
                      placeholderTextColor="#999"
                      value={opt.value}
                      onChangeText={opt.setter}
                    />
                  </View>
                ))}
                <Text style={styles.label}>సరైన సమాధానం (A/B/C/D):</Text>
                <View style={styles.answerRow}>
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.answerBtn, answer === opt && styles.answerBtnActive]}
                      onPress={() => setAnswer(opt)}>
                      <Text style={[styles.answerBtnText, answer === opt && styles.answerBtnTextActive]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {quizType === 'fillblanks' && (
              <View>
                <Text style={styles.label}>సరైన సమాధానం:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="సమాధానం రాయండి"
                  placeholderTextColor="#999"
                  value={answer}
                  onChangeText={setAnswer}
                />
              </View>
            )}

            {quizType === 'truefalse' && (
              <View>
                <Text style={styles.label}>సరైన సమాధానం:</Text>
                <View style={styles.answerRow}>
                  {['నిజం', 'అబద్ధం'].map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.answerBtn, answer === opt && styles.answerBtnActive]}
                      onPress={() => setAnswer(opt)}>
                      <Text style={[styles.answerBtnText, answer === opt && styles.answerBtnTextActive]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.formBtns}>
              {saving
                ? <ActivityIndicator color="#e53935" />
                : <>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveQuiz}>
                      <Text style={styles.saveBtnText}>సేవ్ చేయి</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                      <Text style={styles.cancelBtnText}>రద్దు చేయి</Text>
                    </TouchableOpacity>
                  </>
              }
            </View>
          </View>
        )}

        {loading
          ? <ActivityIndicator color="#e53935" size="large" style={{ marginTop: 30 }} />
          : quizzes.length === 0
            ? <Text style={styles.emptyText}>ఇంకా Quiz ప్రశ్నలు లేవు</Text>
            : quizzes.map((quiz, index) => (
                <View key={quiz.$id} style={styles.quizCard}>
                  <View style={styles.quizHeader}>
                    <Text style={styles.quizNumber}>Q{index + 1}</Text>
                    <Text style={styles.quizType}>{typeLabels[quiz.type] || quiz.type}</Text>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(quiz.$id)}>
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.quizQuestion}>{quiz.question}</Text>
                  {getOptions(quiz).length > 0 && (
                    <View style={styles.optionsList}>
                      {getOptions(quiz).map((opt, i) => (
                        <Text key={i} style={styles.optionItem}>
                          {String.fromCharCode(65 + i)}. {opt}
                        </Text>
                      ))}
                    </View>
                  )}
                  <Text style={styles.quizAnswer}>✅ సమాధానం: {quiz.answer}</Text>
                </View>
              ))
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#e53935', padding: 20, paddingTop: 50 },
  backBtn: { marginBottom: 5 },
  backBtnText: { color: 'white', fontSize: 16, fontFamily: 'SreeKrushnadevaraya' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', fontFamily: 'SreeKrushnadevaraya' },
  headerSub: { fontSize: 14, color: '#ffcdd2', fontFamily: 'BalooTammudu2' },
  content: { flex: 1, padding: 15 },
  addBtn: { backgroundColor: '#e53935', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  addBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  form: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  formTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, fontFamily: 'SreeKrushnadevaraya' },
  label: { fontSize: 15, color: '#555', marginBottom: 6, marginTop: 8, fontFamily: 'SreeKrushnadevaraya' },
  typeRow: { flexDirection: 'row', marginBottom: 10 },
  typeBtn: { flex: 1, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', marginRight: 6 },
  typeBtnActive: { backgroundColor: '#e53935', borderColor: '#e53935' },
  typeBtnText: { fontSize: 13, color: '#666', fontFamily: 'BalooTammudu2' },
  typeBtnTextActive: { color: 'white' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 8, color: '#333', fontFamily: 'SreeKrushnadevaraya' },
  textArea: { height: 80, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  optionLabel: { fontSize: 16, fontWeight: 'bold', color: '#333', width: 25, fontFamily: 'BalooTammudu2' },
  optionInput: { flex: 1, marginBottom: 0 },
  answerRow: { flexDirection: 'row', marginBottom: 10, flexWrap: 'wrap' },
  answerBtn: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginRight: 8, marginBottom: 8, minWidth: 60, alignItems: 'center' },
  answerBtnActive: { backgroundColor: '#388e3c', borderColor: '#388e3c' },
  answerBtnText: { fontSize: 15, color: '#666', fontFamily: 'SreeKrushnadevaraya' },
  answerBtnTextActive: { color: 'white' },
  formBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  saveBtn: { backgroundColor: '#388e3c', padding: 12, borderRadius: 8, flex: 1, marginRight: 8, alignItems: 'center' },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  cancelBtn: { backgroundColor: '#e53935', padding: 12, borderRadius: 8, flex: 1, alignItems: 'center' },
  cancelBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 30, fontFamily: 'SreeKrushnadevaraya' },
  quizCard: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2 },
  quizHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  quizNumber: { fontSize: 16, fontWeight: 'bold', color: '#e53935', marginRight: 8, fontFamily: 'BalooTammudu2' },
  quizType: { flex: 1, fontSize: 13, color: '#888', fontFamily: 'BalooTammudu2' },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 18 },
  quizQuestion: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8, fontFamily: 'SreeKrushnadevaraya' },
  optionsList: { marginBottom: 8 },
  optionItem: { fontSize: 14, color: '#555', marginBottom: 3, fontFamily: 'SreeKrushnadevaraya' },
  quizAnswer: { fontSize: 14, color: '#388e3c', fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
});