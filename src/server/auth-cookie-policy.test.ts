import { describe, expect, it } from "vitest";
import { buildAuthCookieOverrides, resolveAuthCookiePolicy } from "@/server/auth-cookie-policy";

describe("Auth.js cookie policy", () => {
  it("uses Secure and Lax for all auth cookies by default in production", () => {
    const cookies = buildAuthCookieOverrides(resolveAuthCookiePolicy({ NODE_ENV: "production" }));
    expect(cookies).toEqual({
      sessionToken: {
        name: "__Secure-authjs.session-token",
        options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
      },
      callbackUrl: {
        name: "__Secure-authjs.callback-url",
        options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
      },
      csrfToken: {
        name: "__Host-authjs.csrf-token",
        options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
      },
    });
  });

  it("uses Secure and None for every auth cookie in explicitly configured HTTPS Preview", () => {
    const policy = resolveAuthCookiePolicy({
      NODE_ENV: "development",
      AUTH_COOKIE_SECURE: "true",
      AUTH_COOKIE_SAME_SITE: "none",
    });
    const cookies = buildAuthCookieOverrides(policy);
    expect(Object.values(cookies).map(({ options }) => options)).toEqual(
      Array(3).fill({ httpOnly: true, sameSite: "none", path: "/", secure: true }),
    );
    expect(cookies.csrfToken.name).toBe("__Host-authjs.csrf-token");
  });

  it("keeps plain HTTP local development on an insecure Lax cookie", () => {
    const policy = resolveAuthCookiePolicy({
      NODE_ENV: "development",
      AUTH_COOKIE_SECURE: "false",
      AUTH_COOKIE_SAME_SITE: "lax",
    });
    const cookies = buildAuthCookieOverrides(policy);
    expect(Object.values(cookies).every(({ options }) => !options.secure && options.sameSite === "lax")).toBe(
      true,
    );
  });

  it("fails closed when an insecure cookie override reaches production", () => {
    expect(() => resolveAuthCookiePolicy({ NODE_ENV: "production", AUTH_COOKIE_SECURE: "false" })).toThrow(
      "AUTH_COOKIE_SECURE=false is not permitted in production.",
    );
  });

  it("never permits SameSite=None without Secure", () => {
    expect(
      resolveAuthCookiePolicy({
        NODE_ENV: "development",
        AUTH_COOKIE_SECURE: "false",
        AUTH_COOKIE_SAME_SITE: "none",
      }),
    ).toEqual({ secureCookie: false, sameSite: "lax" });
  });
});
