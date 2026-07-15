import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const LoadingScreen = () => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -15,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    const animateDots = () => {
      Animated.sequence([
        Animated.timing(dot1, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(dot2, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(dot3, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(dot1, {
            toValue: 0.3,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 0.3,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 0.3,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => animateDots());
    };

    animateDots();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          transform: [{ translateY: floatAnim }],
        }}
      >
        <Icon
          name="book-open-page-variant"
          size={90}
          color="#4F46E5"
        />
      </Animated.View>

      <Text style={styles.title}>E - Learning</Text>

      <Text style={styles.subtitle}>
        Preparing your learning experience
      </Text>

      <View style={styles.dots}>
        <Animated.View
          style={[styles.dot, { opacity: dot1 }]}
        />
        <Animated.View
          style={[styles.dot, { opacity: dot2 }]}
        />
        <Animated.View
          style={[styles.dot, { opacity: dot3 }]}
        />
      </View>
    </View>
  );
};

export default LoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#4F46E5",
    marginTop: 20,
  },

  subtitle: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },

  dots: {
    flexDirection: "row",
    marginTop: 30,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4F46E5",
    marginHorizontal: 5,
  },
});