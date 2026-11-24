import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AllocationFormSheet } from "./AllocationFormSheet";
import { additionalOrganizationApi } from "@/services/additionalOrganization";
import type { AdditionalOrganizationItem } from "@/types/additionalOrganization";

vi.mock("@/services/additionalOrganization", () => ({
  additionalOrganizationApi: {
    createItem: vi.fn(),
    updateItem: vi.fn(),
  },
}));

const api = vi.mocked(additionalOrganizationApi);

function item(
  overrides: Partial<AdditionalOrganizationItem> = {},
): AdditionalOrganizationItem {
  return {
    id: "item-1",
    organization_id: "org-1",
    name: "Cartão de crédito",
    amount: "800.00",
    observation: "Fatura",
    position: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("AllocationFormSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cria uma linha com observação", async () => {
    const onSuccess = vi.fn();
    api.createItem.mockResolvedValue(item());

    render(
      <AllocationFormSheet
        open
        organizationId="org-1"
        showObservations
        onClose={vi.fn()}
        onSuccess={onSuccess}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "  Cartão de crédito " },
    });
    fireEvent.change(screen.getByLabelText("Valor (R$)"), {
      target: { value: "800,00" },
    });
    fireEvent.change(screen.getByLabelText(/Observação/), {
      target: { value: "Fatura" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Adicionar linha" }),
    );

    await waitFor(() => {
      expect(api.createItem).toHaveBeenCalledWith("org-1", {
        name: "Cartão de crédito",
        amount: "800.00",
        observation: "Fatura",
      });
    });
    expect(onSuccess).toHaveBeenCalledWith(item());
  });

  it("valida nome e valor", async () => {
    render(
      <AllocationFormSheet
        open
        organizationId="org-1"
        showObservations={false}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Reserva" },
    });
    fireEvent.change(screen.getByLabelText("Valor (R$)"), {
      target: { value: "0,00" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Adicionar linha" }),
    );

    expect(
      await screen.findByText(
        "Informe um valor maior que zero, com até 2 casas decimais.",
      ),
    ).toBeInTheDocument();
    expect(api.createItem).not.toHaveBeenCalled();
  });

  it("edita uma linha sem enviar observação quando desabilitada", async () => {
    const onSuccess = vi.fn();
    const initial = item({
      name: "Reserva",
      amount: "1500.00",
      observation: "Guardar",
    });
    api.updateItem.mockResolvedValue(initial);

    render(
      <AllocationFormSheet
        open
        organizationId="org-1"
        showObservations={false}
        onClose={vi.fn()}
        onSuccess={onSuccess}
        initial={initial}
      />,
    );

    expect(
      screen.queryByLabelText(/Observação/),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Valor (R$)"), {
      target: { value: "1.600,00" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Salvar linha" }),
    );

    await waitFor(() => {
      expect(api.updateItem).toHaveBeenCalledWith("org-1", "item-1", {
        name: "Reserva",
        amount: "1600.00",
        expected_updated_at: "2026-01-01T00:00:00Z",
      });
    });
  });
});
