import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";

export function getS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

export function s3PublicUrl(key: string) {
  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

export async function uploadToS3(
  base64: string,
  mimeType: string,
  folder = "uploads"
): Promise<string> {
  const ext = mimeType.split("/")[1] ?? "jpg";
  const key = `${folder}/${nanoid()}.${ext}`;
  const buffer = Buffer.from(base64, "base64");

  const s3 = getS3Client();
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return s3PublicUrl(key);
}

export async function deleteFromS3(url: string) {
  const bucket = process.env.AWS_S3_BUCKET_NAME!;
  const region = process.env.AWS_REGION!;
  const prefix = `https://${bucket}.s3.${region}.amazonaws.com/`;
  if (!url.startsWith(prefix)) return;
  const key = url.slice(prefix.length);

  const s3 = getS3Client();
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
