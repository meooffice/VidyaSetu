import { useRef, useState } from 'react';
import { View, PanResponder, Animated, StyleSheet } from 'react-native';

export default function SwipeBackWrapper({ children, onBack, disabled, edgeWidth = 30, threshold = 80 }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [swiping, setSwiping] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (disabled) return false;
        const { dx, dy } = gestureState;
        return evt.nativeEvent.pageX <= edgeWidth
          && dx > 10
          && Math.abs(dy) < Math.abs(dx);
      },
      onPanResponderGrant: () => setSwiping(true),
      onPanResponderMove: (_, { dx }) => {
        if (dx > 0) translateX.setValue(dx);
      },
      onPanResponderRelease: (_, { dx }) => {
        if (dx >= threshold) {
          Animated.timing(translateX, {
            toValue: 400,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateX.setValue(0);
            onBack?.();
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
        setSwiping(false);
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        setSwiping(false);
      },
    })
  ).current;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateX }] }]}
      {...panResponder.panHandlers}
    >
      {children}
      {swiping && <View style={styles.indicator} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  indicator: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 4,
    backgroundColor: 'rgba(0,131,143,0.5)',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
});