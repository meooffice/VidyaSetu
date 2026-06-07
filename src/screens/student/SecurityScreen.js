import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, Modal
} from 'react-native';
import { account } from '../../config/appwrite';
import { checkCurrentSession, checkPasswordStrength } from '../../services/security';

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
                <Text style={[modalStyles.btnText, btn.style === 'cancel' && modalStyles.btnCancelText]}>
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
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  box: {
    backgroundColor: 'white', borderRadius: 16, padding: 24,
    width: '80%', maxWidth: 340, alignItems: 'center',
    elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12,
  },
  icon: { fontSize: 36, marginBottom: 10 },
  title: {
    fontSize: 18, fontWeight: 'bold', color: '#333',
    textAlign: 'center', marginBottom: 6, fontFamily: 'SreeKrushnadevaraya',
  },
  message: {
    fontSize: 14, color: '#666', textAlign: 'center',
    lineHeight: 20, marginBottom: 18, fontFamily: 'SreeKrushnadevaraya',
  },
  btnRow: { flexDirection: 'row', gap: 10, width: '100%', justifyContent: 'center', marginTop: 4 },
  btn: { flex: 1, paddingVertical: 11, borderRadius: 9, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#1a237e' },
  btnDestructive: { backgroundColor: '#e53935' },
  btnCancel: { backgroundColor: '#f0f0f0' },
  btnText: { color: 'white', fontSize: 15, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  btnCancelText: { color: '#555' },
});

// ✅ Main SecurityScreen
export default function SecurityScreen({ onBack }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Custom Alert state
  const [alert, setAlert] = useState({
    visible: false, type: 'info', title: '', message: '', buttons: null,
  });

  const showAlert = (type, title, message = '', buttons = null) => {
    setAlert({ visible: true, type, title, message, buttons });
  };
  const closeAlert = () => setAlert(a => ({ ...a, visible: false }));

  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
    setLoading(true);
    const result = await checkCurrentSession();
    if (result.success) setSessions(result.sessions);
    setLoading(false);
  };

  const handleDeleteSession = (sessionId) => {
    showAlert('confirm', 'Session Delete చేయాలా?', 'ఈ device నుండి logout అవుతారు.', [
      { text: 'రద్దు చేయి', style: 'cancel' },
      {
        text: 'Delete చేయి',
        style: 'destructive',
        onPress: async () => {
          try {
            await account.deleteSession(sessionId);
            setSessions(prev => prev.filter(s => s.$id !== sessionId));
            showAlert('success', '✅ Session Delete అయింది!', '');
          } catch (e) {
            showAlert('error', 'Error', e.message);
          }
        },
      },
    ]);
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showAlert('error', 'లోపం', 'అన్ని fields రాయండి!');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('error', 'లోపం', 'New passwords match కావడం లేదు!');
      return;
    }
    if (passwordStrength?.score < 3) {
      showAlert('error', 'లోపం', 'Password strong గా రాయండి!');
      return;
    }
    setSaving(true);
    try {
      await account.updatePassword(newPassword, oldPassword);
      showAlert('success', '✅ Password మార్చబడింది!', '');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (e) {
      showAlert('error', 'Error', e.message);
    }
    setSaving(false);
  };

  const getClientInfo = (session) =>
    `${session.clientName || 'Unknown'} · ${session.countryName || 'Unknown'}`;

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('te-IN');

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
        <Text style={styles.headerTitle}>🔒 Security Settings</Text>
        <Text style={styles.headerSub}>Account Security</Text>
      </View>

      <ScrollView style={styles.content}>

        {/* Password Change */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔑 Password మార్చు</Text>
          {!showPasswordForm
            ? <TouchableOpacity style={styles.actionBtn} onPress={() => setShowPasswordForm(true)}>
                <Text style={styles.actionBtnText}>Password మార్చు →</Text>
              </TouchableOpacity>
            : <View>
                <TextInput
                  style={styles.input}
                  placeholder="పాత Password"
                  placeholderTextColor="#999"
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  secureTextEntry
                />
                <TextInput
                  style={styles.input}
                  placeholder="కొత్త Password"
                  placeholderTextColor="#999"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (text) setPasswordStrength(checkPasswordStrength(text));
                  }}
                  secureTextEntry
                />

                {passwordStrength && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBar}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <View
                          key={i}
                          style={[styles.strengthSegment, {
                            backgroundColor: i <= passwordStrength.score
                              ? passwordStrength.color
                              : '#e0e0e0'
                          }]}
                        />
                      ))}
                    </View>
                    <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                      {passwordStrength.label}
                    </Text>
                  </View>
                )}

                <TextInput
                  style={styles.input}
                  placeholder="కొత్త Password confirm చేయి"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />

                {confirmPassword && newPassword !== confirmPassword && (
                  <Text style={styles.errorText}>❌ Passwords match కావడం లేదు!</Text>
                )}

                <View style={styles.formBtns}>
                  {saving
                    ? <ActivityIndicator color="#1a73e8" />
                    : <>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword}>
                          <Text style={styles.saveBtnText}>💾 మార్చు</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPasswordForm(false)}>
                          <Text style={styles.cancelBtnText}>రద్దు</Text>
                        </TouchableOpacity>
                      </>
                  }
                </View>
              </View>
          }
        </View>

        {/* Active Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Active Sessions ({sessions.length})</Text>
          <Text style={styles.sectionNote}>మీరు login చేసిన devices ఇక్కడ కనిపిస్తాయి</Text>

          {loading
            ? <ActivityIndicator color="#1a73e8" />
            : sessions.map((session) => (
                <View key={session.$id} style={styles.sessionCard}>
                  <View style={styles.sessionIcon}>
                    <Text style={styles.sessionIconText}>
                      {session.clientType === 'browser' ? '🌐' : '📱'}
                    </Text>
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionClient}>{getClientInfo(session)}</Text>
                    <Text style={styles.sessionDate}>Login: {formatDate(session.$createdAt)}</Text>
                    {session.current && (
                      <Text style={styles.currentBadge}>✅ Current Device</Text>
                    )}
                  </View>
                  {!session.current && (
                    <TouchableOpacity onPress={() => handleDeleteSession(session.$id)}>
                      <Text style={styles.deleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
          }
        </View>

        {/* Security Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Security Tips</Text>
          {[
            '🔑 Strong password వాడండి',
            '📱 Unknown devices లో login చేయకండి',
            '🔒 Password ఎవరికీ చెప్పకండి',
            '⏰ ఉపయోగం తర్వాత logout చేయండి',
          ].map((tip, i) => (
            <Text key={i} style={styles.tipText}>{tip}</Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#1a237e', padding: 20, paddingTop: 50 },
  backBtn: { marginBottom: 5 },
  backBtnText: { color: 'white', fontSize: 16, fontFamily: 'SreeKrushnadevaraya' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', fontFamily: 'SreeKrushnadevaraya' },
  headerSub: { fontSize: 14, color: '#9fa8da', fontFamily: 'BalooTammudu2' },
  content: { flex: 1, padding: 15 },
  section: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 10, fontFamily: 'SreeKrushnadevaraya' },
  sectionNote: { fontSize: 13, color: '#888', fontFamily: 'SreeKrushnadevaraya', marginBottom: 12 },
  actionBtn: { backgroundColor: '#e3f2fd', padding: 12, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { color: '#1565c0', fontSize: 15, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 10, color: '#333', fontFamily: 'SreeKrushnadevaraya' },
  strengthContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  strengthBar: { flexDirection: 'row', flex: 1, marginRight: 10 },
  strengthSegment: { flex: 1, height: 6, borderRadius: 3, marginRight: 3 },
  strengthLabel: { fontSize: 13, fontWeight: 'bold', fontFamily: 'BalooTammudu2' },
  errorText: { color: '#e53935', fontSize: 13, fontFamily: 'SreeKrushnadevaraya', marginBottom: 8 },
  formBtns: { flexDirection: 'row', justifyContent: 'space-between' },
  saveBtn: { backgroundColor: '#388e3c', padding: 12, borderRadius: 8, flex: 1, marginRight: 8, alignItems: 'center' },
  saveBtnText: { color: 'white', fontSize: 15, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  cancelBtn: { backgroundColor: '#e53935', padding: 12, borderRadius: 8, flex: 1, alignItems: 'center' },
  cancelBtnText: { color: 'white', fontSize: 15, fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  sessionCard: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 8 },
  sessionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e3f2fd', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  sessionIconText: { fontSize: 20 },
  sessionInfo: { flex: 1 },
  sessionClient: { fontSize: 14, color: '#333', fontFamily: 'BalooTammudu2' },
  sessionDate: { fontSize: 12, color: '#888', fontFamily: 'BalooTammudu2' },
  currentBadge: { fontSize: 12, color: '#388e3c', fontWeight: 'bold', fontFamily: 'SreeKrushnadevaraya' },
  deleteIcon: { fontSize: 18 },
  tipText: { fontSize: 14, color: '#555', fontFamily: 'SreeKrushnadevaraya', marginBottom: 8, paddingLeft: 5 },
});