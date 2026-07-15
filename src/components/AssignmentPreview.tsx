// pages/academics/AssessmentPreview.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface AssessmentPreviewProps {
  assessment: any;
  onBack: () => void;
}

const AssessmentPreview: React.FC<AssessmentPreviewProps> = ({ assessment, onBack }) => {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const toggleQuestion = (index: number) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return '#43A047';
      case 'MEDIUM':
        return '#FB8C00';
      case 'HARD':
        return '#E53935';
      default:
        return '#666';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'Easy';
      case 'MEDIUM':
        return 'Medium';
      case 'HARD':
        return 'Hard';
      default:
        return difficulty;
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'MCQ':
        return 'Multiple Choice';
      case 'TRUE_FALSE':
        return 'True / False';
      case 'QUESTION_ANSWER':
        return 'Question Answer';
      default:
        return type;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assessment Preview</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={() => Alert.alert('Success', 'Assessment saved successfully!')}
        >
          <Icon name="save" size={22} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Assessment Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.assessmentTitle}>{assessment.title}</Text>
          <Text style={styles.assessmentInstructions}>{assessment.instructions}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>{assessment.assessmentType}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Program</Text>
              <Text style={styles.infoValue}>{assessment.program?.name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Subject</Text>
              <Text style={styles.infoValue}>{assessment.subjectId?.name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Difficulty</Text>
              <View style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(assessment.difficulty) + '20' }
              ]}>
                <Text style={[
                  styles.difficultyBadgeText,
                  { color: getDifficultyColor(assessment.difficulty) }
                ]}>
                  {getDifficultyLabel(assessment.difficulty)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon name="file-text" size={18} color="#666" />
              <Text style={styles.statText}>{assessment.questionCount} Questions</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="award" size={18} color="#666" />
              <Text style={styles.statText}>{assessment.totalMarks} Marks</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="book" size={18} color="#666" />
              <Text style={styles.statText}>{assessment.topic?.join(', ')}</Text>
            </View>
          </View>

          {assessment.additionalInstructions && (
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsLabel}>Additional Instructions</Text>
              <Text style={styles.instructionsText}>{assessment.additionalInstructions}</Text>
            </View>
          )}

          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{assessment.status}</Text>
            </View>
          </View>
        </View>

        {/* Questions Section */}
        <Text style={styles.questionsTitle}>Questions</Text>

        {assessment.questions?.map((question: any, index: number) => (
          <View key={index} style={styles.questionCard}>
            <TouchableOpacity
              style={styles.questionHeader}
              onPress={() => toggleQuestion(index)}
            >
              <View style={styles.questionNumber}>
                <Text style={styles.questionNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.questionMeta}>
                <Text style={styles.questionText} numberOfLines={2}>
                  {question.question}
                </Text>
                <View style={styles.questionTags}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{getQuestionTypeLabel(question.type)}</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: getDifficultyColor(question.difficulty) + '20' }]}>
                    <Text style={[styles.tagText, { color: getDifficultyColor(question.difficulty) }]}>
                      {getDifficultyLabel(question.difficulty)}
                    </Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{question.marks} marks</Text>
                  </View>
                </View>
              </View>
              <Icon 
                name={expandedQuestion === index ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color="#999" 
              />
            </TouchableOpacity>

            {expandedQuestion === index && (
              <View style={styles.questionBody}>
                {question.type === 'MCQ' && question.options && (
                  <View style={styles.optionsContainer}>
                    <Text style={styles.optionsTitle}>Options:</Text>
                    {question.options.map((option: string, optIndex: number) => (
                      <View key={optIndex} style={styles.optionItem}>
                        <View style={[
                          styles.optionCircle,
                          option === question.correctAnswer && styles.optionCircleCorrect
                        ]}>
                          <Text style={[
                            styles.optionLetter,
                            option === question.correctAnswer && styles.optionLetterCorrect
                          ]}>
                            {String.fromCharCode(65 + optIndex)}
                          </Text>
                        </View>
                        <Text style={[
                          styles.optionText,
                          option === question.correctAnswer && styles.optionTextCorrect
                        ]}>
                          {option}
                        </Text>
                        {option === question.correctAnswer && (
                          <Icon name="check-circle" size={16} color="#43A047" style={styles.checkIcon} />
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {question.explanation && (
                  <View style={styles.explanationContainer}>
                    <Text style={styles.explanationTitle}>Explanation:</Text>
                    <Text style={styles.explanationText}>{question.explanation}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ))}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  saveButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  assessmentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  assessmentInstructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  difficultyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: '#666',
  },
  instructionsContainer: {
    backgroundColor: '#F5F6FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  instructionsLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#43A047',
  },
  questionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  questionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8EAF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  questionMeta: {
    flex: 1,
  },
  questionText: {
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 6,
  },
  questionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  questionBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  optionCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionCircleCorrect: {
    borderColor: '#43A047',
    backgroundColor: '#43A047',
  },
  optionLetter: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  optionLetterCorrect: {
    color: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
  },
  optionTextCorrect: {
    color: '#43A047',
    fontWeight: '500',
  },
  checkIcon: {
    marginLeft: 4,
  },
  explanationContainer: {
    backgroundColor: '#F5F6FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  explanationTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 13,
    color: '#1A1A1A',
    lineHeight: 18,
  },
});

export default AssessmentPreview;