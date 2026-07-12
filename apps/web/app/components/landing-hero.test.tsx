import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingHero } from "./landing-hero";
import { renderWithIntl } from "../../test/render-with-intl";
import ptBRMessages from "../../messages/pt-BR.json";

describe("LandingHero", () => {
  it("renders the product message and call to action in pt-BR", () => {
    const authUrl = "http://localhost:3000/auth/google";
    const bypassUrl = "http://localhost:3000/auth/bypass";

    renderWithIntl(
      <LandingHero authUrl={authUrl} bypassUrl={bypassUrl} isDev={true} />
    );

    expect(
      screen.getByRole("heading", {
        name: /Lore\s*Forge/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(ptBRMessages.login.tagline)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: ptBRMessages.login.signInGoogle })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: ptBRMessages.login.signInGoogle })
    ).toHaveAttribute("href", authUrl);
    expect(
      screen.getByRole("link", { name: ptBRMessages.login.devBypass })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: ptBRMessages.login.devBypass })
    ).toHaveAttribute("href", bypassUrl);
  });
});
