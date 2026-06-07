import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert
} from 'react-native';
import { databases, account, APPWRITE_CONFIG } from '../../config/appwrite';
import { Query } from 'appwrite';
import { checkPasswordStrength } from '../../services/security';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

export default function AdminSettingsScreen({ onBack, onLogout }) {
  const [oldPassword, setOldPassword]       = useState('');
  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving]                 = useState(false);
  const [strength, setStrength]             = useState(null);
  const [showForm, setShowForm]             = useState(false);

  // ── Password Change ──────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'అన్ని fields రాయండి!');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords match కావడం లేదు!');
      return;
    }
    if (strength?.score < 3) {
      Alert.alert('Error', 'Strong password రాయండి!');
      return;
    }
    setSaving(true);
    try {
      await account.updatePassword(newPassword, oldPassword);
      Alert.alert('✅ Success', 'Password మార్చబడింది!\nమళ్ళీ login చేయండి.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowForm(false);
      onLogout();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setSaving(false);
  };

  // ── Data Cleanup ─────────────────────────────────────────────
  const cleanOldData = () => {
    Alert.alert(
      'డేటా క్లీనప్',
      '30 రోజుల పాత notifications మరియు messages delete చేయాలా?',
      [
        { text: 'రద్దు చేయి', style: 'cancel' },
        {
          text: 'Delete చేయి',
          style: 'destructive',
          onPress: async () => {
            try {
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              const cutoffDate = thirtyDaysAgo.toISOString();

              const notifs = await databases.listDocuments(
                DB, C.notifications,
                [Query.lessThan('createdAt', cutoffDate)]
              );
              for (const n of notifs.documents) {
                await databases.deleteDocument(DB, C.notifications, n.$id);
              }

              const msgs = await databases.listDocuments(
                DB, C.messages,
                [Query.equal('isRead', true),
                 Query.lessThan('sentAt', cutoffDate)]
              );
              for (const m of msgs.documents) {
                await databases.deleteDocument(DB, C.messages, m.$id);
              }

              Alert.alert(
                '✅ Cleanup పూర్తయింది!',
                `${notifs.documents.length} notifications\n${msgs.documents.length} messages delete అయ్యాయి!`
              );
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  // ── UI ───────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← వెనక్కి</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚙️ సెట్టింగ్స్</Text>
        <Text style={styles.headerSub}>నిర్వహణ సాధనాలు</Text>
      </View>

      <View style={styles.content}>

        {/* ── Section 1 : Password Change ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔑 Password మార్చు</Text>

          {!showForm ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setShowForm(true)}>
              <Text style={styles.actionBtnText}>Password మార్చు →</Text>
            </TouchableOpacity>
          ) : (
            <View>
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
                  setStrength(text ? checkPasswordStrength(text) : null);
                }}
                secureTextEntry
              />

              {strength && (
                <View style={styles.strengthRow}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <View
                      key={i}
                      style={[styles.strengthBar, {
                        backgroundColor: i <= strength.score
                          ? strength.color : '#e0e0e0',
                      }]}
                    />
                  ))}
                  <Text style={[styles.strengthLabel, { color: strength.color }]}>
                    {strength.label}
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

              {confirmPassword !== '' && newPassword !== confirmPassword && (
                <Text style={styles.errorText}>❌ Passwords match కావడం లేదు!</Text>
              )}

              <View style={styles.btnRow}>
                {saving ? (
                  <ActivityIndicator color="#e53935" />
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={handleChangePassword}>
                      <Text style={styles.saveBtnText}>💾 మార్చు</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => {
                        setShowForm(false);
                        setOldPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setStrength(null);
                      }}>
                      <Text style={styles.cancelBtnText}>రద్దు</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}
        </View>

        {/* ── Section 2 : Password Tips ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Password Tips</Text>
          {[
            '🔑 కనీసం 8 characters వాడండి',
            '🔠 Capital letters వాడండి (A-Z)',
            '🔢 Numbers వాడండి (0-9)',
            '⚡ Special characters వాడండి (!@#$)',
          ].map((tip, i) => (
            <Text key={i} style={styles.tip}>{tip}</Text>
          ))}
        </View>

        {/* ── Section 3 : Data Cleanup ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗃️ డేటా నిర్వహణ</Text>
          <Text style={styles.sectionDesc}>
            30 రోజుల కంటే పాత notifications మరియు చదివిన messages తొలగించండి.
            ఇది స్టోరేజ్ ఖాళీ చేసి యాప్ వేగాన్ని మెరుగుపరుస్తుంది.
          </Text>
          <TouchableOpacity style={styles.cleanupBtn} onPress={cleanOldData}>
            <Text style={styles.cleanupBtnText}>🗑️ Cleanup ప్రారంభించు</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  // Header
  header: {
    backgroundColor: '#00838f',
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
  headerSub: {
    fontSize: 14,
    color: '#b2ebf2',
    marginTop: 4,
    fontFamily: 'SreeKrushnadevaraya',
  },

  // Content
  content: { padding: 15 },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    fontFamily: 'SreeKrushnadevaraya',
  },
  sectionDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 14,
    fontFamily: 'SreeKrushnadevaraya',
  },

  // Password form
  actionBtn: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#1565c0',
    fontSize: 15,
    fontWeight: 'bold',
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
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  strengthBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 3,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
    fontFamily: 'SreeKrushnadevaraya',
  },
  errorText: {
    color: '#e53935',
    fontSize: 13,
    fontFamily: 'SreeKrushnadevaraya',
    marginBottom: 8,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveBtn: {
    backgroundColor: '#388e3c',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
  cancelBtn: {
    backgroundColor: '#e53935',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },

  // Tips
  tip: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'SreeKrushnadevaraya',
    marginBottom: 8,
    paddingLeft: 5,
  },

  // Cleanup
  cleanupBtn: {
    backgroundColor: '#d32f2f',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cleanupBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
});