import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';

export default function LoadingScreen({ message }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, {
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }]
      }]}>
        <Text style={styles.logo}>🏫</Text>
        <Text style={styles.appName}>విద్యాసేతు</Text>
        <ActivityIndicator color="white" size="large" style={styles.loader} />
        <Text style={styles.message}>{message || 'లోడ్ అవుతుంది...'}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a73e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { alignItems: 'center' },
  logo: { fontSize: 80, marginBottom: 15 },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'SreeKrushnadevaraya',
    marginBottom: 30,
  },
  loader: { marginBottom: 15 },
  message: {
    fontSize: 16,
    color: '#e8f0fe',
    fontFamily: 'SreeKrushnadevaraya',
  },
});