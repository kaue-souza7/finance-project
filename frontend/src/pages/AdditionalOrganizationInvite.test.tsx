import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdditionalOrganizationInvite } from "./AdditionalOrganizationInvite";
import { ToastProvider } from "@/contexts/ToastContext";
import { additionalOrganizationApi } from "@/services/additionalOrganization";
import type { AdditionalOrganizationInvitePreview } from "@/types/additionalOrganizationSharing";

vi.mock("@/services/additionalOrganization", () => ({
  additionalOrganizationApi: {
    resolveInviteToken: vi.fn(),
    acceptInvite: vi.fn(),
    declineInvite: vi.fn(),
  },
}));

const api = vi.mocked(additionalOrganizationApi);

function preview(): AdditionalOrganizationInvitePreview {
  return {
    invite_id: "invite-1",
    organization_id: "org-1",
    title: "Décimo terceiro 2026",
    type: "additional_income",
    owner_name: "Ana",
    expires_at: "2026-01-08T00:00:00Z",
    status: "pending",
  };
}

function renderPage() {
  return render(
    <MemoryRouter
      initialEntries={[
        "/organizacao-adicional/convite?token=token-seguro",
      ]}
    >
      <ToastProvider>
        <Routes>
          <Route
            path="/organizacao-adicional/convite"
            element={<AdditionalOrganizationInvite />}
          />
          <Route
            path="/organizacao-adicional/:id"
            element={<div>Detalhe</div>}
          />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe("AdditionalOrganizationInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("valida o token e permite aceitar", async () => {
    api.resolveInviteToken.mockResolvedValue(preview());
    api.acceptInvite.mockResolvedValue({
      id: "invite-1",
      organization_id: "org-1",
      organization_title: "Décimo terceiro 2026",
      sender_id: "owner-1",
      sender_name: "Ana",
      sender_email: "ana@test.com",
      invited_email: "bia@test.com",
      receiver_user_id: "user-2",
      status: "accepted",
      email_status: "sent",
      created_at: "2026-01-01T00:00:00Z",
      expires_at: "2026-01-08T00:00:00Z",
      last_sent_at: "2026-01-01T00:00:00Z",
      responded_at: "2026-01-02T00:00:00Z",
    });

    renderPage();

    expect(
      await screen.findByText("Décimo terceiro 2026"),
    ).toBeInTheDocument();
    expect(screen.getByText(/convidado por Ana/)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Aceitar convite" }),
    );

    await waitFor(() => {
      expect(api.resolveInviteToken).toHaveBeenCalledWith(
        "token-seguro",
      );
      expect(api.acceptInvite).toHaveBeenCalledWith("invite-1");
    });
    expect(await screen.findByText("Detalhe")).toBeInTheDocument();
  });

  it("exibe convite expirado", async () => {
    api.resolveInviteToken.mockResolvedValue({
      ...preview(),
      status: "expired",
    });

    renderPage();

    expect(
      await screen.findByText("Convite expirado"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Aceitar convite" }),
    ).not.toBeInTheDocument();
  });
});
