import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingHero } from "./landing-hero";

describe("LandingHero", () => {
  it("renders the product message and call to action", () => {
    const authUrl = "http://localhost:3000/auth/google";

    const { container } = render(<LandingHero authUrl={authUrl} />);

    expect(
      screen.getByRole("heading", {
        name: /entre com sua conta google/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/autenticação oauth2 com access token/i),
    ).toBeInTheDocument();
    expect(screen.getByText("LoreForge")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /logar com o google/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /logar com o google/i })).toHaveAttribute(
      "href",
      authUrl,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
