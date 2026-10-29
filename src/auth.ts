import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import * as argon2 from "argon2";
import { loginSchema } from "@/domain/schemas";
import { prisma } from "@/server/db";
import { writeAudit } from "@/server/audit";
import { allowRequest } from "@/server/rate-limit";

const secureCookie = process.env.AUTH_COOKIE_SECURE !== "false";
const sameSite = secureCookie && process.env.AUTH_COOKIE_SAME_SITE === "none" ? "none" : "lax";
const validRoles = ["ADMIN", "SUPERVISOR", "COLLECTOR"] as const;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 20 * 60, updateAge: 5 * 60 },
  pages: { signIn: "/login" },
  cookies: {
    sessionToken: {
      name: secureCookie ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: { httpOnly: true, sameSite, path: "/", secure: secureCookie },
    },
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: { type: "password" } },
      async authorize(rawCredentials, request) {
        const requestLike = new Request("http://wasteops.local/auth", { headers: request.headers });
        if (!allowRequest(requestLike, "auth-login", 12, 60_000)) return null;
        // Auth.js includes callback/CSRF fields in the full form payload; validate only credential fields.
        const parsed = loginSchema.safeParse({
          email: rawCredentials?.email,
          password: rawCredentials?.password,
        });
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            email: true,
            fullName: true,
            passwordHash: true,
            role: true,
            organizationId: true,
            isActive: true,
            failedLoginCount: true,
            lockedUntil: true,
          },
        });
        if (!user || !user.isActive) return null;
        if (user.lockedUntil && user.lockedUntil > new Date()) return null;
        let valid = false;
        try {
          valid = await argon2.verify(user.passwordHash, parsed.data.password);
        } catch {
          valid = false;
        }
        if (!valid) {
          await prisma.$transaction(async (tx) => {
            const updated = await tx.user.update({
              where: { id: user.id },
              data: { failedLoginCount: { increment: 1 } },
              select: { failedLoginCount: true },
            });
            if (updated.failedLoginCount >= 5)
              await tx.user.update({
                where: { id: user.id },
                data: { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) },
              });
            await writeAudit(tx, {
              organizationId: user.organizationId,
              actorId: null,
              action: "auth.failure",
              entityType: "User",
              entityId: user.id,
              metadata: { reason: "invalid_credentials" },
            });
          });
          return null;
        }
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: user.id },
            data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
          });
          await writeAudit(tx, {
            organizationId: user.organizationId,
            actorId: user.id,
            action: "auth.login",
            entityType: "User",
            entityId: user.id,
            metadata: { role: user.role },
          });
        });
        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          organizationId: user.organizationId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as typeof user & { role?: string }).role;
        token.organizationId = (user as typeof user & { organizationId?: string }).organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = validRoles.includes(token.role as (typeof validRoles)[number])
          ? (token.role as (typeof validRoles)[number])
          : "COLLECTOR";
        session.user.organizationId = typeof token.organizationId === "string" ? token.organizationId : "";
      }
      return session;
    },
  },
});
