import { pick } from "@react-native-documents/picker";
import ReactNativeBlobUtil from "react-native-blob-util";
import api from "../api/axios";

const PART_SIZE = 8 * 1024 * 1024; // 8MB — must be >= 5MB (S3 min, except the last part)

interface UploadPart {
    PartNumber: number;
    ETag: string;
}

export async function upload(onProgress?: (percent: number) => void) {
    // Pick file
    const [file] = await pick({ mode: "open" });

    const localPath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${Date.now()}_${file.name}`;
    await ReactNativeBlobUtil.fs.cp(file.uri, localPath);
    const stat = await ReactNativeBlobUtil.fs.stat(localPath);
    const fileSize = Number(stat.size) || file.size || 0;

    if (!fileSize) {
        await ReactNativeBlobUtil.fs.unlink(localPath).catch(() => {});
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
            onProgress?.(Math.round((partNumber / totalParts) * 100));
        }

        const complete = await api.post("/uploads/materials/s3/multipart/complete", {
            uploadId,
            key,
            materialId,
            parts,
        });

        return {
            file,
            uploadId,
            key,
            materialId,
            result: complete.data,
        };
    } catch (e) {
        // Don't leave an orphaned multipart upload sitting on S3
        await abortUpload({ uploadId, key }).catch(() => {});
        throw e;
    } finally {
        // Clean up our local copy of the picked file
        ReactNativeBlobUtil.fs.unlink(localPath).catch(() => {});
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
        ReactNativeBlobUtil.fs.unlink(slicePath).catch(() => {});
    }
}

async function abortUpload({ uploadId, key }: { uploadId: string; key: string }) {
    return api.post("/uploads/materials/s3/multipart/abort", { uploadId, key });
}