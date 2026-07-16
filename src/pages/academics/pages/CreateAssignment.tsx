// pages/academics/CreateAssessment.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import api from '../../../api/axios';
import AssessmentPreview from '../../../components/AssignmentPreview';

interface Program {
    id: string;
    name: string;
    fullName: string;
    programType: string;
}

interface Subject {
    id: string;
    name: string;
    description: string;
    program: {
        id: string;
        name: string;
    };
}

interface ProgramApiResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data: {
        programs: Program[];
        totalPrograms: number;
    };
}

interface SubjectApiResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data: {
        subjects: Subject[];
        totalSubjects: number;
    };
}

const CreateAssessment = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [loadingPrograms, setLoadingPrograms] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [generatedAssessment, setGeneratedAssessment] = useState<any>(null);

    // Form data
    const [formData, setFormData] = useState({
        assessmentType: 'QUIZ',
        programId: '',
        subjectId: '',
        topics: [''],
        difficulty: 'MEDIUM',
        questionTypes: ['MCQ'],
        questionCount: 5,
        totalMarks: 10,
        additionalInstructions: '',
    });

    // Data from API
    const [programs, setPrograms] = useState<Program[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    // Assessment options
    const assessmentTypes = [
        { label: 'Quiz', value: 'QUIZ', description: 'Short objective questions.' },
        { label: 'Assignment', value: 'ASSIGNMENT', description: 'Long-form descriptive questions.' },
        { label: 'Question Paper', value: 'QUESTION_PAPER', description: 'Structured exam format.' },
    ];

    const difficulties = [
        { label: 'Easy', value: 'EASY' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'Hard', value: 'HARD' },
        { label: 'Mixed', value: 'MIXED' },
    ];

    const questionTypes = [
        { label: 'MCQ', value: 'MCQ' },
        { label: 'True / False', value: 'TRUE_FALSE' },
        { label: 'Question Answer', value: 'QUESTION_ANSWER' },
    ];

    useEffect(() => {
        fetchPrograms();
    }, []);

    useEffect(() => {
        if (formData.programId) {
            fetchSubjects(formData.programId);
        }
    }, [formData.programId]);

    const fetchPrograms = async () => {
        try {
            setLoadingPrograms(true);
            const response = await api.get<ProgramApiResponse>('/programs');
            if (response.data.success && response.data.data) {
                setPrograms(response.data.data.programs || []);
            }
        } catch (error) {
            console.error('Error fetching programs:', error);
            Alert.alert('Error', 'Failed to load programs');
        } finally {
            setLoadingPrograms(false);
        }
    };

    const fetchSubjects = async (programId: string) => {
        try {
            setLoadingSubjects(true);
            const response = await api.get<SubjectApiResponse>('/subjects');
            if (response.data.success && response.data.data) {
                const filteredSubjects = response.data.data.subjects.filter(
                    (subject: any) => subject.program.id === programId
                );
                setSubjects(filteredSubjects);
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
            Alert.alert('Error', 'Failed to load subjects');
        } finally {
            setLoadingSubjects(false);
        }
    };

    const handleTopicChange = (text: string, index: number) => {
        const newTopics = [...formData.topics];
        newTopics[index] = text;
        setFormData({ ...formData, topics: newTopics });
    };

    const addTopic = () => {
        setFormData({
            ...formData,
            topics: [...formData.topics, ''],
        });
    };

    const removeTopic = (index: number) => {
        if (formData.topics.length > 1) {
            const newTopics = formData.topics.filter((_, i) => i !== index);
            setFormData({ ...formData, topics: newTopics });
        }
    };

    const toggleQuestionType = (type: string) => {
        // Only allow one selection - set the selected type
        setFormData({
            ...formData,
            questionTypes: [type],
        });
    };

    const handleGenerate = async () => {
        // Validation
        if (!formData.programId) {
            Alert.alert('Validation Error', 'Please select a program');
            return;
        }
        if (!formData.subjectId) {
            Alert.alert('Validation Error', 'Please select a subject');
            return;
        }
        if (!formData.topics || formData.topics.every(t => !t.trim())) {
            Alert.alert('Validation Error', 'Please add at least one topic');
            return;
        }
        if (!formData.assessmentType) {
            Alert.alert('Validation Error', 'Please select an assessment type');
            return;
        }
        if (!formData.difficulty) {
            Alert.alert('Validation Error', 'Please select a difficulty level');
            return;
        }
        if (formData.questionTypes.length === 0) {
            Alert.alert('Validation Error', 'Please select at least one question type');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                assessmentType: formData.assessmentType,
                programId: formData.programId,
                subjectId: formData.subjectId,
                topic: formData.topics.filter(t => t.trim()),
                difficulty: formData.difficulty,
                questionTypes: formData.questionTypes,
                questionCount: formData.questionCount,
                totalMarks: formData.totalMarks || formData.questionCount,
                additionalInstructions: formData.additionalInstructions || '',
            };

            console.log('Generating assessment with payload:', payload);

            const response = await api.post('/assessments/generate', payload);

            if (response.data.success && response.data.data) {
                setGeneratedAssessment(response.data.data); console.log(response.data.data)
                Alert.alert(
                    'Success',
                    'Assessment generated successfully!',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert('Error', response.data.message || 'Failed to generate assessment');
            }
        } catch (error: any) {
            console.error('Generate assessment error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to generate assessment');
        } finally {
            setLoading(false);
        }
    };

    // If assessment is generated, show preview
    if (generatedAssessment) {
        return (
            <AssessmentPreview
                assessment={generatedAssessment}
                onBack={() => setGeneratedAssessment(null)}
            />
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>AI Assessment Generator</Text>
                <Text style={styles.headerSubtitle}>
                    Create quizzes, assignments and question papers in seconds using AI.
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Assessment Settings</Text>
                <Text style={styles.cardSubtitle}>
                    Tell AI what kind of assessment you want to create.
                </Text>

                {/* Assessment Type */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Assessment Type</Text>
                    <View style={styles.radioGroup}>
                        {assessmentTypes.map((type) => (
                            <TouchableOpacity
                                key={type.value}
                                style={[
                                    styles.radioCard,
                                    formData.assessmentType === type.value && styles.radioCardActive,
                                ]}
                                onPress={() => setFormData({ ...formData, assessmentType: type.value })}
                            >
                                <View style={styles.radioHeader}>
                                    <View style={[
                                        styles.radioCircle,
                                        formData.assessmentType === type.value && styles.radioCircleActive,
                                    ]}>
                                        {formData.assessmentType === type.value && (
                                            <View style={styles.radioInner} />
                                        )}
                                    </View>
                                    <Text style={[
                                        styles.radioLabel,
                                        formData.assessmentType === type.value && styles.radioLabelActive,
                                    ]}>
                                        {type.label}
                                    </Text>
                                </View>
                                <Text style={styles.radioDescription}>{type.description}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Program */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Program</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={formData.programId}
                            onValueChange={(value) => setFormData({ ...formData, programId: value, subjectId: '' })}
                            style={styles.picker}
                            enabled={!loadingPrograms}
                        >
                            <Picker.Item label="Select a program" value="" />
                            {programs.map((program) => (
                                <Picker.Item
                                    key={program.id}
                                    label={`${program.name} - ${program.fullName || program.name}`}
                                    value={program.id}
                                />
                            ))}
                        </Picker>
                    </View>
                    {loadingPrograms && <ActivityIndicator size="small" color="#4F46E5" />}
                </View>

                {/* Subject */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Subject</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={formData.subjectId}
                            onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                            style={styles.picker}
                            enabled={!loadingSubjects && !!formData.programId}
                        >
                            <Picker.Item
                                label={!formData.programId ? 'Select a program first' : 'Select a subject'}
                                value=""
                            />
                            {subjects.map((subject) => (
                                <Picker.Item key={subject.id} label={subject.name} value={subject.id} />
                            ))}
                        </Picker>
                    </View>
                    {loadingSubjects && <ActivityIndicator size="small" color="#4F46E5" />}
                </View>

                {/* Topics */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Topics</Text>
                    {formData.topics.map((topic, index) => (
                        <View key={index} style={styles.topicInputContainer}>
                            <TextInput
                                style={styles.topicInput}
                                placeholder={`Topic ${index + 1}`}
                                value={topic}
                                onChangeText={(text) => handleTopicChange(text, index)}
                            />
                            {formData.topics.length > 1 && (
                                <TouchableOpacity
                                    style={styles.removeTopicButton}
                                    onPress={() => removeTopic(index)}
                                >
                                    <Icon name="x" size={20} color="#E53935" />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                    <TouchableOpacity style={styles.addTopicButton} onPress={addTopic}>
                        <Icon name="plus" size={18} color="#4F46E5" />
                        <Text style={styles.addTopicText}>Add Topic</Text>
                    </TouchableOpacity>
                </View>

                {/* Difficulty */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Difficulty</Text>
                    <View style={styles.difficultyContainer}>
                        {difficulties.map((difficulty) => (
                            <TouchableOpacity
                                key={difficulty.value}
                                style={[
                                    styles.difficultyButton,
                                    formData.difficulty === difficulty.value && styles.difficultyButtonActive,
                                ]}
                                onPress={() => setFormData({ ...formData, difficulty: difficulty.value })}
                            >
                                <Text style={[
                                    styles.difficultyText,
                                    formData.difficulty === difficulty.value && styles.difficultyTextActive,
                                ]}>
                                    {difficulty.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Question Types */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Question Types</Text>
                    <View style={styles.questionTypesContainer}>
                        {questionTypes.map((type) => (
                            <TouchableOpacity
                                key={type.value}
                                style={[
                                    styles.questionTypeButton,
                                    formData.questionTypes.includes(type.value) && styles.questionTypeButtonActive,
                                ]}
                                onPress={() => toggleQuestionType(type.value)}
                            >
                                <Text style={[
                                    styles.questionTypeText,
                                    formData.questionTypes.includes(type.value) && styles.questionTypeTextActive,
                                ]}>
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Question Count - Slider */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Question Count</Text>
                    <View style={styles.sliderContainer}>
                        <Text style={styles.sliderValue}>{formData.questionCount}</Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={5}
                            maximumValue={50}
                            step={1}
                            value={formData.questionCount}
                            onValueChange={(value: any) => setFormData({ ...formData, questionCount: Math.round(value) })}
                            minimumTrackTintColor="#4F46E5"
                            maximumTrackTintColor="#D6D6D6"
                            thumbTintColor="#4F46E5"
                        />
                        <View style={styles.sliderLabels}>
                            <Text style={styles.sliderLabel}>5</Text>
                            <Text style={styles.sliderLabel}>50</Text>
                        </View>
                    </View>
                </View>

                {/* Total Marks */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Total Marks (optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter total marks"
                        value={formData.totalMarks ? formData.totalMarks.toString() : ''}
                        onChangeText={(text) => setFormData({
                            ...formData,
                            totalMarks: text ? parseInt(text) : 0
                        })}
                        keyboardType="numeric"
                    />
                </View>

                {/* Additional Instructions */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Prompt</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Enter additional instructions or prompt..."
                        value={formData.additionalInstructions}
                        onChangeText={(text) => setFormData({ ...formData, additionalInstructions: text })}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                </View>

                {/* Generate Button */}
                <TouchableOpacity
                    style={[styles.generateButton, loading && styles.disabledButton]}
                    onPress={handleGenerate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <>
                            <Icon name="zap" size={20} color="#FFFFFF" />
                            <Text style={styles.generateButtonText}>Generate Assessment</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FF',
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    header: {
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    radioGroup: {
        gap: 8,
    },
    radioCard: {
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        padding: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    radioCardActive: {
        backgroundColor: '#E8EAF6',
        borderColor: '#4F46E5',
    },
    radioHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#999',
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircleActive: {
        borderColor: '#4F46E5',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4F46E5',
    },
    radioLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1A1A1A',
    },
    radioLabelActive: {
        color: '#4F46E5',
    },
    radioDescription: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
        marginLeft: 30,
    },
    pickerContainer: {
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        color: '#1A1A1A',
    },
    topicInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    topicInput: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    removeTopicButton: {
        padding: 8,
        marginLeft: 8,
    },
    addTopicButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    addTopicText: {
        fontSize: 14,
        color: '#4F46E5',
        fontWeight: '500',
        marginLeft: 4,
    },
    difficultyContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    difficultyButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    difficultyButtonActive: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    difficultyText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    difficultyTextActive: {
        color: '#FFFFFF',
    },
    questionTypesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    questionTypeButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    questionTypeButtonActive: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    questionTypeText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    questionTypeTextActive: {
        color: '#FFFFFF',
    },
    sliderContainer: {
        paddingVertical: 8,
    },
    sliderValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#4F46E5',
        textAlign: 'center',
        marginBottom: 8,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    sliderLabel: {
        fontSize: 12,
        color: '#999',
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
        height: 80,
        textAlignVertical: 'top',
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4F46E5',
        paddingVertical: 14,
        borderRadius: 10,
        gap: 8,
        shadowColor: '#4F46E5',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    generateButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.6,
    },
});

export default CreateAssessment;