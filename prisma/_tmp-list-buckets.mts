import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const endpoint = process.env.AWS_ENDPOINT_URL_S3;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!endpoint || !accessKeyId || !secretAccessKey) {
  throw new Error("S3 credentials are incomplete in .env.local.");
}

const client = new S3Client({
  region: process.env.AWS_REGION ?? "ap-southeast-1",
  endpoint,
  forcePathStyle: true,
  maxAttempts: 1,
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 8000,
    requestTimeout: 12000,
  }),
  credentials: { accessKeyId, secretAccessKey },
});

try {
  const result = await client.send(new ListBucketsCommand({}));
  console.log("endpoint:", new URL(endpoint).host);
  console.log(
    "buckets:",
    JSON.stringify((result.Buckets ?? []).map((bucket) => bucket.Name)),
  );
} catch (error) {
  console.error(
    "ListBuckets failed:",
    error instanceof Error ? `${error.name}: ${error.message}` : error,
  );
  process.exitCode = 1;
}
