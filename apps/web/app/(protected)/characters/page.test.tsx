import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import CharactersPage from "./page";

const apiFetch = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-client", () => ({ apiFetch }));
vi.mock("@/lib/api-url", () => ({
  getBrowserApiUrl: () => "http://api.test",
}));

describe("CharactersPage deletion", () => {
  beforeEach(() => {
    apiFetch.mockReset();
    sessionStorage.clear();
  });

  it("only offers deletion to sheets never attached and removes it after confirmation", async () => {
    apiFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: "discardable",
            name: "Rascunho",
            kind: "pc",
            status: "draft",
            campaignId: null,
            campaignAttachedAt: null,
            nex: 5,
          },
          {
            id: "historical",
            name: "Veterano",
            kind: "pc",
            status: "archived",
            campaignId: "campaign",
            campaignAttachedAt: "2026-07-18T00:00:00.000Z",
            nex: 5,
          },
        ],
      })
      .mockResolvedValueOnce({ ok: true });
    sessionStorage.setItem(
      "lore-forge:pc-creator-draft:v1",
      JSON.stringify({ id: "discardable" }),
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderWithIntl(<CharactersPage />);

    const deleteButton = await screen.findByRole("button", {
      name: "Excluir",
    });
    expect(screen.getByText("Veterano")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Excluir" })).toHaveLength(1);

    fireEvent.click(deleteButton);

    await waitFor(() =>
      expect(screen.queryByText("Rascunho")).not.toBeInTheDocument(),
    );
    expect(apiFetch).toHaveBeenLastCalledWith(
      "http://api.test/characters/discardable",
      { method: "DELETE" },
    );
    expect(sessionStorage.getItem("lore-forge:pc-creator-draft:v1")).toBeNull();
  });

  it("does not send a request when deletion is cancelled", async () => {
    apiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "discardable",
          name: "Rascunho",
          kind: "pc",
          status: "draft",
          campaignId: null,
          campaignAttachedAt: null,
          nex: 5,
        },
      ],
    });
    vi.spyOn(window, "confirm").mockReturnValue(false);

    renderWithIntl(<CharactersPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Excluir" }));

    expect(apiFetch).toHaveBeenCalledTimes(1);
  });
});
