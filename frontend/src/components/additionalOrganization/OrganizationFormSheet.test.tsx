import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrganizationFormSheet } from "./OrganizationFormSheet";
import { additionalOrganizationApi } from "@/services/additionalOrganization";
import type { AdditionalOrganizationSummary } from "@/types/additionalOrganization";

vi.mock("@/services/additionalOrganization", () => ({
  additionalOrganizationApi: {
    create: vi.fn(),
    update: vi.fn(),
  },
}));

const api = vi.mocked(additionalOrganizationApi);

function summary(
  overrides: Partial<AdditionalOrganizationSummary> = {},
): AdditionalOrganizationSummary {
  return {
    id: "org-1",
    user_id: "user-1",
    title: "Nova organização",
    type: "free_text",
    total_amount: null,
    content_preview: null,
    show_observations: false,
    content_version: 1,
    item_count: 0,
    allocated_amount: "0.00",
    remaining_amount: null,
    role: "owner",
    owner: {
      id: "user-1",
      name: "Owner",
      avatar_url: null,
    },
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("OrganizationFormSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cria uma organização de texto livre", async () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    api.create.mockResolvedValue(summary());

    render(
      <OrganizationFormSheet
        open
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "  Planejamento de dezembro  " },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Criar organização" }),
    );

    await waitFor(() => {
      expect(api.create).toHaveBeenCalledWith({
        title: "Planejamento de dezembro",
        type: "free_text",
        total_amount: null,
        show_observations: false,
      });
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("cria uma receita adicional com observações", async () => {
    const onSuccess = vi.fn();
    api.create.mockResolvedValue(
      summary({
        type: "additional_income",
        total_amount: "5000.00",
        show_observations: true,
        remaining_amount: "5000.00",
      }),
    );

    render(
      <OrganizationFormSheet
        open
        onClose={vi.fn()}
        onSuccess={onSuccess}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Receita Adicional/ }),
    );
    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Décimo terceiro" },
    });
    fireEvent.change(
      screen.getByLabelText("Valor da receita adicional (R$)"),
      { target: { value: "5.000,00" } },
    );
    fireEvent.click(
      screen.getByLabelText(/Incluir coluna de observações/),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Criar organização" }),
    );

    await waitFor(() => {
      expect(api.create).toHaveBeenCalledWith({
        title: "Décimo terceiro",
        type: "additional_income",
        total_amount: "5000.00",
        show_observations: true,
      });
    });
  });

  it("valida valor obrigatório na receita adicional", async () => {
    render(
      <OrganizationFormSheet
        open
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Receita Adicional/ }),
    );
    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "PLR" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Criar organização" }),
    );

    expect(
      await screen.findByText(
        "Informe um valor maior que zero, com até 2 casas decimais.",
      ),
    ).toBeInTheDocument();
    expect(api.create).not.toHaveBeenCalled();
  });

  it("edita uma organização mantendo o tipo", async () => {
    const onSuccess = vi.fn();
    const initial = summary({
      title: "Antigo",
      type: "additional_income",
      total_amount: "1000.00",
      remaining_amount: "1000.00",
      show_observations: false,
    });
    api.update.mockResolvedValue(
      summary({
        title: "Novo",
        type: "additional_income",
        total_amount: "2000.00",
        remaining_amount: "2000.00",
      }),
    );

    render(
      <OrganizationFormSheet
        open
        onClose={vi.fn()}
        onSuccess={onSuccess}
        initial={initial}
      />,
    );

    expect(screen.getByText("Tipo fixo")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Novo" },
    });
    fireEvent.change(
      screen.getByLabelText("Valor da receita adicional (R$)"),
      { target: { value: "2.000,00" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Salvar alterações" }),
    );

    await waitFor(() => {
      expect(api.update).toHaveBeenCalledWith("org-1", {
        title: "Novo",
        total_amount: "2000.00",
        show_observations: false,
      });
    });
    expect(onSuccess).toHaveBeenCalled();
  });
});
