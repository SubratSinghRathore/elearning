// pages/Login.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useAuth } from "../context/AuthContext";
import * as z from "zod";

const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address"),

  password: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/,
      "Password must be at least 8 characters and include uppercase, lowercase, number and special character."
    ),
});

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hidePassword, setHidePassword] = useState(true);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const { login } = useAuth();

  const handleLogin = async () => {
    const validation = loginSchema.safeParse({
      email,
      password,
    });

    if (!validation.success) {
      const newErrors = {
        email: "",
        password: "",
      };

      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as "email" | "password";

        if (!newErrors[field]) {
          newErrors[field] = issue.message;
        }
      });

      setErrors(newErrors);
      return;
    }

    // Clear previous errors
    setErrors({
      email: "",
      password: "",
    });

    setLoading(true);

    try {
      const result = await login(email, password);

      if (!result.success) {
        Alert.alert(
          "Login Failed",
          result.message || "Invalid credentials"
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>E - Learning</Text>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>
        Your educational journey continues here.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Email Address</Text>
        <View style={styles.inputContainer}>
          <Icon name="mail" size={20} color="#777" />
          <TextInput
            style={styles.input}
            placeholder="name@example.com"
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
          />
        </View>
        {errors.email ? (
          <Text style={styles.error}>{errors.email}</Text>
        ) : null}

        <View style={styles.passwordHeader}>
          <Text style={styles.label}>Password</Text>
          <TouchableOpacity>
            <Text style={styles.forgot}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color="#777" />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry={hidePassword}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity onPress={() => setHidePassword(!hidePassword)}>
            <Icon
              name={hidePassword ? "eye" : "eye-off"}
              size={20}
              color="#777"
            />
          </TouchableOpacity>
        </View>
        {errors.password ? (
          <Text style={styles.error}>{errors.password}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In →</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text>Don't have an account? </Text>
          <TouchableOpacity>
            <Text style={styles.signup}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FF",
    justifyContent: "flex-start",
    paddingTop: 70,
  },
  logo: {
    alignSelf: "center",
    fontSize: 34,
    color: "#4F46E5",
    fontWeight: "700",
  },
  title: {
    textAlign: "center",
    fontSize: 34,
    fontWeight: "700",
    marginTop: 10,
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    marginVertical: 15,
    fontSize: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    elevation: 5,
    margin: 10
  },
  label: {
    fontWeight: "700",
    marginBottom: 10,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    marginLeft: 10,
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  forgot: {
    color: "#4F46E5",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#4F46E5",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },
  signup: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  error: {
    color: "#EF4444",
    fontSize: 13,
    marginTop: -15,
    marginBottom: 15,
    marginLeft: 5,
  },
});

export default LoginScreen;