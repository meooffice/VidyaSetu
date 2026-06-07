import { View, Text, StyleSheet } from 'react-native';

export default function Watermark({ userName, userId }) {
  const date = new Date().toLocaleDateString('te-IN');
  const watermarkText = `${userName || 'Student'} | ${date}`;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Diagonal watermarks */}
      {[...Array(6)].map((_, i) => (
        <Text
          key={i}
          style={[styles.watermarkText, {
            top: `${15 + i * 15}%`,
            left: `${-10 + (i % 2) * 20}%`,
          }]}>
          {watermarkText}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    overflow: 'hidden',
  },
  watermarkText: {
    position: 'absolute',
    color: 'rgba(0,0,0,0.06)',
    fontSize: 14,
    fontFamily: 'BalooTammudu2',
    transform: [{ rotate: '-30deg' }],
    width: 300,
  },
});