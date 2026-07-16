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
    ActivityIndicator,
    Modal,
    TextInput,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { v4 as uuidv4 } from 'uuid';
import api from '../api/axios';

interface AssessmentPreviewProps {
    assessment: any;
    onBack: () => void;
}

const AssessmentPreview: React.FC<AssessmentPreviewProps> = ({ assessment, onBack }) => {
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState(
        assessment.questions?.map((q: any) => ({
            ...q,
            id: q.id || uuidv4(),
        })) || []
    );
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<any>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editData, setEditData] = useState({
        question: '',
        explanation: '',
        marks: 1,
        correctAnswer: '',
        options: [''],
    });

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
            case 'QUESTION_ANSWERE':
                return 'Question Answer';
            default:
                return type;
        }
    };

    // Edit Question
    const openEditModal = (question: any, index: number) => {
        setEditingQuestion(question);
        setEditingIndex(index);
        setEditData({
            question: question.question || '',
            explanation: question.explanation || '',
            marks: question.marks || 1,
            correctAnswer: question.correctAnswer || '',
            options: question.options || [''],
        });
        setEditModalVisible(true);
    };

    const handleEditSave = () => {
        if (editingIndex !== null) {
            const updatedQuestions = [...questions];
            const updatedQuestion = {
                ...updatedQuestions[editingIndex],
                question: editData.question,
                explanation: editData.explanation,
                marks: editData.marks,
                correctAnswer: editData.correctAnswer,
                options: editData.options,
                id: updatedQuestions[editingIndex].id || uuidv4(),
            };
            updatedQuestions[editingIndex] = updatedQuestion;
            setQuestions(updatedQuestions);
            setEditModalVisible(false);
            Alert.alert('Success', 'Question updated successfully!');
        }
    };

    const handleEditOptionChange = (text: string, index: number) => {
        const newOptions = [...editData.options];
        newOptions[index] = text;
        setEditData({ ...editData, options: newOptions });
    };

    const addOption = () => {
        setEditData({
            ...editData,
            options: [...editData.options, ''],
        });
    };

    const removeOption = (index: number) => {
        if (editData.options.length > 1) {
            const newOptions = editData.options.filter((_, i) => i !== index);
            setEditData({ ...editData, options: newOptions });
        }
    };

    // Delete Question
    const handleDeleteQuestion = (index: number) => {
        Alert.alert(
            'Delete Question',
            'Are you sure you want to delete this question?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        const updatedQuestions = questions.filter((_: any, i: number) => i !== index);
                        setQuestions(updatedQuestions);
                        Alert.alert('Success', 'Question deleted successfully!');
                    }
                }
            ]
        );
    };

    // Move Question Up
    const moveQuestionUp = (index: number) => {
        if (index > 0) {
            const updatedQuestions = [...questions];
            [updatedQuestions[index], updatedQuestions[index - 1]] = [updatedQuestions[index - 1], updatedQuestions[index]];
            setQuestions(updatedQuestions);
        }
    };

    // Move Question Down
    const moveQuestionDown = (index: number) => {
        if (index < questions.length - 1) {
            const updatedQuestions = [...questions];
            [updatedQuestions[index], updatedQuestions[index + 1]] = [updatedQuestions[index + 1], updatedQuestions[index]];
            setQuestions(updatedQuestions);
        }
    };

    // Save Draft
    const handleSaveDraft = async () => {
        setLoading(true);
        try {
            // Ensure all questions have UUIDs
            const questionsWithUUID = questions.map((q: any) => ({
                ...q,
                id: q.id || uuidv4(),
                number: questions.indexOf(q) + 1,
            }));

            const payload = {
                title: assessment.title || 'Untitled Assessment',
                instructions: assessment.instructions || '',
                assessmentType: assessment.assessmentType || 'QUIZ',
                programId: assessment.program?.id || '',
                subjectId: assessment.subjectId?.id || '',
                topic: assessment.topic || [],
                difficulty: assessment.difficulty || 'MEDIUM',
                questionTypes: assessment.questionTypes || ['MCQ'],
                questionCount: questions.length,
                totalMarks: questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0),
                additionalInstructions: assessment.additionalInstructions || '',
                questions: questionsWithUUID,
                allStudents: false,
            };

            console.log('Saving draft with payload:', JSON.stringify(payload, null, 2));

            const response = await api.post('/assessments', payload);

            if (response.data.success) {
                Alert.alert(
                    'Success',
                    'Assessment saved as draft successfully!',
                    [{ text: 'OK', onPress: onBack }]
                );
            } else {
                Alert.alert('Error', response.data.message || 'Failed to save draft');
            }
        } catch (error: any) {
            console.error('Save draft error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to save draft');
        } finally {
            setLoading(false);
        }
    };

    // Publish
    const handlePublish = async () => {
        Alert.alert(
            'Publish Assessment',
            'Are you sure you want to publish this assessment?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Publish',
                    style: 'default',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            // Ensure all questions have UUIDs
                            const questionsWithUUID = questions.map((q: any) => ({
                                ...q,
                                id: q.id || uuidv4(),
                                number: questions.indexOf(q) + 1,
                            }));

                            const payload = {
                                title: assessment.title || 'Untitled Assessment',
                                instructions: assessment.instructions || '',
                                assessmentType: assessment.assessmentType || 'QUIZ',
                                programId: assessment.program?.id || '',
                                subjectId: assessment.subjectId?.id || '',
                                topic: assessment.topic || [],
                                difficulty: assessment.difficulty || 'MEDIUM',
                                questionTypes: assessment.questionTypes || ['MCQ'],
                                questionCount: questions.length,
                                totalMarks: questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0),
                                additionalInstructions: assessment.additionalInstructions || '',
                                questions: questionsWithUUID,
                                allStudents: true,
                            };

                            console.log('Publishing assessment with payload:', JSON.stringify(payload, null, 2));
                            
                            // Here you would call the publish API endpoint
                            // For now, simulate API call
                            await new Promise((resolve: any) => setTimeout(resolve, 1500));
                            
                            Alert.alert(
                                'Success',
                                'Assessment published successfully!',
                                [{ text: 'OK', onPress: onBack }]
                            );
                        } catch (error: any) {
                            console.error('Publish error:', error);
                            Alert.alert('Error', error.response?.data?.message || 'Failed to publish assessment');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item, index }: any) => (
        <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
                <View style={styles.questionNumber}>
                    <Text style={styles.questionNumberText}>{index + 1}</Text>
                </View>
                <TouchableOpacity
                    style={styles.questionHeaderContent}
                    onPress={() => toggleQuestion(index)}
                >
                    <View style={styles.questionMeta}>
                        <Text style={styles.questionText} numberOfLines={2}>
                            {item.question}
                        </Text>
                        <View style={styles.questionTags}>
                            <View style={styles.tag}>
                                <Text style={styles.tagText}>{getQuestionTypeLabel(item.type)}</Text>
                            </View>
                            <View style={[styles.tag, { backgroundColor: getDifficultyColor(item.difficulty) + '20' }]}>
                                <Text style={[styles.tagText, { color: getDifficultyColor(item.difficulty) }]}>
                                    {getDifficultyLabel(item.difficulty)}
                                </Text>
                            </View>
                            <View style={styles.tag}>
                                <Text style={styles.tagText}>{item.marks} marks</Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
                <View style={styles.questionActions}>
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => moveQuestionUp(index)}
                        disabled={index === 0 || loading}
                    >
                        <Icon name="chevron-up" size={20} color={index === 0 ? '#CCC' : '#4F46E5'} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => moveQuestionDown(index)}
                        disabled={index === questions.length - 1 || loading}
                    >
                        <Icon name="chevron-down" size={20} color={index === questions.length - 1 ? '#CCC' : '#4F46E5'} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => openEditModal(item, index)}
                        disabled={loading}
                    >
                        <Icon name="edit-2" size={16} color="#4F46E5" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleDeleteQuestion(index)}
                        disabled={loading}
                    >
                        <Icon name="trash-2" size={16} color="#E53935" />
                    </TouchableOpacity>
                    <Icon
                        name={expandedQuestion === index ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#999"
                    />
                </View>
            </View>

            {expandedQuestion === index && (
                <View style={styles.questionBody}>
                    {item.type === 'MCQ' && item.options && (
                        <View style={styles.optionsContainer}>
                            <Text style={styles.optionsTitle}>Options:</Text>
                            {item.options.map((option: string, optIndex: number) => (
                                <View key={optIndex} style={styles.optionItem}>
                                    <View style={[
                                        styles.optionCircle,
                                        option === item.correctAnswer && styles.optionCircleCorrect
                                    ]}>
                                        <Text style={[
                                            styles.optionLetter,
                                            option === item.correctAnswer && styles.optionLetterCorrect
                                        ]}>
                                            {String.fromCharCode(65 + optIndex)}
                                        </Text>
                                    </View>
                                    <Text style={[
                                        styles.optionText,
                                        option === item.correctAnswer && styles.optionTextCorrect
                                    ]}>
                                        {option}
                                    </Text>
                                    {option === item.correctAnswer && (
                                        <Icon name="check-circle" size={16} color="#43A047" style={styles.checkIcon} />
                                    )}
                                </View>
                            ))}
                        </View>
                    )}

                    {item.explanation && (
                        <View style={styles.explanationContainer}>
                            <Text style={styles.explanationTitle}>Explanation:</Text>
                            <Text style={styles.explanationText}>{item.explanation}</Text>
                        </View>
                    )}

                    {item.correctAnswer && item.type !== 'MCQ' && (
                        <View style={styles.correctAnswerContainer}>
                            <Text style={styles.correctAnswerTitle}>Correct Answer:</Text>
                            <Text style={styles.correctAnswerText}>{item.correctAnswer}</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );

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
                    onPress={handleSaveDraft}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#4F46E5" />
                    ) : (
                        <Icon name="save" size={22} color="#4F46E5" />
                    )}
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
                            <Text style={styles.statText}>{questions.length} Questions</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Icon name="award" size={18} color="#666" />
                            <Text style={styles.statText}>
                                {questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0)} Marks
                            </Text>
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
                            <Text style={styles.statusText}>{assessment.status || 'DRAFT'}</Text>
                        </View>
                    </View>
                </View>

                {/* Questions Section */}
                <View style={styles.questionsHeader}>
                    <Text style={styles.questionsTitle}>Questions</Text>
                    <Text style={styles.questionsCount}>{questions.length} questions</Text>
                </View>

                {questions.map((item: any, index: number) => renderItem({ item, index }))}

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.draftButton]}
                        onPress={handleSaveDraft}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#4F46E5" />
                        ) : (
                            <>
                                <Icon name="file-text" size={20} color="#4F46E5" />
                                <Text style={styles.draftButtonText}>Save Draft</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.publishButton]}
                        onPress={handlePublish}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Icon name="send" size={20} color="#FFFFFF" />
                                <Text style={styles.publishButtonText}>Publish</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Edit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Question</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Icon name="x" size={24} color="#1A1A1A" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Question</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={editData.question}
                                    onChangeText={(text) => setEditData({ ...editData, question: text })}
                                    multiline
                                    numberOfLines={4}
                                    placeholder="Enter question"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Explanation</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={editData.explanation}
                                    onChangeText={(text) => setEditData({ ...editData, explanation: text })}
                                    multiline
                                    numberOfLines={3}
                                    placeholder="Enter explanation"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Correct Answer</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editData.correctAnswer}
                                    onChangeText={(text) => setEditData({ ...editData, correctAnswer: text })}
                                    placeholder="Enter correct answer"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Marks</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editData.marks.toString()}
                                    onChangeText={(text) => setEditData({ ...editData, marks: parseInt(text) || 1 })}
                                    keyboardType="numeric"
                                    placeholder="Enter marks"
                                />
                            </View>

                            {editingQuestion?.type === 'MCQ' && (
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Options</Text>
                                    {editData.options.map((option, index) => (
                                        <View key={index} style={styles.optionInputContainer}>
                                            <TextInput
                                                style={styles.optionInput}
                                                placeholder={`Option ${index + 1}`}
                                                value={option}
                                                onChangeText={(text) => handleEditOptionChange(text, index)}
                                            />
                                            {editData.options.length > 1 && (
                                                <TouchableOpacity
                                                    style={styles.removeOptionButton}
                                                    onPress={() => removeOption(index)}
                                                >
                                                    <Icon name="x" size={20} color="#E53935" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ))}
                                    <TouchableOpacity style={styles.addOptionButton} onPress={addOption}>
                                        <Icon name="plus" size={18} color="#4F46E5" />
                                        <Text style={styles.addOptionText}>Add Option</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <TouchableOpacity style={styles.saveEditButton} onPress={handleEditSave}>
                                <Text style={styles.saveEditButtonText}>Save Changes</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
        paddingBottom: 100,
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
    questionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    questionsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    questionsCount: {
        fontSize: 14,
        color: '#666',
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
        gap: 8,
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
    questionHeaderContent: {
        flex: 1,
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
    questionActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionButton: {
        padding: 4,
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
    correctAnswerContainer: {
        backgroundColor: '#E8F5E9',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    correctAnswerTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#43A047',
        marginBottom: 4,
    },
    correctAnswerText: {
        fontSize: 13,
        color: '#1A1A1A',
        lineHeight: 18,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
        marginBottom: 20,
    },
    draftButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#E8EAF6',
        gap: 8,
    },
    draftButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4F46E5',
    },
    publishButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#4F46E5',
        gap: 8,
    },
    publishButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    modalBody: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    optionInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    optionInput: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    removeOptionButton: {
        padding: 8,
        marginLeft: 8,
    },
    addOptionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    addOptionText: {
        fontSize: 14,
        color: '#4F46E5',
        fontWeight: '500',
        marginLeft: 4,
    },
    saveEditButton: {
        backgroundColor: '#4F46E5',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    saveEditButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AssessmentPreview;