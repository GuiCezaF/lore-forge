import { describe, expect, it } from "vitest";
import messages from "../messages/pt-BR.json";

describe("Brazilian Portuguese messages", () => {
  it("provides Portuguese labels for dynamic character values and generic CRUD failures", () => {
    expect(messages.characters.derived.maxHp).toBe("PV máximos");
    expect(messages.characters.status.archived).toBe("Arquivada");
    expect(messages.crud.loadFailed).toBe("Não foi possível carregar os dados.");
  });
});
