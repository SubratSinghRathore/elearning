import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/header.component/Header";
import Footer from "../components/footer.component/Footer";

const servicesList: string[] = [
  "Web Development",
  "Mobile App",
  "UI/UX Design",
  "Digital Marketing",
  "ERP Solutions",
  "AI & Automation",
  "Other"
];

const budgetList: string[] = [
  "< ₹1 Lakh",
  "₹1–5 Lakh",
  "₹5–15 Lakh",
  "₹15–50 Lakh",
  "₹50 Lakh+"
];

type FormType = {
  name: string;
  email: string;
  phone: string;
  company: string;
  project: string;
};

export default function Connect() {

  const [form, setForm] = useState<FormType>({
    name: "",
    email: "",
    phone: "",
    company: "",
    project: ""
  });

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);

  const toggleService = (service: string) => {
    if (selectedServices.includes(service)) {
      setSelectedServices(selectedServices.filter(s => s !== service));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

const submitForm = async () => {

  if (!form.name || !form.email || !form.project) {
    Alert.alert("Error", "Please fill required fields");
    return;
  }

  try {

    const formData = new FormData();

    formData.append("access_key", "a4be4a17-c3f0-42e2-9ef2-3184e17f785a");
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("phone", form.phone);
    formData.append("company", form.company);
    formData.append("message", form.project);
    formData.append("services", selectedServices.join(", "));
    formData.append("budget", selectedBudget || "");

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    console.log(data);

    if (data.success) {
      Alert.alert("Success", "Message sent successfully");
    } else {
      Alert.alert("Error", data.message);
    }

  } catch (error) {
    console.log(error);
    Alert.alert("Error", "Something went wrong");
  }

};

  return (
      <ScrollView style={{ backgroundColor: "#031825" }}>

        <Header />

        <View style={styles.container}>

          <Text style={styles.step}>STEP 1 OF 3</Text>
          <Text style={styles.heading}>Your Details</Text>

          <Text style={styles.description}>
            Tell us who you are so we can personalise our response.
          </Text>

          <View style={styles.row}>
            <TextInput
              placeholder="Full Name *"
              placeholderTextColor="#9fb2c7"
              style={styles.input}
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
            />

            <TextInput
              placeholder="Email Address *"
              placeholderTextColor="#9fb2c7"
              style={styles.input}
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
            />
          </View>

          <View style={styles.row}>
            <TextInput
              placeholder="Phone Number"
              placeholderTextColor="#9fb2c7"
              style={styles.input}
              value={form.phone}
              onChangeText={(text) => setForm({ ...form, phone: text })}
            />

            <TextInput
              placeholder="Company Name"
              placeholderTextColor="#9fb2c7"
              style={styles.input}
              value={form.company}
              onChangeText={(text) => setForm({ ...form, company: text })}
            />
          </View>

          <Text style={styles.step}>STEP 2 — SERVICES NEEDED</Text>

          <View style={styles.tagsContainer}>
            {servicesList.map(service => {

              const active = selectedServices.includes(service);

              return (
                <TouchableOpacity
                  key={service}
                  style={[styles.tag, active && styles.tagActive]}
                  onPress={() => toggleService(service)}
                >
                  <Text style={[styles.tagText, active && styles.tagTextActive]}>
                    {service}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.step}>STEP 3 — ESTIMATED BUDGET</Text>

          <View style={styles.tagsContainer}>
            {budgetList.map(budget => {

              const active = selectedBudget === budget;

              return (
                <TouchableOpacity
                  key={budget}
                  style={[styles.tag, active && styles.tagActive]}
                  onPress={() => setSelectedBudget(budget)}
                >
                  <Text style={[styles.tagText, active && styles.tagTextActive]}>
                    {budget}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            placeholder="Tell us about your project *"
            placeholderTextColor="#9fb2c7"
            multiline
            numberOfLines={6}
            style={styles.textArea}
            value={form.project}
            onChangeText={(text) => setForm({ ...form, project: text })}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={submitForm}>
            <Text style={styles.submitText}>SEND MESSAGE</Text>
          </TouchableOpacity>

        </View>

        <Footer />

      </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    backgroundColor: "#031825",
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 50
  },

  step: {
    color: "#40debc",
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 8
  },

  heading: {
    color: "#d7e3f3",
    fontSize: 34,
    fontWeight: "800",
    marginBottom: 10
  },

  description: {
    color: "#9fb2c7",
    fontSize: 14,
    marginBottom: 25
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15
  },

  input: {
    backgroundColor: "#0c1b35",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 15,
    color: "#d7e3f3",
    width: "48%"
  },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    marginBottom: 20
  },

  tag: {
    borderWidth: 1,
    borderColor: "#1fa58d",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 10,
    marginBottom: 10
  },

  tagActive: {
    backgroundColor: "#40debc"
  },

  tagText: {
    color: "#d7e3f3",
    fontSize: 13
  },

  tagTextActive: {
    color: "#052336",
    fontWeight: "700"
  },

  textArea: {
    backgroundColor: "#0c1b35",
    borderRadius: 10,
    padding: 15,
    color: "#d7e3f3",
    marginTop: 10,
    textAlignVertical: "top"
  },

  submitBtn: {
    backgroundColor: "#40debc",
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 25,
    alignItems: "center"
  },

  submitText: {
    color: "#052336",
    fontWeight: "700"
  }

});