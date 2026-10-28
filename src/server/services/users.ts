import * as argon2 from "argon2";
import { userInviteSchema } from "@/domain/schemas";
import { prisma } from "@/server/db";
import { requireActor } from "@/server/authorization";
import { writeAudit } from "@/server/audit";

export async function inviteUser(raw: unknown) {
  const actor = await requireActor(["ADMIN"]);
  const input = userInviteSchema.parse(raw);
  if (input.email === actor.email) throw new Error("Use a separate account for another team member.");
  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        organizationId: actor.organizationId,
        email: input.email,
        fullName: input.fullName,
        role: input.role,
        passwordHash,
      },
      select: { id: true, email: true, fullName: true, role: true },
    });
    await writeAudit(tx, {
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "user.invite",
      entityType: "User",
      entityId: user.id,
      metadata: { role: user.role },
    });
    return user;
  });
}
