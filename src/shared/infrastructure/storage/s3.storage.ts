import { S3Client } from "@aws-sdk/client-s3";

let _s3: S3Client | undefined;

function getS3Client(): S3Client {
  const endpoint = Deno.env.get("S3_ENDPOINT");
  if (!endpoint) throw new Error("S3_ENDPOINT not set");

  const region = Deno.env.get("S3_REGION");
  if (!region) throw new Error("S3_REGION not set");

  const accessKey = Deno.env.get("S3_ACCESS_KEY");
  if (!accessKey) throw new Error("S3_ACCESS_KEY not set");

  const secretKey = Deno.env.get("S3_SECRET_KEY");
  if (!secretKey) throw new Error("S3_SECRET_KEY not set");

  if (!_s3) {
    _s3 = new S3Client({
      region: region,
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true,
    });
  }
  return _s3;
}

export { getS3Client };
