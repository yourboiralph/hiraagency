import { DeleteObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config as loadEnv } from "dotenv";

import { PrismaClient } from "../lib/generated/prisma/client";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const endpoint = process.env.AWS_ENDPOINT_URL_S3;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucket = process.env.NEON_STORAGE_BUCKET;

if (!connectionString || !endpoint || !accessKeyId || !secretAccessKey || !bucket) {
  throw new Error("Missing environment values.");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "ap-southeast-1",
  endpoint,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
});

const userId = "cmvwgbxgh0000tkj4zy4psk6b";

try {
  const listed = await s3.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: `avatars/${userId}/` }),
  );

  for (const object of listed.Contents ?? []) {
    if (!object.Key) continue;
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: object.Key }));
    console.log("deleted object:", object.Key);
  }

  const user = await prisma.user.deleteMany({
    where: { email: "storage-check@hiraagency.com" },
  });

  console.log(
    `Removed ${user.count} probe user(s).`,
    { users: await prisma.user.count(), projects: await prisma.project.count() },
  );
} finally {
  await prisma.$disconnect();
}
