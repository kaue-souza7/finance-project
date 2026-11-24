import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrganizationToolbar } from "./OrganizationToolbar";

describe("OrganizationToolbar", () => {
  it("alterna entre blocos e lista", () => {
    const onViewModeChange = vi.fn();

    render(
      <OrganizationToolbar
        query=""
        onQueryChange={vi.fn()}
        viewMode="grid"
        onViewModeChange={onViewModeChange}
        count={2}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Visualizar em blocos" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("2 organizações")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Visualizar em lista" }),
    );
    expect(onViewModeChange).toHaveBeenCalledWith("list");
  });

  it("permite pesquisar e limpar", () => {
    const onQueryChange = vi.fn();

    render(
      <OrganizationToolbar
        query="13º"
        onQueryChange={onQueryChange}
        viewMode="list"
        onViewModeChange={vi.fn()}
        count={1}
      />,
    );

    fireEvent.change(screen.getByLabelText("Pesquisar organizações"), {
      target: { value: "férias" },
    });
    expect(onQueryChange).toHaveBeenCalledWith("férias");

    fireEvent.click(screen.getByLabelText("Limpar pesquisa"));
    expect(onQueryChange).toHaveBeenCalledWith("");
    expect(screen.getByText("1 organização")).toBeInTheDocument();
  });
});
