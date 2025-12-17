import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import type {
  IStorageService,
  UploadResult,
} from "@/shared/application/storage.interface.ts";
import { getS3Client } from "./s3.storage.ts";
import { processImage } from "./image.processor.ts";

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/tiff",
  "image/bmp",
  "image/svg+xml",
  "image/heic",
  "image/heif",
];

class S3StorageService implements IStorageService {
  private bucket: string;

  constructor() {
    const bucket = Deno.env.get("S3_BUCKET");
    if (!bucket) throw new Error("S3_BUCKET not set");
    this.bucket = bucket;
  }

  async upload(file: File, folder: string): Promise<UploadResult> {
    const client = getS3Client();
    const timestamp = Date.now();
    const baseName = file.name.replace(/\.[^/.]+$/, "").replace(
      /[^a-zA-Z0-9.-]/g,
      "_",
    );

    let body: Uint8Array;
    let contentType: string;
    let key: string;
    let size: number;

    if (IMAGE_TYPES.includes(file.type)) {
      const processed = await processImage(file);
      body = processed.buffer;
      contentType = "image/webp";
      key = `${folder}/${timestamp}-${baseName}.webp`;
      size = processed.size;
    } else {
      const arrayBuffer = await file.arrayBuffer();
      body = new Uint8Array(arrayBuffer);
      contentType = file.type;
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      key = `${folder}/${timestamp}-${sanitizedName}`;
      size = file.size;
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await client.send(command);

    return { key, size };
  }

  async delete(key: string): Promise<void> {
    const client = getS3Client();

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await client.send(command);
  }
}

export { S3StorageService };
