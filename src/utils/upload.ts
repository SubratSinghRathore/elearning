import { pick } from "@react-native-documents/picker";
import ReactNativeBlobUtil from 'react-native-blob-util';
import api from "../api/axios";

export async function upload() {
    // Pick file
    const [file] = await pick({
        mode: "open",
    });

    try {
        const stat = await ReactNativeBlobUtil.fs.stat(file.uri);

        console.log("STAT SUCCESS");
        console.log(stat);
    } catch (e) {
        console.log("STAT ERROR");
        console.log(e);
    }

    // Create multipart upload
    const create = await api.post(
        "/uploads/materials/s3/multipart/create",
        {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            purpose: "CONTENT_LIBRARY",
        }
    );

    const { uploadId, key, materialId } = create.data.data;

    // Sign first part
    const sign = await api.post(
        "/uploads/materials/s3/multipart/sign-part",
        {
            uploadId,
            key,
            partNumber: 1,
        }
    );

    console.log("SIGNED");

    console.log(sign.data);

    const signedUrl = sign.data.data.signedUrl;

    console.log("Uploading...");

    try {
        const res = await ReactNativeBlobUtil.fetch(
            "PUT",
            signedUrl,
            {
                "Content-Type": file.type || "application/octet-stream",
            },
            ReactNativeBlobUtil.wrap(file.uri)
        );

        console.log("UPLOAD SUCCESS");

        const headers = res.info().headers;

        console.log("Headers:", headers);

        const etag =
            headers.ETag ||
            headers.etag ||
            headers.Etag;

        console.log("ETAG:", etag);

        const complete = await api.post(
            "/uploads/materials/s3/multipart/complete",
            {
                uploadId,
                key,
                materialId,
                parts: [
                    {
                        PartNumber: 1,
                        ETag: etag,
                    },
                ],
            }
        );

        console.log("COMPLETE");
        console.log(complete.data);
    } catch (e) {
        console.log("UPLOAD ERROR");
        console.log(e);
    }

    return {
        file,
        uploadId,
        key,
        materialId,
        signedUrl: sign.data.data.signedUrl,
    };

}