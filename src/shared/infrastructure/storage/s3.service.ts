import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  ImageUploadRequestProps,
  IStorageService,
} from "@/shared/application/storage.interface.ts";
import { getS3Client } from "./s3.storage.ts";

class S3StorageService implements IStorageService {
  private bucket: string;

  constructor() {
    const bucket = Deno.env.get("S3_BUCKET");
    if (!bucket) throw new Error("S3_BUCKET not set");
    this.bucket = bucket;
  }

  async requestImageUpload(
    { contentType, size }: ImageUploadRequestProps,
  ) {
    if (size > 10 * 1024 * 1024) throw new Error("File too large");
    if (!contentType.startsWith("image/")) throw new Error("Invalid type");

    const timestamp = Date.now();
    const key = `images/${timestamp}-${crypto.randomUUID()}`;

    const client = getS3Client();

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(client, command, { expiresIn: 60 });

    return { url, key };
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
