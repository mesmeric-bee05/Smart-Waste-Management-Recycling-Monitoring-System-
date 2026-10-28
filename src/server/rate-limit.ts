import { createHash } from "node:crypto";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function allowRequest(request: Request, scope: string, maximum = 8, windowMs = 60_000): boolean {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const remote = request.headers.get("x-real-ip")?.trim();
  const address = (forwarded || remote || "unknown").slice(0, 64);
  const key = createHash("sha256").update(`${scope}:${address}`).digest("hex");
  const now = Date.now();
  for (const [bucketKey, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(bucketKey);
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) buckets.clear();
    return true;
  }
  if (current.count >= maximum) return false;
  current.count += 1;
  return true;
}
