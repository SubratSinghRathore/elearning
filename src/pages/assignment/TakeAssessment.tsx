// pages/academics/TakeAssessment.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../api/axios';

// Simple types - using any for route params
interface Question {
  id: string;
  question: string;
  marks: number;
  difficulty: string;
  explanation: string;
  type: string;
  options?: string[];
  correctAnswer?: string;
  number: number;
}

interface Assessment {
  id: string;
  title: string;
  instructions: string;
  assessmentType: string;
  subjectId: {
    id: string;
    name: string;
  } | string;
  batchId: string[];
  topic: string[];
  difficulty: string;
  questionTypes: string[];
  questionCount: number;
  totalMarks: number;
  additionalInstructions: string;
  questions: Question[];
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface AssessmentResult {
  id: string;
  studentName: string;
  assessmentId: string;
  studentId: string;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  answers: Record<string, string>;
  reviews: any[];
  submittedAt: string;
}

const TakeAssessment = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { assessmentId } = route.params as { assessmentId: string };

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    fetchAssessment();
  }, []);

  const fetchAssessment = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/assessments/${assessmentId}`);
      
      if (response.data.success && response.data.data) {
        setAssessment(response.data.data);
      } else {
        Alert.alert('Error', 'Failed to load assessment');
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Error fetching assessment:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load assessment');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleTextAnswerChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: text,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < (assessment?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    const totalQuestions = assessment?.questions?.length || 0;
    const answeredCount = Object.keys(answers).length;

    if (answeredCount < totalQuestions) {
      Alert.alert(
        'Incomplete Assessment',
        `You have answered ${answeredCount} out of ${totalQuestions} questions. Do you want to submit anyway?`,
        [
          { text: 'Continue', style: 'cancel' },
          { text: 'Submit', onPress: confirmSubmit },
        ]
      );
    } else {
      confirmSubmit();
    }
  };

  const confirmSubmit = () => {
    Alert.alert(
      'Submit Assessment',
      'Are you sure you want to submit your answers?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: submitAssessment },
      ]
    );
  };

  const submitAssessment = async () => {
    setSubmitting(true);
    try {
      const payload = {
        assessmentId: assessmentId,
        answers: answers,
      };

      console.log('Submitting answers:', payload);

      const response = await api.post('/assessment-results/submit', payload);

      if (response.data.success && response.data.data) {
        setResult(response.data.data);
        setShowResult(true);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to submit assessment');
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const getSubjectName = (subject: any): string => {
    if (typeof subject === 'string') return subject;
    return subject?.name || 'N/A';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return '#43A047';
      case 'MEDIUM':
        return '#FB8C00';
      case 'HARD':
        return '#E53935';
      case 'MIXED':
        return '#8E24AA';
      default:
        return '#666';
    }
  };

  const getOptionLetter = (index: number) => {
    return String.fromCharCode(65 + index);
  };

  const isQuestionAnswered = (questionId: string) => {
    return answers[questionId] !== undefined && answers[questionId].trim() !== '';
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading assessment...</Text>
      </View>
    );
  }

  if (!assessment) {
    return (
      <View style={styles.centered}>
        <Icon name="alert-circle" size={64} color="#E53935" />
        <Text style={styles.errorText}>Assessment not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showResult && result) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.resultContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.resultHeader}>
            <Icon name="check-circle" size={60} color="#43A047" />
            <Text style={styles.resultTitle}>Assessment Completed!</Text>
            <Text style={styles.resultSubtitle}>{assessment.title}</Text>
          </View>

          <View style={styles.resultCard}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Score</Text>
              <Text style={styles.resultValue}>
                {result.obtainedMarks} / {result.totalMarks}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Percentage</Text>
              <Text style={[styles.resultValue, { color: result.percentage >= 60 ? '#43A047' : '#E53935' }]}>
                {result.percentage}%
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Correct</Text>
              <Text style={[styles.resultValue, { color: '#43A047' }]}>{result.correctCount}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Wrong</Text>
              <Text style={[styles.resultValue, { color: '#E53935' }]}>{result.wrongCount}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Skipped</Text>
              <Text style={[styles.resultValue, { color: '#FB8C00' }]}>{result.skippedCount}</Text>
            </View>
          </View>

          <Text style={styles.reviewTitle}>Question Review</Text>

          {result.reviews.map((review: any, index: number) => (
            <View key={index} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewNumber}>
                  <Text style={styles.reviewNumberText}>{review.number}</Text>
                </View>
                <Text style={[styles.reviewStatus, review.isCorrect ? styles.correctStatus : styles.wrongStatus]}>
                  {review.isCorrect ? 'Correct' : 'Wrong'}
                </Text>
                <Text style={styles.reviewMarks}>
                  {review.isCorrect ? `+${review.marks}` : `0/${review.marks}`}
                </Text>
              </View>
              <Text style={styles.reviewQuestion}>{review.question}</Text>
              {review.selectedAnswer && (
                <View style={styles.reviewAnswer}>
                  <Text style={styles.reviewAnswerLabel}>Your Answer:</Text>
                  <Text style={[styles.reviewAnswerText, review.isCorrect ? styles.correctText : styles.wrongText]}>
                    {review.selectedAnswer}
                  </Text>
                </View>
              )}
              {!review.selectedAnswer && (
                <View style={styles.reviewAnswer}>
                  <Text style={styles.reviewAnswerLabel}>Your Answer:</Text>
                  <Text style={[styles.reviewAnswerText, styles.skippedText]}>Skipped</Text>
                </View>
              )}
              <View style={styles.reviewAnswer}>
                <Text style={styles.reviewAnswerLabel}>Correct Answer:</Text>
                <Text style={[styles.reviewAnswerText, styles.correctText]}>
                  {review.correctAnswer || 'N/A'}
                </Text>
              </View>
              {review.explanation && (
                <View style={styles.reviewExplanation}>
                  <Text style={styles.reviewExplanationLabel}>Explanation:</Text>
                  <Text style={styles.reviewExplanationText}>{review.explanation}</Text>
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const totalQuestions = assessment.questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isAnswered = isQuestionAnswered(currentQuestion.id);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Take Assessment</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Assessment Info */}
      <View style={styles.infoBar}>
        <Text style={styles.infoTitle} numberOfLines={1}>{assessment.title}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>{assessment.assessmentType}</Text>
          <Text style={styles.infoDot}>•</Text>
          <Text style={styles.infoText}>{getSubjectName(assessment.subjectId)}</Text>
          <Text style={styles.infoDot}>•</Text>
          <Text style={styles.infoText}>{assessment.totalMarks} marks</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </Text>
      </View>

      {/* Question */}
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView 
          style={styles.questionContainer} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.questionNumber}>
                <Text style={styles.questionNumberText}>Q{currentQuestion.number}</Text>
              </View>
              <View style={styles.questionMeta}>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(currentQuestion.difficulty) + '20' }]}>
                  <Text style={[styles.difficultyText, { color: getDifficultyColor(currentQuestion.difficulty) }]}>
                    {currentQuestion.difficulty}
                  </Text>
                </View>
                <Text style={styles.questionMarks}>{currentQuestion.marks} marks</Text>
              </View>
            </View>

            <Text style={styles.questionText}>{currentQuestion.question}</Text>

            {/* MCQ Options */}
            {currentQuestion.type === 'MCQ' && currentQuestion.options && (
              <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option, index) => {
                  const isSelected = answers[currentQuestion.id] === option;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionButtonSelected,
                      ]}
                      onPress={() => handleSelectAnswer(currentQuestion.id, option)}
                    >
                      <View style={[
                        styles.optionCircle,
                        isSelected && styles.optionCircleSelected,
                      ]}>
                        <Text style={[
                          styles.optionLetter,
                          isSelected && styles.optionLetterSelected,
                        ]}>
                          {getOptionLetter(index)}
                        </Text>
                      </View>
                      <Text style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}>
                        {option}
                      </Text>
                      {isSelected && (
                        <Icon name="check-circle" size={20} color="#4F46E5" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* True/False Options */}
            {currentQuestion.type === 'TRUE_FALSE' && currentQuestion.options && (
              <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option, index) => {
                  const isSelected = answers[currentQuestion.id] === option;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionButtonSelected,
                      ]}
                      onPress={() => handleSelectAnswer(currentQuestion.id, option)}
                    >
                      <View style={[
                        styles.optionCircle,
                        isSelected && styles.optionCircleSelected,
                      ]}>
                        <Text style={[
                          styles.optionLetter,
                          isSelected && styles.optionLetterSelected,
                        ]}>
                          {getOptionLetter(index)}
                        </Text>
                      </View>
                      <Text style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}>
                        {option}
                      </Text>
                      {isSelected && (
                        <Icon name="check-circle" size={20} color="#4F46E5" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Question Answer - Text Input */}
            {(currentQuestion.type === 'QUESTION_ANSWER' || currentQuestion.type === 'QUESTION_ANSWERE') && (
              <View style={styles.textAnswerContainer}>
                <TextInput
                  style={styles.textAnswerInput}
                  placeholder="Type your answer here..."
                  placeholderTextColor="#999"
                  value={answers[currentQuestion.id] || ''}
                  onChangeText={(text) => handleTextAnswerChange(currentQuestion.id, text)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <Text style={styles.textAnswerHint}>
                  Write a detailed answer for this question.
                </Text>
              </View>
            )}

            {/* Question Navigator */}
            <View style={styles.questionNavigator}>
              {assessment.questions.map((q, index) => (
                <TouchableOpacity
                  key={q.id}
                  style={[
                    styles.questionDot,
                    index === currentQuestionIndex && styles.questionDotActive,
                    isQuestionAnswered(q.id) && styles.questionDotAnswered,
                  ]}
                  onPress={() => setCurrentQuestionIndex(index)}
                >
                  <Text style={[
                    styles.questionDotText,
                    index === currentQuestionIndex && styles.questionDotTextActive,
                    isQuestionAnswered(q.id) && styles.questionDotTextAnswered,
                  ]}>
                    {index + 1}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, styles.prevButton, isFirstQuestion && styles.disabledButton]}
          onPress={handlePrevious}
          disabled={isFirstQuestion}
        >
          <Icon name="chevron-left" size={20} color={isFirstQuestion ? '#999' : '#4F46E5'} />
          <Text style={[styles.footerPreviousButtonText, isFirstQuestion && styles.disabledText]}>Previous</Text>
        </TouchableOpacity>

        {isLastQuestion ? (
          <TouchableOpacity
            style={[styles.footerButton, styles.submitButton, submitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Submit</Text>
                <Icon name="send" size={20} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.footerButton, styles.nextButton]}
            onPress={handleNext}
          >
            <Text style={styles.footerNextButtonText}>Next</Text>
            <Icon name="chevron-right" size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FF',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#1A1A1A',
    marginTop: 12,
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  headerRight: {
    width: 32,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  infoBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
  },
  infoDot: {
    fontSize: 13,
    color: '#999',
    marginHorizontal: 4,
  },
  progressContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  questionContainer: {
    flex: 1,
    padding: 16,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    backgroundColor: '#E8EAF6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  questionNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '500',
  },
  questionMarks: {
    fontSize: 12,
    color: '#666',
  },
  questionText: {
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 24,
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: '#E8EAF6',
    borderColor: '#4F46E5',
  },
  optionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  optionCircleSelected: {
    backgroundColor: '#4F46E5',
  },
  optionLetter: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  optionLetterSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
  },
  optionTextSelected: {
    color: '#4F46E5',
  },
  textAnswerContainer: {
    marginTop: 4,
  },
  textAnswerInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  textAnswerHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    fontStyle: 'italic',
  },
  questionNavigator: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  questionDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionDotActive: {
    backgroundColor: '#4F46E5',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  questionDotAnswered: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#43A047',
  },
  questionDotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  questionDotTextActive: {
    color: '#FFFFFF',
  },
  questionDotTextAnswered: {
    color: '#43A047',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
    gap: 4,
  },
  prevButton: {
    backgroundColor: '#F5F5F5',
  },
  nextButton: {
    backgroundColor: '#4F46E5',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
  },
  footerPreviousButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  footerNextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#999',
  },
  // Result Styles
  resultContainer: {
    flex: 1,
    padding: 16,
  },
  resultHeader: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 12,
  },
  resultSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  resultCard: {
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
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  reviewNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8EAF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  reviewStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  correctStatus: {
    backgroundColor: '#E8F5E9',
    color: '#43A047',
  },
  wrongStatus: {
    backgroundColor: '#FFEBEE',
    color: '#E53935',
  },
  reviewMarks: {
    marginLeft: 'auto',
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  reviewQuestion: {
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 8,
    lineHeight: 20,
  },
  reviewAnswer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  reviewAnswerLabel: {
    fontSize: 12,
    color: '#999',
    marginRight: 6,
    minWidth: 80,
  },
  reviewAnswerText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  correctText: {
    color: '#43A047',
  },
  wrongText: {
    color: '#E53935',
  },
  skippedText: {
    color: '#FB8C00',
  },
  reviewExplanation: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  reviewExplanationLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  reviewExplanationText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  doneButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TakeAssessment;