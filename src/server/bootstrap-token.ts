import { timingSafeEqual } from "node:crypto";

const MINIMUM_TOKEN_BYTES = 32;

export function hasValidFirstAdminBootstrapToken(
  authorizationHeader: string | null,
  expectedToken: string | undefined,
): boolean {
  if (!expectedToken || Buffer.byteLength(expectedToken, "utf8") < MINIMUM_TOKEN_BYTES) return false;
  if (!authorizationHeader?.startsWith("Bearer ")) return false;

  const suppliedToken = authorizationHeader.slice("Bearer ".length);
  const expected = Buffer.from(expectedToken, "utf8");
  const supplied = Buffer.from(suppliedToken, "utf8");
  if (expected.length !== supplied.length) return false;
  return timingSafeEqual(expected, supplied);
}
