// pages/Academics.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';

// Sub-category components
import ProgramsScreen from './pages/ProgramsScreen';
import BatchesScreen from './pages/BatchesScreen';
import SubjectsScreen from './pages/SubjectScreen';
// import PeopleScreen from './academics/PeopleScreen';
import TeachersScreen from './pages/TeachersScreen';
import AdmissionsScreen from './pages/AdmissionsScreen';
// import StudentsScreen from './academics/StudentsScreen';
// import TeachingScreen from './academics/TeachingScreen';
// import CoursesScreen from './academics/CoursesScreen';
// import LiveClassesScreen from './academics/LiveClassesScreen';
// import GroupStudyScreen from './academics/GroupStudyScreen';
// import AssignmentsScreen from './academics/AssignmentsScreen';
import CreateAssessmentScreen from './pages/CreateAssignment';
// import LearningContentScreen from './academics/LearningContentScreen';
// import ContentLibraryScreen from './academics/ContentLibraryScreen';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  subCategories: SubCategory[];
}

interface SubCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  count?: number;
  component: React.ComponentType<any>;
}

const Academics = () => {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState<string>('Academic Management');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Define categories and their sub-categories
  const categories: Category[] = [
    {
      id: '1',
      name: 'Academic Management',
      icon: 'book-open',
      color: '#4F46E5',
      subCategories: [
        { 
          id: '1-1', 
          name: 'Programs', 
          icon: 'grid', 
          color: '#4F46E5',
          component: ProgramsScreen 
        },
        { 
          id: '1-2', 
          name: 'Batches', 
          icon: 'users', 
          color: '#43A047',
          component: BatchesScreen 
        },
        { 
          id: '1-3', 
          name: 'Subjects', 
          icon: 'book', 
          color: '#FB8C00',
          component: SubjectsScreen 
        },
      ]
    },
    {
      id: '2',
      name: 'People Management',
      icon: 'users',
      color: '#8E24AA',
      subCategories: [
        { 
          id: '2-1', 
          name: 'Teachers', 
          icon: 'user-check', 
          color: '#1E88E5',
          component: TeachersScreen 
        },
        // { 
        //   id: '2-2', 
        //   name: 'Students', 
        //   icon: 'user', 
        //   color: '#43A047',
        //   component: StudentsScreen 
        // },
        { 
          id: '2-3', 
          name: 'Admissions', 
          icon: 'user-plus', 
          color: '#E53935',
          component: AdmissionsScreen 
        },
        // { 
        //   id: '2-4', 
        //   name: 'People', 
        //   icon: 'users', 
        //   color: '#8E24AA',
        //   component: PeopleScreen 
        // },
      ]
    },
    {
      id: '3',
      name: 'Teaching & Learning',
      icon: 'monitor',
      color: '#FF6F00',
      subCategories: [
        // { 
        //   id: '3-1', 
        //   name: 'Teaching', 
        //   icon: 'monitor', 
        //   color: '#FF6F00',
        //   component: TeachingScreen 
        // },
        // { 
        //   id: '3-2', 
        //   name: 'Courses', 
        //   icon: 'book-open', 
        //   color: '#6A1B9A',
        //   component: CoursesScreen 
        // },
      ]
    },
    {
      id: '4',
      name: 'Assessment & Content',
      icon: 'file-text',
      color: '#7B1FA2',
      subCategories: [
    //     { 
    //       id: '4-1', 
    //       name: 'Assignments', 
    //       icon: 'file-text', 
    //       color: '#F57C00',
    //       component: AssignmentsScreen 
    //     },
        { 
          id: '4-2', 
          name: 'Create Assessment', 
          icon: 'edit', 
          color: '#7B1FA2',
          component: CreateAssessmentScreen 
        },
    //     { 
    //       id: '4-3', 
    //       name: 'Learning Content', 
    //       icon: 'film', 
    //       color: '#00838F',
    //       component: LearningContentScreen 
    //     },
    //     { 
    //       id: '4-4', 
    //       name: 'Content Library', 
    //       icon: 'archive', 
    //       color: '#2E7D32',
    //       component: ContentLibraryScreen 
    //     },
      ]
    },
  ];

  // Get current category data
  const currentCategory = categories.find(cat => cat.name === selectedCategory);
  const subCategories = currentCategory?.subCategories || [];

  // Get current sub-category component
  const currentSubCategory = subCategories.find(sub => sub.name === selectedSubCategory);
  const CurrentComponent = currentSubCategory?.component;

  // Handle category selection
  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setSelectedSubCategory(null);
  };

  // Handle sub-category selection
  const handleSubCategorySelect = (subCategoryName: string) => {
    setSelectedSubCategory(subCategoryName);
  };

  // Go back to sub-categories list
  const handleBack = () => {
    setSelectedSubCategory(null);
  };

  // Render category item
  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        selectedCategory === item.name && styles.categoryCardActive,
        { borderLeftColor: item.color }
      ]}
      onPress={() => handleCategorySelect(item.name)}
    >
      <View style={[styles.categoryIconContainer, { backgroundColor: item.color + '20' }]}>
        <Icon name={item.icon} size={24} color={item.color} />
      </View>
      <View style={styles.categoryInfo}>
        <Text style={[
          styles.categoryName,
          selectedCategory === item.name && styles.categoryNameActive
        ]}>
          {item.name}
        </Text>
        <Text style={styles.categoryCount}>
          {item.subCategories.length} sub-categories
        </Text>
      </View>
      <Icon 
        name={selectedCategory === item.name ? 'chevron-down' : 'chevron-right'} 
        size={20} 
        color="#999" 
      />
    </TouchableOpacity>
  );

  // Render sub-category item
  const renderSubCategoryItem = ({ item }: { item: SubCategory }) => (
    <TouchableOpacity
      style={styles.subCategoryCard}
      onPress={() => handleSubCategorySelect(item.name)}
    >
      <View style={[styles.subCategoryIconContainer, { backgroundColor: item.color + '15' }]}>
        <Icon name={item.icon} size={22} color={item.color} />
      </View>
      <View style={styles.subCategoryInfo}>
        <Text style={styles.subCategoryName}>{item.name}</Text>
        {item.count !== undefined && (
          <Text style={styles.subCategoryCount}>{item.count} items</Text>
        )}
      </View>
      <Icon name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  );

  // If a sub-category is selected, render its component
  if (selectedSubCategory && CurrentComponent) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F6FF" />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedSubCategory}</Text>
          <View style={styles.headerRight} />
        </View>
        <CurrentComponent />
      </SafeAreaView>
    );
  }

  // Main Academics view with categories and sub-categories
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Academics</Text>
        <TouchableOpacity onPress={() => {/* Handle search */}}>
          <Icon name="search" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search academics..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
        </View>

        {/* Sub-Categories Section */}
        {subCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedCategory} Sub-Categories
            </Text>
            <FlatList
              data={subCategories}
              renderItem={renderSubCategoryItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerRight: {
    width: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryCardActive: {
    backgroundColor: '#F0F0FF',
    borderLeftColor: '#4F46E5',
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  categoryNameActive: {
    color: '#4F46E5',
  },
  categoryCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  subCategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  subCategoryIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subCategoryInfo: {
    flex: 1,
  },
  subCategoryName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  subCategoryCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 1,
  },
});

export default Academics;