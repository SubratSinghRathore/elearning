import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { upload, abortUpload } from '../utils/upload';
import { pick } from "@react-native-documents/picker";
import { useState } from 'react';
import UploadProgressBar from './UploadProgressBar';

type UploadFileProps = {
    openUploadFile: boolean;
    setOpenUploadFile: any;
};

const UploadContent = ({ openUploadFile, setOpenUploadFile }: UploadFileProps) => {

    const [file, setFile] = useState<any>();
    const [progress, setProgress] = useState<number>(0);
    const [progressVisible, setProgressVisible] = useState(false);

    const selectFile = async () => {
        //picking the file
        if (file) {
            Alert.alert('File already selected', 'Select another file it will remove current selected file', [
                {
                    text: 'close',
                    style: 'cancel'
                },
                {
                    text: 'select',
                    onPress: async () => {
                        const [file] = await pick({ mode: "open" });
                        setFile(file);
                    }
                }
            ])
        } else {
            const [file] = await pick({ mode: "open" });
            setFile(file);
        }
    }

    const uploadFile = async () => {
        if (!file) {
            Alert.alert('Please select file to upload');
            return;
        }
        setProgressVisible(true);
        upload({ file, onProgress: (e: number) => setProgress(e) })
    }

    const cancelUpload = () => {
        Alert.alert("Cancel Upload", "Are you sure to cancel upload", [{
            text: 'close',
            style: 'cancel'
        }, {
            text: 'cancel',
            style: 'destructive',
            onPress: async () => { await abortUpload(), setOpenUploadFile(false) }
        }])
    }

    return (
        <Modal
            visible={true}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setOpenUploadFile(false)}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                />
                <View style={styles.popup}>
                    {/* Header */}
                    <View style={styles.headContainer}>
                        <Text style={styles.title}>Upload File</Text>
                        <TouchableOpacity onPress={() => setOpenUploadFile(false)}>
                            <Icon name="x" size={24} color="#868686" />
                        </TouchableOpacity>
                    </View>

                    {progressVisible && <UploadProgressBar visible={true} progress={progress} />}
                    {/* File Preview Area */}
                    <View style={styles.filePreviewContainer}>
                        <TouchableOpacity onPress={selectFile}>
                            <View style={styles.emptyStateContainer}>
                                <Icon name="upload-cloud" size={60} color="#C7C7CC" />
                                <Text style={styles.emptyStateText}>No file selected</Text>
                                <Text style={styles.emptyStateSubText}>
                                    {file ? file.name : 'Tap to select file to upload'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionContainer}>
                        <TouchableOpacity style={[styles.button, styles.selectButton]} onPress={cancelUpload}>
                            <Text style={styles.selectButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.button, styles.uploadButton]} onPress={uploadFile}>
                            <Icon name="upload" size={20} color="#FFFFFF" />
                            <Text style={styles.uploadButtonText}>Upload</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'transparent',
    },
    headContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: "600",
        color: "#1C1C1E",
    },
    popup: {
        width: "90%",
        maxWidth: 400,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    filePreviewContainer: {
        minHeight: 150,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: "#E5E5EA",
        borderRadius: 12,
        borderStyle: "dashed",
        padding: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyStateContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    emptyStateText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: "500",
        color: "#1C1C1E",
    },
    emptyStateSubText: {
        marginTop: 4,
        fontSize: 14,
        color: "#8E8E93",
        textAlign: "center",
    },
    actionContainer: {
        flexDirection: "row",
        gap: 12,
    },
    button: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    selectButton: {
        backgroundColor: "#F2F2F7",
        borderWidth: 1,
        borderColor: "#E5E5EA",
    },
    selectButtonText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#007AFF",
    },
    uploadButton: {
        backgroundColor: "#007AFF",
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
});

export default UploadContent;