import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/server/db";

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function currentActor() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return prisma.user.findFirst({
    where: { id, isActive: true },
    select: { id: true, email: true, fullName: true, role: true, organizationId: true },
  });
}

export async function requirePageActor(roles?: readonly Role[]) {
  const actor = await currentActor();
  if (!actor) redirect("/login");
  if (roles && !roles.includes(actor.role)) redirect("/dashboard?notice=not-authorized");
  return actor;
}

export async function requireActor(roles?: readonly Role[]) {
  const actor = await currentActor();
  if (!actor) throw new AuthorizationError("Please sign in to continue.");
  if (roles && !roles.includes(actor.role)) throw new AuthorizationError();
  return actor;
}
