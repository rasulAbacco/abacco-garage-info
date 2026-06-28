// server/src/utils/cloudflare.js

import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import crypto from "crypto";
import path from "path";

const s3 = new S3Client({
  region: "auto",

  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,

  credentials: {
    accessKeyId:
      process.env.R2_ACCESS_KEY_ID,

    secretAccessKey:
      process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Generic Cloudflare R2 Upload
 *
 * OLD (still works):
 * uploadToCloudflare(file, garageVisitId)
 *
 * NEW:
 * uploadToCloudflare(file, "field-visits", visitId)
 */

export const uploadToCloudflare = async (
  file,
  folderOrRecordId,
  recordId = null
) => {
  try {

    const extension = path.extname(
      file.originalname
    );

    const uniqueId =
      crypto.randomUUID();

    let folder = "garage-visits";
    let id = folderOrRecordId;

    // New format:
    // uploadToCloudflare(file, "field-visits", visitId)
    if (recordId !== null) {
      folder = folderOrRecordId;
      id = recordId;
    }

    const fileName =
      `${folder}/${id}/${uniqueId}${extension}`;

    const command =
      new PutObjectCommand({
        Bucket:
          process.env.R2_BUCKET_NAME,

        Key: fileName,

        Body: file.buffer,

        ContentType:
          file.mimetype,
      });

    await s3.send(command);

    return {
      imageUrl:
        `${process.env.R2_PUBLIC_URL}/${fileName}`,

      publicId: fileName,
    };

  } catch (error) {

    console.log(
      "Cloudflare Upload Error:",
      error
    );

    throw new Error(
      "R2 upload failed"
    );

  }
};