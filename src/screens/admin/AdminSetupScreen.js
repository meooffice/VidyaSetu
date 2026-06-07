import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator
} from 'react-native';
import { account, databases, APPWRITE_CONFIG } from '../../config/appwrite';
import { ID } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

export default function AdminSetupScreen({ onSetupComplete }) {
  const [step, setStep] = useState(1); // 1: Admin Info, 2: School Info
  const [saving, setSaving] = useState(false);

  // Admin Info
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');

  // School Info
  const [schoolName, setSchoolName] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('ఆంధ్రప్రదేశ్');
  const [medium, setMedium] = useState('telugu');
  const [schoolType, setSchoolType] = useState('government');

  const handleStep1 = () => {
    if (!adminName) {
      alert('మీ పేరు రాయండి!');
      return;
    }
    setStep(2);
  };

  const handleCompleteSetup = async () => {
    if (!schoolName || !district) {
      alert('పాఠశాల పేరు మరియు జిల్లా రాయండి!');
      return;
    }
    setSaving(true);
    try {
      // Current admin తీసుకో
      const user = await account.get();

      // 1. School create చేయి
      const school = await databases.createDocument(
        DB, C.schools, ID.unique(),
        {
          name: schoolName,
          district,
          state,
          medium,
          adminId: user.$id,
        }
      );

      // 2. Admin name update చేయి
      if (adminName !== user.name) {
        await account.updateName(adminName);
      }

      // 3. Admin record users table లో create చేయి
      await databases.createDocument(
        DB, C.users, user.$id,
        {
          name: adminName,
          email: user.email || '',
          phone: adminPhone,
          role: 'admin',
          schoolId: school.$id,
          classId: '',
          parentId: '',
          isActive: true,
        }
      );

      alert(`✅ Setup పూర్తయింది!\n\nపాఠశాల: ${schoolName}\nAdmin: ${adminName}`);
      onSetupComplete();
    } catch (e) {
      console.log('Setup error:', e.message);
      alert('Error: ' + e.message);
    }
    setSaving(false);
  };

  // Step 1 — Admin Info
  if (step === 1) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>👤</Text>
          <Text style={styles.headerTitle}>Admin వివరాలు</Text>
          <Text style={styles.headerSub}>మీ గురించి చెప్పండి</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.stepIndicator}>
            <View style={[styles.step, styles.stepActive]}>
              <Text style={styles.stepText}>1</Text>
            </View>
            <View style={styles.stepLine} />
            <View style={styles.step}>
              <Text style={[styles.stepText, { color: '#999' }]}>2</Text>
            </View>
          </View>

          <View style={styles.form}>
            <Text style={styles.formTitle}>మీ వివరాలు:</Text>

            <Text style={styles.label}>పూర్తి పేరు: *</Text>
            <TextInput
              style={styles.input}
              placeholder="ఉదా: K. రమేష్ బాబు"
              placeholderTextColor="#999"
              value={adminName}
              onChangeText={setAdminName}
            />

            <Text style={styles.label}>Phone నంబర్: (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="ఉదా: 9876543210"
              placeholderTextColor="#999"
              value={adminPhone}
              onChangeText={setAdminPhone}
              keyboardType="phone-pad"
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                📧 Email: Login చేసిన email automatically save అవుతుంది
              </Text>
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={handleStep1}>
              <Text style={styles.nextBtnText}>తర్వాత → పాఠశాల వివరాలు</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Step 2 — School Info
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🏫</Text>
        <Text style={styles.headerTitle}>పాఠశాల వివరాలు</Text>
        <Text style={styles.headerSub}>మీ పాఠశాల గురించి చెప్పండి</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.stepIndicator}>
          <View style={[styles.step, styles.stepDone]}>
            <Text style={styles.stepText}>✓</Text>
          </View>
          <View style={[styles.stepLine, styles.stepLineDone]} />
          <View style={[styles.step, styles.stepActive]}>
            <Text style={styles.stepText}>2</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>పాఠశాల వివరాలు:</Text>

          <Text style={styles.label}>పాఠశాల పేరు: *</Text>
          <TextInput
            style={styles.input}
            placeholder="ఉదా: జిల్లా పరిషత్ ఉన్నత పాఠశాల"
            placeholderTextColor="#999"
            value={schoolName}
            onChangeText={setSchoolName}
          />

          <Text style={styles.label}>జిల్లా: *</Text>
          <TextInput
            style={styles.input}
            placeholder="ఉదా: రాజమహేంద్రవరం"
            placeholderTextColor="#999"
            value={district}
            onChangeText={setDistrict}
          />

          <Text style={styles.label}>రాష్ట్రం:</Text>
          <TextInput
            style={styles.input}
            placeholder="ఉదా: ఆంధ్రప్రదేశ్"
            placeholderTextColor="#999"
            value={state}
            onChangeText={setState}
          />

          <Text style={styles.label}>మాధ్యమం:</Text>
          <View style={styles.optionRow}>
            {['telugu', 'english'].map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.optionBtn,
                  medium === m && styles.optionBtnActive]}
                onPress={() => setMedium(m)}>
                <Text style={[styles.optionBtnText,
                  medium === m && { color: 'white' }]}>
                  {m === 'telugu' ? '🇮🇳 తెలుగు' : '🇬🇧 English'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>పాఠశాల రకం:</Text>
          <View style={styles.optionRow}>
            {[
              { key: 'government', label: '🏛️ ప్రభుత్వ' },
              { key: 'private', label: '🏢 ప్రైవేట్' },
              { key: 'aided', label: '🤝 Aided' },
            ].map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.optionBtn,
                  schoolType === t.key && styles.optionBtnActive]}
                onPress={() => setSchoolType(t.key)}>
                <Text style={[styles.optionBtnText,
                  schoolType === t.key && { color: 'white' }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Preview */}
          <View style={styles.previewBox}>
            <Text style={styles.previewTitle}>📋 Preview:</Text>
            <Text style={styles.previewText}>👤 Admin: {adminName}</Text>
            <Text style={styles.previewText}>🏫 పాఠశాల: {schoolName || '—'}</Text>
            <Text style={styles.previewText}>📍 జిల్లా: {district || '—'}</Text>
            <Text style={styles.previewText}>📚 మాధ్యమం: {medium}</Text>
          </View>

          <View style={styles.formBtns}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setStep(1)}>
              <Text style={styles.backBtnText}>← వెనక్కి</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.completeBtn}
              onPress={handleCompleteSetup}>
              {saving
                ? <ActivityIndicator color="white" />
                : <Text style={styles.completeBtnText}>
                    ✅ Setup పూర్తి చేయి
                  </Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#e53935',
    padding: 30,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerIcon: { fontSize: 50, marginBottom: 10 },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'SreeKrushnadevaraya',
  },
  headerSub: {
    fontSize: 16,
    color: '#ffcdd2',
    fontFamily: 'SreeKrushnadevaraya',
    marginTop: 5,
  },
  content: { flex: 1, padding: 15 },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  step: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActive: { backgroundColor: '#e53935' },
  stepDone: { backgroundColor: '#388e3c' },
  stepText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'BalooTammudu2',
  },
  stepLine: {
    width: 60,
    height: 3,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  stepLineDone: { backgroundColor: '#388e3c' },
  form: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
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
    marginBottom: 15,
    color: '#333',
    fontFamily: 'SreeKrushnadevaraya',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  infoText: {
    fontSize: 13,
    color: '#1565c0',
    fontFamily: 'SreeKrushnadevaraya',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  optionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  optionBtnActive: {
    backgroundColor: '#e53935',
    borderColor: '#e53935',
  },
  optionBtnText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'SreeKrushnadevaraya',
  },
  previewBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#e53935',
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'SreeKrushnadevaraya',
  },
  previewText: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'SreeKrushnadevaraya',
    marginBottom: 4,
  },
  formBtns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backBtn: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  backBtnText: {
    color: '#666',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
  completeBtn: {
    backgroundColor: '#e53935',
    padding: 12,
    borderRadius: 8,
    flex: 2,
    alignItems: 'center',
  },
  completeBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
  nextBtn: {
    backgroundColor: '#e53935',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
});