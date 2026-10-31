import { getSessionUser } from "@/lib/authz";
import { getObject, isSafeStorageKey } from "@/lib/storage";

/**
 * Private media. Only signed-in members can read objects, which keeps a leaked
 * URL from exposing work outside the agency. Next caches per deployment; the
 * browser may cache for an hour.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { key } = await params;
  const objectKey = key.join("/");

  if (!isSafeStorageKey(objectKey)) {
    return new Response("Not found", { status: 404 });
  }

  const object = await getObject(objectKey);
  if (!object) return new Response("Not found", { status: 404 });

  // Detach the exact slice from the byte array so `Response` gets an
  // ArrayBuffer rather than a typed-array view.
  const body = object.body.buffer.slice(
    object.body.byteOffset,
    object.body.byteOffset + object.body.byteLength,
  ) as ArrayBuffer;

  return new Response(body, {
    headers: {
      "Content-Type": object.contentType,
      "Content-Length": String(object.contentLength),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
