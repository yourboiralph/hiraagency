import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

/**
 * Neon Object Storage is S3-compatible (path-style, SigV4). Credentials and the
 * branch endpoint come from the environment; when they are missing the app
 * reports "not configured" instead of crashing.
 */

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const IMAGE_MIME_TYPES = Object.keys(MIME_EXTENSIONS);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function isSupportedImageType(type: string): boolean {
  return type in MIME_EXTENSIONS;
}

export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.AWS_ENDPOINT_URL_S3 &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.NEON_STORAGE_BUCKET,
  );
}

let cachedClient: S3Client | null = null;

function client(): S3Client {
  if (!isStorageConfigured()) {
    throw new Error("Object storage is not configured.");
  }

  cachedClient ??= new S3Client({
    region: process.env.AWS_REGION ?? "ap-southeast-1",
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    // Neon requires path-style addressing.
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  return cachedClient;
}

function bucket(): string {
  return process.env.NEON_STORAGE_BUCKET!;
}

/** Keys are `<prefix>/<uuid>.<ext>`; the prefix scopes them to their owner. */
export function buildStorageKey(prefix: string, contentType: string): string {
  const extension = MIME_EXTENSIONS[contentType];
  if (!extension) throw new Error("Unsupported image type.");
  return `${prefix}/${randomUUID()}.${extension}`;
}

/** Reject traversal and anything outside the character set we generate. */
export function isSafeStorageKey(key: string): boolean {
  return (
    key.length > 0 &&
    key.length <= 400 &&
    !key.startsWith("/") &&
    !key.includes("..") &&
    /^[A-Za-z0-9._/-]+$/.test(key)
  );
}

export async function presignUpload(
  key: string,
  contentType: string,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client(), command, { expiresIn: 300 });
}

export async function getObject(key: string) {
  try {
    const result = await client().send(
      new GetObjectCommand({ Bucket: bucket(), Key: key }),
    );

    if (!result.Body) return null;

    const body = await result.Body.transformToByteArray();

    return {
      body,
      contentType: result.ContentType ?? "application/octet-stream",
      contentLength: result.ContentLength ?? body.byteLength,
    };
  } catch {
    return null;
  }
}

/**
 * Confirms the browser actually uploaded an image before we store its key.
 * This also blocks attaching someone else's key to a record.
 */
export async function verifyUploadedImage(key: string, ownerPrefix: string) {
  if (!isSafeStorageKey(key) || !key.startsWith(`${ownerPrefix}/`)) {
    return null;
  }

  try {
    const head = await client().send(
      new HeadObjectCommand({ Bucket: bucket(), Key: key }),
    );

    if (!head.ContentType || !isSupportedImageType(head.ContentType)) {
      return null;
    }

    return {
      contentType: head.ContentType,
      size: head.ContentLength ?? 0,
    };
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  if (!isSafeStorageKey(key)) return;

  try {
    await client().send(
      new DeleteObjectCommand({ Bucket: bucket(), Key: key }),
    );
  } catch {
    // Best effort: an orphaned object is not worth failing the request over.
  }
}
