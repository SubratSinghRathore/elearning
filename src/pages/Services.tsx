import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '../components/header.component/Header'
import Footer from '../components/footer.component/Footer'
import Card from '../components/home.component/Card'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { useNavigation } from '@react-navigation/native'
import { RootTabParamList } from '../navigator/BottomNavigator'

const cards = [
  { icon: 'console', title: 'Custom App Development', description: 'Tailored mobile and desktop applications built with modern architectures like React Native and Flutter. We focus on high-performance, native-like experiences. that engage users.' },
  { icon: 'creation', title: 'Enterprise CRM', description: 'Centralize your customer data with ‘custom-built CRM solutions designed for complex sales cycles.' },
  { icon: 'web', title: 'High-Performance Web', description: 'Static-site generation and server-side rendering for lightning-fast web experiences.' },
  { icon: 'transit-connection', title: 'Scalable ERP Solutions', description: 'Integrated resource planning systems that synchronize finance, supply chain, and HR workflows intoa unified cloud-based engine.' },
  { icon: 'rocket', title: 'Digital Marketing', description: 'We help businesses grow online with result-driven digital marketing strategies, including SEO, social media marketing, and paid ads.' }
];

export default function Services() {

  type NavigationProp = BottomTabNavigationProp<RootTabParamList>;

  const navigation = useNavigation<NavigationProp>();
  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={{ flex: 1, backgroundColor: "#031825" }}
    >
      <ScrollView style={{ backgroundColor: "#031825" }}>
        <Header />
        <View>
          <View style={styles.container}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>EXPERT SOLLUTIONS</Text>
            </View>

            <Text style={styles.headingWhite}>Engineering</Text>
            <Text style={styles.headingGreen}>Future-Proof</Text>

            <Text style={styles.headingGreen}>Digital</Text>
            <Text style={styles.headingWhite}>Ecosystem</Text>

            <Text style={styles.description}>
              We combine technical ecosystem sophistication with agile methodology to deliver robust enterprise solutions that scale with your growth.
            </Text>

            <TouchableOpacity style={styles.primaryBtn}>
              <Text style={styles.primaryText} onPress={() => navigation.navigate("Connect")}>START YOUR JOURNEY</Text>
            </TouchableOpacity>

            <View style={{ paddingBottom: 32 }}>
              {cards.map(card => (
                <Card
                  key={card.title}
                  icon={card.icon}
                  title={card.title}
                  description={card.description}
                />
              ))}
            </View>
          </View>
        </View>
        <Footer />
      </ScrollView>
    </SafeAreaView >
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#031825",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 25
  },

  badge: {
    borderWidth: 1,
    borderColor: "#1fa58d",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 15,
    marginBottom: 25,
  },

  badgeText: {
    color: "#40debc",
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "600",
  },

  headingWhite: {
    color: "#d7e3f3",
    fontSize: 38,
    fontWeight: "800",
    textAlign: "center",
  },

  headingGreen: {
    color: "#40debc",
    fontSize: 40,
    fontWeight: "800",
    textAlign: "center",
  },

  description: {
    color: "#9fb2c7",
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 10,
  },

  primaryBtn: {
    backgroundColor: "#40debc",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 30,
  },

  primaryText: {
    color: "#052336",
    fontWeight: "700",
    fontSize: 14,
  },

  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#40debc",
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 10,
    marginTop: 12,
  },

  secondaryText: {
    color: "#40debc",
    fontWeight: "600",
    fontSize: 14,
  },
});