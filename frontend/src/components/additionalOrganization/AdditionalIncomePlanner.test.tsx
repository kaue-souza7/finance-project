import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdditionalIncomePlanner } from "./AdditionalIncomePlanner";
import { ToastProvider } from "@/contexts/ToastContext";
import { additionalOrganizationApi } from "@/services/additionalOrganization";
import type {
  AdditionalOrganizationDetail,
  AdditionalOrganizationItem,
} from "@/types/additionalOrganization";

vi.mock("@/services/additionalOrganization", () => ({
  additionalOrganizationApi: {
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
  },
}));

const api = vi.mocked(additionalOrganizationApi);

function item(
  id: string,
  name: string,
  amount: string,
  position: number,
): AdditionalOrganizationItem {
  return {
    id,
    organization_id: "org-1",
    name,
    amount,
    observation: null,
    position,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function organization(): AdditionalOrganizationDetail {
  return {
    id: "org-1",
    user_id: "user-1",
    title: "Décimo terceiro",
    type: "additional_income",
    total_amount: "5000.00",
    content: null,
    content_preview: null,
    show_observations: false,
    content_version: 1,
    item_count: 4,
    allocated_amount: "4000.00",
    remaining_amount: "1000.00",
    role: "owner",
    owner: {
      id: "user-1",
      name: "Proprietário",
      avatar_url: null,
    },
    items: [
      item("item-1", "Cartão de crédito", "800.00", 1),
      item("item-2", "Reserva de emergência", "1500.00", 2),
      item("item-3", "Viagem", "1200.00", 3),
      item("item-4", "Compras", "500.00", 4),
    ],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("AdditionalIncomePlanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza as linhas e os três indicadores", () => {
    render(
      <ToastProvider>
        <AdditionalIncomePlanner organization={organization()} />
      </ToastProvider>,
    );

    expect(screen.getAllByText("Cartão de crédito").length).toBeGreaterThan(0);
    expect(screen.getByText("Sobra")).toBeInTheDocument();
    expect(screen.getByText("Soma de valores")).toBeInTheDocument();
    expect(screen.getByText("Receita adicional")).toBeInTheDocument();
    expect(screen.getByText(/1\.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/4\.000,00/)).toBeInTheDocument();
  });

  it("edita uma linha e recalcula a sobra", async () => {
    const updated = item(
      "item-1",
      "Cartão de crédito",
      "900.00",
      1,
    );
    api.updateItem.mockResolvedValue(updated);

    render(
      <ToastProvider>
        <AdditionalIncomePlanner organization={organization()} />
      </ToastProvider>,
    );

    fireEvent.click(
      screen.getAllByRole("button", {
        name: "Editar Cartão de crédito",
      })[0],
    );

    fireEvent.change(screen.getByLabelText("Valor (R$)"), {
      target: { value: "900,00" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Salvar linha" }),
    );

    await waitFor(() => {
      expect(api.updateItem).toHaveBeenCalledWith(
        "org-1",
        "item-1",
        {
          name: "Cartão de crédito",
          amount: "900.00",
          expected_updated_at: "2026-01-01T00:00:00Z",
        },
      );
    });

    await waitFor(() => {
      expect(screen.getAllByText(/900,00/).length).toBeGreaterThan(0);
    });
  });
});
