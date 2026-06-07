import { useState, useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { LanguageProvider } from './src/context/LanguageContext';
import LoginScreen from './src/screens/LoginScreen';
import AdminDashboard from './src/screens/admin/AdminDashboard';
import AdminSetupScreen from './src/screens/admin/AdminSetupScreen';
import TeacherDashboard from './src/screens/teacher/TeacherDashboard';
import StudentDashboard from './src/screens/student/StudentDashboard';
import ParentDashboard from './src/screens/parent/ParentDashboard';
import SessionWarning from './src/components/SessionWarning';
import LoadingScreen from './src/components/LoadingScreen';
import ErrorBoundary from './src/components/ErrorBoundary';
import { logout, getCurrentUser } from './src/services/auth';
import { startSession, resetSession, clearTimers } from './src/services/session';
import { account, databases, APPWRITE_CONFIG } from './src/config/appwrite';
import { Query } from 'appwrite';

const DB = APPWRITE_CONFIG.databaseId;
const C = APPWRITE_CONFIG.collections;

SplashScreen.preventAutoHideAsync();

export default function App() {
  // ✅ అన్ని hooks top లో — conditionally కాదు!
  const [userRole, setUserRole] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [fontsLoaded] = useFonts({
    'SreeKrushnadevaraya': require('./assets/fonts/SreeKrushnadevaraya-Regular.ttf'),
    'BalooTammudu2': require('./assets/fonts/BalooTammudu2-VariableFont_wght.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkAdminSetup = async (userId) => {
    try {
      const result = await databases.listDocuments(
        DB, C.users,
        [Query.equal('$id', userId)]
      );
      return result.documents.length === 0;
    } catch (e) {
      return false;
    }
  };

  const checkExistingSession = async () => {
    try {
      const result = await getCurrentUser();
      if (result.success) {
        const userId = result.user.$id;
        setCurrentUserId(userId);

        const email = result.user.email || '';
        let role = 'student';
        if (email.includes('admin')) role = 'admin';
        else if (email.includes('teacher')) role = 'teacher';
        else if (email.includes('parent')) role = 'parent';

        // DB లో role check చేయి
        try {
          const dbResult = await databases.listDocuments(
            DB, C.users,
            [Query.equal('$id', userId)]
          );
          if (dbResult.documents.length > 0) {
            role = dbResult.documents[0].role;
          }
        } catch (e) {}

        if (role === 'admin') {
          const setupNeeded = await checkAdminSetup(userId);
          setNeedsSetup(setupNeeded);
        }

        setUserRole(role);
        startSession(
          () => handleAutoLogout(),
          () => setShowWarning(true)
        );
      }
    } catch (e) {}
    setInitializing(false);
  };

  const handleLoginSuccess = async (role) => {
    try {
      const user = await account.get();
      setCurrentUserId(user.$id);

      // DB లో role check చేయి
      let dbRole = role;
      try {
        const dbResult = await databases.listDocuments(
          DB, C.users,
          [Query.equal('$id', user.$id)]
        );
        if (dbResult.documents.length > 0) {
          dbRole = dbResult.documents[0].role;
        }
      } catch (e) {}

      if (dbRole === 'admin') {
        const setupNeeded = await checkAdminSetup(user.$id);
        setNeedsSetup(setupNeeded);
      }

      setUserRole(dbRole);
    } catch (e) {
      setUserRole(role);
    }

    startSession(
      () => handleAutoLogout(),
      () => setShowWarning(true)
    );
  };

  const handleAutoLogout = async () => {
    setShowWarning(false);
    setUserRole(null);
    setCurrentUserId(null);
    setNeedsSetup(false);
    alert('⏰ Session expire అయింది. మళ్ళీ login చేయండి!');
  };

  const handleLogout = async () => {
    clearTimers();
    await logout();
    setUserRole(null);
    setCurrentUserId(null);
    setNeedsSetup(false);
  };

  const handleContinueSession = () => {
    setShowWarning(false);
    resetSession(
      () => handleAutoLogout(),
      () => setShowWarning(true)
    );
  };

  if (!fontsLoaded || initializing) {
    return <LoadingScreen message="విద్యాసేతు తెరుచుకుంటుంది..." />;
  }

  const renderDashboard = () => {
    if (userRole === 'admin' && needsSetup) {
      return (
        <AdminSetupScreen
          onSetupComplete={() => setNeedsSetup(false)}
        />
      );
    }
    switch (userRole) {
      case 'admin':
        return <AdminDashboard onLogout={handleLogout} userId={currentUserId} />;
      case 'teacher':
        return <TeacherDashboard onLogout={handleLogout} userId={currentUserId} />;
      case 'student':
        return <StudentDashboard onLogout={handleLogout} userId={currentUserId} />;
      case 'parent':
        return <ParentDashboard onLogout={handleLogout} userId={currentUserId} />;
      default:
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          {!userRole
            ? <LoginScreen onLoginSuccess={handleLoginSuccess} />
            : renderDashboard()
          }
          <SessionWarning
            visible={showWarning}
            onContinue={handleContinueSession}
            onLogout={handleLogout}
            timeLeft={5}
          />
        </View>
      </LanguageProvider>
    </ErrorBoundary>
  );
}