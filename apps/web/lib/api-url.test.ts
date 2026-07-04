import { afterEach, describe, expect, it } from "vitest";
import { getBrowserApiUrl, hasSplitOrigins } from "./api-url";

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
});
