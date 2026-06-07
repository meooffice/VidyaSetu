import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { databases, account, APPWRITE_CONFIG } from '../../config/appwrite';
import { ID, Query } from 'appwrite';
import SchoolSetupScreen from './SchoolSetupScreen';
import TeacherManagementScreen from './TeacherManagementScreen';
import StudentManagementScreen from './StudentManagementScreen';
import ParentManagementScreen from './ParentManagementScreen';
import AdminReportsScreen from './AdminReportsScreen';
import AdminSettingsScreen from './AdminSettingsScreen';
import BulkUploadScreen from './BulkUploadScreen';
import ClassManagementScreen from './ClassManagementScreen';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

export default function AdminDashboard({ onLogout }) {
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  useEffect(() => {
    createAdminRecord();
  }, []);

  const createAdminRecord = async () => {
    try {
      const user = await account.get();

      const existing = await databases.listDocuments(
        DB, C.users,
        [Query.equal('$id', user.$id)]
      );

      if (existing.documents.length === 0) {
        const schools = await databases.listDocuments(DB, C.schools);
        const schoolId = schools.documents[0]?.$id || '';

        await databases.createDocument(
          DB, C.users, user.$id,
          {
            name: user.name || 'Admin',
            email: user.email || '',
            phone: '',
            role: 'admin',
            schoolId,
            classId: '',
            parentId: '',
            isActive: true,
          }
        );
        console.log('Admin record created!');
      }
    } catch (e) {
      console.log('createAdminRecord error:', e.message);
    }
  };

  const menuItems = [
    { icon: '🏫', label: 'పాఠశాల సెటప్',   color: '#e53935', screen: 'school'    },
    { icon: '👨‍🏫', label: 'టీచర్లు',         color: '#f57c00', screen: 'teachers'  },
    { icon: '👨‍🎓', label: 'విద్యార్థులు',    color: '#388e3c', screen: 'students'  },
    { icon: '👨‍👩‍👧', label: 'తల్లిదండ్రులు',  color: '#1565c0', screen: 'parents'   },
    { icon: '📊', label: 'నివేదికలు',        color: '#6a1b9a', screen: 'reports'   },
    { icon: '⚙️', label: 'సెట్టింగ్స్',      color: '#00838f', screen: 'settings'  },
    { icon: '📤', label: 'బల్క్ రిజిస్టర్', color: '#e53935', screen: 'bulkUpload' },
    { icon: '🏫', label: 'తరగతి నిర్వహణ', color: '#1565c0', screen: 'classManagement' },
  ];

  if (currentScreen === 'school') {
    return <SchoolSetupScreen onBack={() => setCurrentScreen('dashboard')} />;
  }
  if (currentScreen === 'teachers') {
    return <TeacherManagementScreen onBack={() => setCurrentScreen('dashboard')} />;
  }
  if (currentScreen === 'students') {
    return <StudentManagementScreen onBack={() => setCurrentScreen('dashboard')} />;
  }
  if (currentScreen === 'parents') {
    return <ParentManagementScreen onBack={() => setCurrentScreen('dashboard')} />;
  }
  if (currentScreen === 'reports') {
    return <AdminReportsScreen onBack={() => setCurrentScreen('dashboard')} />;
  }
  if (currentScreen === 'settings') {
    return (
      <AdminSettingsScreen
        onBack={() => setCurrentScreen('dashboard')}
        onLogout={onLogout}
      />
    );
  }
  if (currentScreen === 'bulkUpload') {
  return (
    <BulkUploadScreen
      onBack={() => setCurrentScreen('dashboard')}
    />
  );
}
if (currentScreen === 'classManagement') {
  return (
    <ClassManagementScreen
      onBack={() => setCurrentScreen('dashboard')}
    />
  );
}
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔴 అడ్మిన్ డాష్‌బోర్డ్</Text>
        <Text style={styles.headerSub}>విద్యాసేతు నిర్వహణ</Text>
      </View>

      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { backgroundColor: item.color }]}
            onPress={() => item.screen && setCurrentScreen(item.screen)}>
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <Text style={styles.cardLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>లాగ్ అవుట్</Text>
      </TouchableOpacity>
    </ScrollView>
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
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'SreeKrushnadevaraya',
  },
  headerSub: {
    fontSize: 16,
    color: '#ffcdd2',
    marginTop: 5,
    fontFamily: 'SreeKrushnadevaraya',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    justifyContent: 'space-between',
  },
  card: {
    width: '47%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
  },
  cardIcon: { fontSize: 36, marginBottom: 8 },
  cardLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'SreeKrushnadevaraya',
  },
  logoutBtn: {
    margin: 20,
    backgroundColor: '#b71c1c',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
});