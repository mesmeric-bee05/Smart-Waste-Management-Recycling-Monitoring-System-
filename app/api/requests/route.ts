import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { allowRequest } from "@/server/rate-limit";
import { createPublicRequest } from "@/server/services/requests";

export const runtime = "nodejs";
const MAX_BODY = 12_000;

async function limitedText(request: Request): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      await reader.cancel();
      throw new RangeError("body_too_large");
    }
    chunks.push(value);
  }
  const joined = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(joined);
}

export async function POST(request: Request) {
  if (!allowRequest(request, "public-request", 8, 60_000))
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY)
    return NextResponse.json(
      { error: "Request is too large." },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
    return NextResponse.json(
      { error: "Send a JSON request." },
      { status: 415, headers: { "Cache-Control": "no-store" } },
    );
  let payload: unknown;
  try {
    const text = await limitedText(request);
    if (text === null) throw new TypeError("empty body");
    payload = JSON.parse(text);
  } catch (error) {
    if (error instanceof RangeError && error.message === "body_too_large")
      return NextResponse.json(
        { error: "Request is too large." },
        { status: 413, headers: { "Cache-Control": "no-store" } },
      );
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    const created = await createPublicRequest(payload);
    return NextResponse.json(
      {
        reference: created.id.slice(0, 8).toUpperCase(),
        createdAt: created.createdAt.toISOString(),
        message: "Your request has been received.",
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof ZodError)
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Please review the submitted fields." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    if (error instanceof Error && error.message === "Choose a valid collection point.")
      return NextResponse.json(
        { error: "Choose a valid collection point." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    return NextResponse.json(
      { error: "Request intake is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
