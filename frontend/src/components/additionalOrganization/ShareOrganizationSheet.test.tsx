import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ShareOrganizationSheet } from "./ShareOrganizationSheet";
import { ToastProvider } from "@/contexts/ToastContext";
import { additionalOrganizationApi } from "@/services/additionalOrganization";
import type {
  AdditionalOrganizationInvite,
  AdditionalOrganizationParticipant,
} from "@/types/additionalOrganizationSharing";

vi.mock("@/services/additionalOrganization", () => ({
  additionalOrganizationApi: {
    listParticipants: vi.fn(),
    listInvites: vi.fn(),
    sendInvite: vi.fn(),
    resendInvite: vi.fn(),
    cancelInvite: vi.fn(),
    removeParticipant: vi.fn(),
  },
}));

const api = vi.mocked(additionalOrganizationApi);

const participants: AdditionalOrganizationParticipant[] = [
  {
    membership_id: null,
    user_id: "owner-1",
    name: "Ana",
    email: "ana@test.com",
    avatar_url: null,
    role: "owner",
    joined_at: null,
  },
  {
    membership_id: "member-1",
    user_id: "user-2",
    name: "João",
    email: "joao@test.com",
    avatar_url: null,
    role: "participant",
    joined_at: "2026-01-01T00:00:00Z",
  },
];

function invite(): AdditionalOrganizationInvite {
  return {
    id: "invite-1",
    organization_id: "org-1",
    organization_title: "Décimo terceiro",
    sender_id: "owner-1",
    sender_name: "Ana",
    sender_email: "ana@test.com",
    invited_email: "maria@test.com",
    receiver_user_id: null,
    status: "pending",
    email_status: "sent",
    created_at: "2026-01-01T00:00:00Z",
    expires_at: "2026-01-08T00:00:00Z",
    last_sent_at: "2026-01-01T00:00:00Z",
    responded_at: null,
  };
}

function renderSheet(canManage = true) {
  return render(
    <ToastProvider>
      <ShareOrganizationSheet
        open
        organizationId="org-1"
        organizationTitle="Décimo terceiro"
        canManage={canManage}
        onClose={vi.fn()}
      />
    </ToastProvider>,
  );
}

describe("ShareOrganizationSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listParticipants.mockResolvedValue(participants);
    api.listInvites.mockResolvedValue([invite()]);
  });

  it("envia convite por e-mail", async () => {
    api.sendInvite.mockResolvedValue({
      ...invite(),
      id: "invite-2",
      invited_email: "novo@test.com",
      email_status: "unavailable",
    });

    renderSheet();
    await screen.findByText("João");

    fireEvent.change(screen.getByLabelText("E-mail da pessoa"), {
      target: { value: "novo@test.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Enviar convite" }),
    );

    await waitFor(() => {
      expect(api.sendInvite).toHaveBeenCalledWith(
        "org-1",
        "novo@test.com",
      );
    });
  });

  it("lista convites pendentes e permite cancelar", async () => {
    api.cancelInvite.mockResolvedValue(undefined);
    renderSheet();
    await screen.findByText("João");

    fireEvent.click(screen.getByRole("button", { name: /Convites/ }));
    expect(await screen.findByText("maria@test.com")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      expect(api.cancelInvite).toHaveBeenCalledWith("org-1", "invite-1");
    });
  });

  it("remove participante com confirmação", async () => {
    api.removeParticipant.mockResolvedValue(undefined);
    renderSheet();
    await screen.findByText("João");

    fireEvent.click(
      screen.getByRole("button", { name: "Remover João" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      expect(api.removeParticipant).toHaveBeenCalledWith(
        "org-1",
        "member-1",
      );
    });
  });

  it("não mostra gerenciamento para participante", async () => {
    renderSheet(false);
    await screen.findByText("João");

    expect(
      screen.queryByLabelText("E-mail da pessoa"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Convites/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remover João" }),
    ).not.toBeInTheDocument();
  });
});
