import { NextResponse } from "next/server";
import { ZodError } from "zod";
import * as argon2 from "argon2";
import { prisma } from "@/server/db";
import { allowRequest } from "@/server/rate-limit";
import { hasValidFirstAdminBootstrapToken } from "@/server/bootstrap-token";
import {
  bootstrapFirstAdmin,
  FirstAdminBootstrapConflictError,
  type FirstAdminBootstrapDatabase,
} from "@/server/services/first-admin-bootstrap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 12_000;
const NO_STORE = { "Cache-Control": "no-store" };
const BOOTSTRAP_RATE_LIMIT_REQUEST = new Request("http://wasteops.local/admin/bootstrap");

async function readBoundedText(request: Request): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new RangeError("body_too_large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function unavailable() {
  return new Response(null, { status: 404, headers: NO_STORE });
}

export async function POST(request: Request) {
  const expectedToken = process.env.WASTEOPS_FIRST_ADMIN_BOOTSTRAP_TOKEN;
  if (process.env.NODE_ENV !== "production") return unavailable();
  if (!allowRequest(BOOTSTRAP_RATE_LIMIT_REQUEST, "first-admin-bootstrap", 5, 60_000))
    return NextResponse.json(
      { error: "Bootstrap is temporarily unavailable." },
      { status: 429, headers: { ...NO_STORE, "Retry-After": "60" } },
    );
  if (!hasValidFirstAdminBootstrapToken(request.headers.get("authorization"), expectedToken))
    return unavailable();

  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
    return NextResponse.json({ error: "Invalid bootstrap request." }, { status: 415, headers: NO_STORE });

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES)
    return NextResponse.json({ error: "Invalid bootstrap request." }, { status: 413, headers: NO_STORE });

  let payload: unknown;
  try {
    const text = await readBoundedText(request);
    if (text === null) throw new TypeError("empty_body");
    payload = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid bootstrap request." }, { status: 400, headers: NO_STORE });
  }

  try {
    await bootstrapFirstAdmin(payload, {
      database: prisma as unknown as FirstAdminBootstrapDatabase,
      hashPassword: (password) =>
        argon2.hash(password, {
          type: argon2.argon2id,
          memoryCost: 19_456,
          timeCost: 2,
          parallelism: 1,
        }),
    });
    // This disables the endpoint in this process immediately; remove the protected setting
    // from every running environment after the one successful bootstrap response.
    delete process.env.WASTEOPS_FIRST_ADMIN_BOOTSTRAP_TOKEN;
    return NextResponse.json({ status: "created" }, { status: 201, headers: NO_STORE });
  } catch (error) {
    if (error instanceof ZodError)
      return NextResponse.json({ error: "Invalid bootstrap request." }, { status: 400, headers: NO_STORE });
    if (error instanceof FirstAdminBootstrapConflictError)
      return NextResponse.json({ error: "Bootstrap is unavailable." }, { status: 409, headers: NO_STORE });
    return NextResponse.json(
      { error: "Bootstrap service is temporarily unavailable." },
      { status: 503, headers: NO_STORE },
    );
  }
}
