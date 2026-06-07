import { useState } from 'react';
import { View } from 'react-native';
import SwipeBackWrapper from '../components/SwipeBackWrapper';

import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminSetupScreen from '../screens/admin/AdminSetupScreen';
import TeacherDashboard from '../screens/teacher/TeacherDashboard';
import StudentDashboard from '../screens/student/StudentDashboard';
import ParentDashboard from '../screens/parent/ParentDashboard';

export default function AppNavigator({ userRole, userId, needsSetup, setNeedsSetup, onLogout }) {
  const [history, setHistory] = useState([]);
  const [currentScreen, setCurrentScreen] = useState(null);
  const [screenProps, setScreenProps] = useState({});

  const navigate = (screen, props = {}) => {
    setHistory(prev => [...prev, { screen: currentScreen, props: screenProps }]);
    setCurrentScreen(screen);
    setScreenProps(props);
  };

  const goBack = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setCurrentScreen(prev.screen);
    setScreenProps(prev.props);
  };

  const isRoot = history.length === 0;

  const renderScreen = () => {
    if (userRole === 'admin' && needsSetup) {
      return <AdminSetupScreen onSetupComplete={() => setNeedsSetup(false)} />;
    }
    switch (userRole) {
      case 'admin':
        return <AdminDashboard onLogout={onLogout} userId={userId} onNavigate={navigate} />;
      case 'teacher':
        return <TeacherDashboard onLogout={onLogout} userId={userId} onNavigate={navigate} />;
      case 'student':
        return <StudentDashboard onLogout={onLogout} userId={userId} onNavigate={navigate} />;
      case 'parent':
        return <ParentDashboard onLogout={onLogout} userId={userId} onNavigate={navigate} />;
      default:
        return null;
    }
  };

  return (
    <SwipeBackWrapper onBack={goBack} disabled={isRoot}>
      <View style={{ flex: 1 }}>
        {renderScreen()}
      </View>
    </SwipeBackWrapper>
  );
}