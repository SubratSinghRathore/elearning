import ReactNativeBlobUtil from "react-native-blob-util";
import api from "../api/axios";
import { Alert } from "react-native";

const PART_SIZE = 8 * 1024 * 1024;

interface UploadPart {
    PartNumber: number;
    ETag: string;
}

type uploadType = {
    file: any;
    onProgress: (e: number) => void
}

type uploadDeatilsType = {
    uploadId: string;
    key: string;
    materialId: string
}

const uploadDetail: uploadDeatilsType = {
    uploadId: "",
    key: "",
    materialId: ""
};

export async function upload({ file, onProgress }: uploadType) {

    //Retriving file path
    const localPath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${Date.now()}_${file.name}`;
    await ReactNativeBlobUtil.fs.cp(file.uri, localPath);

    //Calculating size
    const fileSize = file.size || 0;

    if (!fileSize) {
        await ReactNativeBlobUtil.fs.unlink(localPath).catch(() => { });
        throw new Error("Could not determine file size");
    }

    const totalParts = Math.ceil(fileSize / PART_SIZE);

    // Create multipart upload
    const create = await api.post("/uploads/materials/s3/multipart/create", {
        fileName: file.name,
        fileType: file.type,
        fileSize,
        purpose: "CONTENT_LIBRARY",
    });

    const { uploadId, key, materialId } = create.data.data;
    const parts: UploadPart[] = [];
    uploadDetail.uploadId = uploadId;
    uploadDetail.key = key;
    uploadDetail.materialId = materialId;

    try {
        for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
            const start = (partNumber - 1) * PART_SIZE;
            const end = Math.min(start + PART_SIZE, fileSize);

            const etag = await uploadPart({
                fileUri: localPath,
                fileType: file.type || 'Document',
                uploadId,
                key,
                partNumber,
                start,
                end,
            });

            parts.push({ PartNumber: partNumber, ETag: etag });
            onProgress?.(partNumber / totalParts);
        }

        const complete = await api.post("/uploads/materials/s3/multipart/complete", {
            uploadId,
            key,
            materialId,
            parts,
        });

        if (complete.status >= 200 && complete.status <= 300) {
            Alert.alert('Upload successfully');
        }

        return {
            file,
            uploadId,
            key,
            materialId,
            result: complete.data,
        };
    } catch (e) {
        // Don't leave an orphaned multipart upload sitting on S3
        await abortUpload();
        throw e;
    } finally {
        // Clean up our local copy of the picked file
        ReactNativeBlobUtil.fs.unlink(localPath).catch(() => { });
    }
}

async function uploadPart({
    fileUri,
    fileType,
    uploadId,
    key,
    partNumber,
    start,
    end,
}: {
    fileUri: string;
    fileType?: string;
    uploadId: string;
    key: string;
    partNumber: number;
    start: number;
    end: number;
}): Promise<string> {
    // Sign this part
    const sign = await api.post("/uploads/materials/s3/multipart/sign-part", {
        uploadId,
        key,
        partNumber,
    });

    const signedUrl = sign.data.data.signedUrl;

    // Slice the file on disk into a temp chunk file (avoids loading whole file into memory)
    const tmpDir = ReactNativeBlobUtil.fs.dirs.CacheDir;
    const slicePath = `${tmpDir}/part_${uploadId}_${partNumber}`;

    await ReactNativeBlobUtil.fs.slice(fileUri, slicePath, start, end);

    try {
        const res = await ReactNativeBlobUtil.fetch(
            "PUT",
            signedUrl,
            {
                "Content-Type": fileType || "application/octet-stream",
            },
            ReactNativeBlobUtil.wrap(slicePath)
        );

        if (res.info().status >= 300) {
            throw new Error(`Part ${partNumber} upload failed with status ${res.info().status}`);
        }

        const headers = res.info().headers;
        const etag = headers.ETag || headers.etag || headers.Etag;

        if (!etag) {
            throw new Error(`Part ${partNumber} upload did not return an ETag`);
        }

        // S3 wraps ETag in quotes — strip them before sending to complete
        return etag.replace(/"/g, "");
    } finally {
        // Always clean up the temp slice, success or failure
        ReactNativeBlobUtil.fs.unlink(slicePath).catch(() => { });
    }
}

export async function abortUpload() {
    if (uploadDetail.key === '') return;
    if (uploadDetail.materialId === '') return;
    if (uploadDetail.uploadId === '') return;
    return api.post("/uploads/materials/s3/multipart/abort", uploadDetail);
}