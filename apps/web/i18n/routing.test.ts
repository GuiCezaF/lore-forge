import { describe, expect, it } from "vitest";
import { routing } from "./routing";

describe("routing", () => {
  it("supports Brazilian Portuguese as the only runtime locale", () => {
    expect(routing.locales).toEqual(["pt-BR"]);
    expect(routing.defaultLocale).toBe("pt-BR");
    expect(routing.localePrefix).toBe("never");
  });
});
