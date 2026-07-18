// screens/HomeScreen.tsx
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/axios";
import LiveClasses from "../components/LiveClasses";
import { useAuth } from "../context/AuthContext"
import { requestPermissions } from '../utils/requestPermissions';
import GroupStudy from "./groupStudy/GroupStudy";
import ScoreBoardSmall from "../components/ScoreBoardSmall";

const { width, height } = Dimensions.get("window");

const Home = ({ navigation }: any) => {
  const [userData, setUserData] = useState<any>(null);
  const [studentStats, setStudentStats] = useState<any>(null);
  const [teachersData, setTeachersData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { logout, user } = useAuth();

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const granted = await requestPermissions();

      if (granted) {
        console.log('✅ Camera & Microphone permissions granted');
      } else {
        Alert.alert(
          'Permission Required',
          'Please allow Camera and Microphone permissions to join live classes.'
        );
      }
    } catch (error) {
      console.log('Permission Error:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");
      if (!isLoggedIn) {
        navigation.replace("Login");
        return;
      }

      const userResponse = await api.get("/auth/me");
      if (userResponse.data.success) {
        setUserData(userResponse.data.data);
      }

      const statsResponse = await api.get("/dashboard/stats");
      if (statsResponse.data.success) {
        setStudentStats(statsResponse.data.data.counts);
      }

      const teachersResponse = await api.get("/users/teachers/summary");
      if (teachersResponse.data.success) {
        setTeachersData(teachersResponse.data.data);
      }

    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem("isLoggedIn");
        navigation.replace("Login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FF" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Welcome,</Text>
            <Text style={styles.userName}>
              {userData?.personalInfo?.name || "User"}
            </Text>
            <Text style={styles.greeting}>Keep Learning, Keep Growing 🚀,</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate("Notifications")}
            >
              <Icon name="bell" size={22} color="#111827" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate("Profile")}
            >
              {userData?.personalInfo?.profileImage ? (
                <Image
                  source={{ uri: userData.personalInfo.profileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Text style={styles.profileInitial}>
                    {userData?.personalInfo?.name?.[0] || "U"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Section */}
        {user?.role === "TEACHER" &&
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statsIconBox}>
                <Icon name="book-open" color={"#3151df"} size={22}/>
              </View>
              <Text style={styles.statNumber}>{studentStats?.subjectCount || 0}</Text>
              <Text style={styles.statLabel}>All Subjects</Text>
              <View style={[styles.statsUnderline, {backgroundColor: '#3151df'}]}/>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statsIconBox}>
                <Icon name="video" color={"#269f53"} size={22}/>
              </View>
              <Text style={styles.statNumber}>{studentStats?.liveClassCount || 0}</Text>
              <Text style={styles.statLabel}>Live Classes</Text>
              <View style={[styles.statsUnderline, {backgroundColor: '#269f53'}]}/>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statsIconBox}>
                <Icon name="file-text" color={"#f47029"} size={22}/>
              </View>
              <Text style={styles.statNumber}>{studentStats?.contentCount || 0}</Text>
              <Text style={styles.statLabel}>Study Material</Text>
              <View style={[styles.statsUnderline, {backgroundColor: '#f47029'}]}/>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statsIconBox}>
                <Icon name="users" color={"#3157ff"} size={22}/>
              </View>
              <Text style={styles.statNumber}>{studentStats?.groupStudyCount || 0}</Text>
              <Text style={styles.statLabel}>Study Groups</Text>
              <View style={[styles.statsUnderline, {backgroundColor: '#3157ff'}]}/>
            </View>
          </View>
        }

        {user?.role === 'TEACHER' && <ScoreBoardSmall />}

        {/* Group Study Section */}
        {user?.role !== 'TEACHER' &&
          <View style={styles.groupStudySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Group Study</Text>
            </View>
            <View style={styles.groupStudyWrapper}>
              <GroupStudy navigation={navigation} />
            </View>
          </View>}

        {/* Live Classes Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Live Classes</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Live")}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        <LiveClasses navigation={navigation} />

        {/* Extra bottom space */}
        <View style={styles.securityNotice}>
          <Text style={styles.securityText}>MSSPL | Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  statsIconBox:{
    height: 40,
    width: 40,
    borderRadius: 100,
    backgroundColor: "#94949475",
    flex: 1,
    justifyContent: "center",
    alignItems: 'center'
  },
  statsUnderline: {
    margin: 6,
    width: 60,
    height: 4,
    borderRadius: 20
  },
  groupStudySection: {
    marginTop: height * 0.01,
    marginBottom: height * 0.02,
  },
  groupStudyWrapper: {
    paddingHorizontal: width * 0.02,
  },
  groupStudyContainer: {
    marginTop: height * 0.01,
    marginBottom: height * 0.02,
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F6FF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F6FF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.02,
    paddingBottom: height * 0.03,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: width * 0.035,
    color: "#6B7280",
  },
  userName: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    color: "#111827",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: width * 0.11,
    height: width * 0.11,
    borderRadius: width * 0.055,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: width * 0.03,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationBadge: {
    position: "absolute",
    top: width * 0.025,
    right: width * 0.025,
    width: width * 0.02,
    height: width * 0.02,
    borderRadius: width * 0.01,
    backgroundColor: "#EF4444",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  profileButton: {
    width: width * 0.11,
    height: width * 0.11,
    borderRadius: width * 0.055,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  profileImage: {
    width: width * 0.11,
    height: width * 0.11,
    borderRadius: width * 0.055,
  },
  profilePlaceholder: {
    width: width * 0.11,
    height: width * 0.11,
    borderRadius: width * 0.055,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    fontSize: width * 0.045,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  progressCard: {
    margin: width * 0.05,
    padding: width * 0.04,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  progressText: {
    fontSize: width * 0.035,
    color: "#6B7280",
    marginBottom: height * 0.02,
  },
  currentCourseContainer: {
    marginTop: height * 0.005,
  },
  currentCourseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: height * 0.01,
  },
  currentCourseLabel: {
    fontSize: width * 0.03,
    color: "#4F46E5",
    fontWeight: "600",
  },
  continueText: {
    fontSize: width * 0.035,
    color: "#4F46E5",
    fontWeight: "500",
  },
  courseTitle: {
    fontSize: width * 0.045,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: height * 0.005,
  },
  courseModule: {
    fontSize: width * 0.035,
    color: "#6B7280",
    marginBottom: height * 0.02,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.02,
  },
  progressBar: {
    flex: 1,
    height: height * 0.01,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginRight: width * 0.03,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4F46E5",
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: width * 0.035,
    fontWeight: "600",
    color: "#111827",
  },
  continueButton: {
    backgroundColor: "#4F46E5",
    paddingVertical: height * 0.015,
    borderRadius: 8,
    alignItems: "center",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: width * 0.04,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginVertical: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.015,
  },
  sectionTitle: {
    fontSize: width * 0.045,
    fontWeight: "bold",
    color: "#111827",
  },
  seeAllText: {
    fontSize: width * 0.035,
    color: "#4F46E5",
  },
  // categoriesList: {
  //   paddingLeft: width * 0.02,
  //   marginBottom: height * 0.03,
  // },
  // categoriesListContent: {
  //   paddingHorizontal: width * 0.03,
  // },
  categoryCard: {
    alignItems: "center",
    marginRight: width * 0.04,
    width: width * 0.18,
  },
  categoryIconContainer: {
    width: width * 0.14,
    height: width * 0.14,
    borderRadius: width * 0.07,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.01,
  },
  categoryName: {
    fontSize: width * 0.03,
    color: "#111827",
    textAlign: "center",
  },
  ecoBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: width * 0.02,
    paddingVertical: height * 0.002,
    borderRadius: 4,
  },
  ecoBadgeText: {
    color: "#FFFFFF",
    fontSize: width * 0.025,
    fontWeight: "600",
  },
  recommendationSubtitle: {
    fontSize: width * 0.035,
    color: "#6B7280",
    marginBottom: height * 0.01,
  },
  recommendationMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: width * 0.04,
  },
  metaText: {
    fontSize: width * 0.03,
    color: "#6B7280",
    marginLeft: width * 0.01,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    marginHorizontal: width * 0.05,
    padding: height * 0.018,
    borderRadius: 12,
    marginTop: height * 0.015,
  },
  securityNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  securityText: { fontSize: width * 0.03, color: '#6B7280', marginLeft: width * 0.02 },

});

export default Home;