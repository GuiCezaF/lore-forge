import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingHero } from "./landing-hero";

describe("LandingHero", () => {
  it("renders the product message and call to action", () => {
    render(<LandingHero />);

    expect(
      screen.getByRole("heading", {
        name: /mesa virtual com mapa, fichas e documentos em um só lugar/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /explorar base/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/vitest pronto para rodar/i),
    ).toBeInTheDocument();
  });
});
