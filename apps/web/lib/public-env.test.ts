import { afterEach, describe, expect, it } from "vitest";
import {
  getAuthBypassUrl,
  getGoogleAuthUrl,
  getPublicApiUrl,
} from "./public-env";

describe("public-env", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("uses explicit Google auth URL when set", () => {
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL =
      "https://lore-forge.onrender.com/auth/google";
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3000";

    expect(getGoogleAuthUrl()).toBe(
      "https://lore-forge.onrender.com/auth/google"
    );
  });

  it("derives Google auth URL from API URL when auth URL is unset", () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL;
    process.env.NEXT_PUBLIC_API_URL = "https://lore-forge.onrender.com";

    expect(getGoogleAuthUrl()).toBe(
      "https://lore-forge.onrender.com/auth/google"
    );
  });

  it("falls back to localhost in development", () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL;
    delete process.env.NEXT_PUBLIC_API_URL;

    expect(getPublicApiUrl()).toBe("http://localhost:3000");
    expect(getGoogleAuthUrl()).toBe("http://localhost:3000/auth/google");
    expect(getAuthBypassUrl()).toBe("http://localhost:3000/auth/bypass");
  });
});
