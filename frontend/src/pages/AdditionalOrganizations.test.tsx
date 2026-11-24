import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdditionalOrganizations } from "./AdditionalOrganizations";
import { ToastProvider } from "@/contexts/ToastContext";
import { additionalOrganizationApi } from "@/services/additionalOrganization";
import type { AdditionalOrganizationSummary } from "@/types/additionalOrganization";
import type { AdditionalOrganizationInvite } from "@/types/additionalOrganizationSharing";

vi.mock("@/services/additionalOrganization", () => ({
  additionalOrganizationApi: {
    list: vi.fn(),
    listShared: vi.fn(),
    listReceivedInvites: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateContent: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    listParticipants: vi.fn(),
    listInvites: vi.fn(),
    sendInvite: vi.fn(),
    resendInvite: vi.fn(),
    cancelInvite: vi.fn(),
    removeParticipant: vi.fn(),
    acceptInvite: vi.fn(),
    declineInvite: vi.fn(),
    resolveInviteToken: vi.fn(),
  },
}));

const api = vi.mocked(additionalOrganizationApi);

function summary(
  overrides: Partial<AdditionalOrganizationSummary> = {},
): AdditionalOrganizationSummary {
  return {
    id: "org-1",
    user_id: "user-1",
    title: "Décimo terceiro 2026",
    type: "additional_income",
    total_amount: "5000.00",
    content_preview: null,
    show_observations: false,
    content_version: 1,
    item_count: 0,
    allocated_amount: "0.00",
    remaining_amount: "5000.00",
    role: "owner",
    owner: {
      id: "user-1",
      name: "Owner",
      avatar_url: null,
    },
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <AdditionalOrganizations />
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe("AdditionalOrganizations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    api.listShared.mockResolvedValue([]);
    api.listReceivedInvites.mockResolvedValue([]);
  });

  it("lista, pesquisa e alterna a visualização", async () => {
    api.list.mockResolvedValue([
      summary(),
      summary({
        id: "org-2",
        title: "Planejamento de dezembro",
        type: "free_text",
        total_amount: null,
        remaining_amount: null,
        content_preview: "Reservar parte do 13º",
      }),
    ]);

    renderPage();

    expect(
      await screen.findByText("Décimo terceiro 2026"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Planejamento de dezembro"),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText("Pesquisar organizações"),
      { target: { value: "decimo" } },
    );

    await waitFor(() => {
      expect(
        screen.queryByText("Planejamento de dezembro"),
      ).not.toBeInTheDocument();
    });
    expect(
      screen.getByText("Décimo terceiro 2026"),
    ).toBeInTheDocument();
    expect(screen.getByText("1 organização")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Visualizar em lista" }),
    );
    expect(localStorage.getItem("finance:additional-organizations:view")).toBe(
      "list",
    );
    expect(
      screen.getByRole("button", { name: "Visualizar em lista" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("exibe estado de carregamento", async () => {
    api.list.mockReturnValue(new Promise(() => undefined));

    const { container } = renderPage();

    expect(
      container.querySelectorAll(".animate-skeleton").length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText("Nenhuma organização adicional"),
    ).not.toBeInTheDocument();
  });

  it("exibe estado vazio", async () => {
    api.list.mockResolvedValue([]);

    renderPage();

    expect(
      await screen.findByText("Nenhuma organização adicional"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Criar primeira organização",
      }),
    ).toBeInTheDocument();
  });

  it("separa organizações próprias, compartilhadas e convites pendentes", async () => {
    api.list.mockResolvedValue([summary()]);
    api.listShared.mockResolvedValue([
      summary({
        id: "org-shared",
        user_id: "owner-2",
        title: "Planilha da família",
        role: "participant",
        owner: {
          id: "owner-2",
          name: "Ana",
          avatar_url: null,
        },
        total_amount: "1000.00",
        remaining_amount: "1000.00",
      }),
    ]);
    api.listReceivedInvites.mockResolvedValue([
      {
        id: "invite-1",
        organization_id: "org-3",
        organization_title: "PLR 2026",
        sender_id: "owner-3",
        sender_name: "Carlos",
        sender_email: "carlos@test.com",
        invited_email: "teste@gmail.com",
        receiver_user_id: "user-1",
        status: "pending",
        email_status: "sent",
        created_at: "2026-01-01T00:00:00Z",
        expires_at: "2026-01-08T00:00:00Z",
        last_sent_at: "2026-01-01T00:00:00Z",
        responded_at: null,
      } as AdditionalOrganizationInvite,
    ]);

    renderPage();

    expect(
      await screen.findByText("Minhas organizações"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Organizações compartilhadas"),
    ).toBeInTheDocument();
    expect(screen.getByText("Planilha da família")).toBeInTheDocument();
    expect(screen.getAllByText(/Compartilhada por Ana/).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getByText("Você tem 1 convite de organização"),
    ).toBeInTheDocument();
  });

  it("exibe erro e permite tentar novamente", async () => {    api.list
      .mockRejectedValueOnce(new Error("Falha de conexão"))
      .mockResolvedValueOnce([summary()]);

    renderPage();

    expect(
      await screen.findByText("Falha de conexão"),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );

    expect(
      await screen.findByText("Décimo terceiro 2026"),
    ).toBeInTheDocument();
    expect(api.list).toHaveBeenCalledTimes(2);
  });

  it("exclui uma organização com confirmação", async () => {
    api.list.mockResolvedValue([summary()]);
    api.delete.mockResolvedValue(undefined);

    renderPage();

    await screen.findByText("Décimo terceiro 2026");
    fireEvent.click(
      screen.getByRole("button", {
        name: "Excluir Décimo terceiro 2026",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("org-1");
    });
    await waitFor(() => {
      expect(api.list).toHaveBeenCalledTimes(2);
    });
  });
});
