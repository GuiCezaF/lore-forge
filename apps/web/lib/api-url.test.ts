import { afterEach, describe, expect, it } from "vitest";
import {
  getBrowserApiUrl,
  getServerApiUrl,
  hasSplitOrigins,
  isServerApiUrlMisconfigured,
  resolveServerApiUrl,
} from "./api-url";

describe("api-url", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("uses same-origin proxy when API host differs from frontend host", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://lore-forge.onrender.com";

    expect(hasSplitOrigins("lore-forge-web.vercel.app")).toBe(true);
    expect(getBrowserApiUrl()).toBe("/api/backend");
  });

  it("uses direct API URL when hosts match", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3000";

    expect(hasSplitOrigins("localhost:3000")).toBe(false);
    expect(getBrowserApiUrl()).toBe("http://localhost:3000");
  });

  it("prefers API_URL for server-side requests", () => {
    process.env.API_URL = "https://api.example.com";
    process.env.NEXT_PUBLIC_API_URL = "https://public.example.com";

    expect(resolveServerApiUrl()).toBe("https://api.example.com");
    expect(getServerApiUrl()).toBe("https://api.example.com");
  });

  it("flags localhost API URL in production", () => {
    process.env.NODE_ENV = "production";
    delete process.env.API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;

    expect(isServerApiUrlMisconfigured()).toBe(true);
  });
});
