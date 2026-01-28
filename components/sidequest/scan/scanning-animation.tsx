import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
  FadeOut
} from 'react-native-reanimated';
import { ScanLine } from 'lucide-react-native';

const LOADING_MESSAGES = [
  "Reading receipt...",
  "Analyzing text...",
  "Finding prices...",
  "Identifying items...",
  "Almost there..."
];

export function ScanningAnimation() {
  const scanLinePosition = useSharedValue(-100);
  const messageIndex = React.useRef(0);
  const [currentMessage, setCurrentMessage] = React.useState(LOADING_MESSAGES[0]);

  // Scan line animation loop
  useEffect(() => {
    scanLinePosition.value = withRepeat(
      withSequence(
        withTiming(100, { duration: 1500, easing: Easing.linear }),
        withTiming(-100, { duration: 0 }) // Instant reset
      ),
      -1, // Infinite
      false
    );
  }, [scanLinePosition]);

  // Message rotation loop
  useEffect(() => {
    const interval = setInterval(() => {
      messageIndex.current = (messageIndex.current + 1) % LOADING_MESSAGES.length;
      setCurrentMessage(LOADING_MESSAGES[messageIndex.current]);
    }, 2000); // Change message every 2s

    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLinePosition.value }]
  }));

  return (
    <View style={styles.container}>
      {/* Receipt Icon / Placeholder */}
      <View style={styles.iconContainer}>
        <ScanLine size={64} color="#0F8" />
        
        {/* Animated Scan Bar */}
        <Animated.View style={[styles.scanBar, animatedStyle]} />
      </View>

      {/* Dynamic Text */}
      <Animated.View 
        key={currentMessage} 
        entering={FadeIn.duration(300)} 
        exiting={FadeOut.duration(300)}
        style={styles.textContainer}
      >
        <Text style={styles.title}>Processing</Text>
        <Text style={styles.subtitle}>{currentMessage}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 160,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 32,
  },
  scanBar: {
    position: 'absolute',
    width: '120%',
    height: 4,
    backgroundColor: '#0F8',
    shadowColor: '#0F8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F8', // Green accent
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});
