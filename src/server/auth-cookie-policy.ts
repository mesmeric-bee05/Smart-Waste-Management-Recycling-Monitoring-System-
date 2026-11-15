export type AuthCookiePolicy = {
  secureCookie: boolean;
  sameSite: "lax" | "none";
};

export type AuthCookieEnvironment = {
  NODE_ENV?: string;
  AUTH_COOKIE_SECURE?: string;
  AUTH_COOKIE_SAME_SITE?: string;
};

export function resolveAuthCookiePolicy(environment: AuthCookieEnvironment): AuthCookiePolicy {
  const secureCookie = environment.AUTH_COOKIE_SECURE !== "false";
  if (environment.NODE_ENV === "production" && !secureCookie)
    throw new Error("AUTH_COOKIE_SECURE=false is not permitted in production.");

  const sameSite = secureCookie && environment.AUTH_COOKIE_SAME_SITE === "none" ? "none" : "lax";
  return { secureCookie, sameSite };
}

export function buildAuthCookieOverrides(policy: AuthCookiePolicy) {
  const securePrefix = policy.secureCookie ? "__Secure-" : "";
  const cookieOptions = {
    httpOnly: true,
    sameSite: policy.sameSite,
    path: "/",
    secure: policy.secureCookie,
  };

  return {
    sessionToken: {
      name: `${securePrefix}authjs.session-token`,
      options: cookieOptions,
    },
    callbackUrl: {
      name: `${securePrefix}authjs.callback-url`,
      options: cookieOptions,
    },
    csrfToken: {
      name: `${policy.secureCookie ? "__Host-" : ""}authjs.csrf-token`,
      options: cookieOptions,
    },
  };
}
