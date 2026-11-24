import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReceivedInvitesSheet } from "./ReceivedInvitesSheet";
import { ToastProvider } from "@/contexts/ToastContext";
import { additionalOrganizationApi } from "@/services/additionalOrganization";
import type { AdditionalOrganizationInvite } from "@/types/additionalOrganizationSharing";

vi.mock("@/services/additionalOrganization", () => ({
  additionalOrganizationApi: {
    acceptInvite: vi.fn(),
    declineInvite: vi.fn(),
  },
}));

const api = vi.mocked(additionalOrganizationApi);

function invite(): AdditionalOrganizationInvite {
  return {
    id: "invite-1",
    organization_id: "org-1",
    organization_title: "Décimo terceiro",
    sender_id: "owner-1",
    sender_name: "Ana",
    sender_email: "ana@test.com",
    invited_email: "joao@test.com",
    receiver_user_id: "user-2",
    status: "pending",
    email_status: "sent",
    created_at: "2026-01-01T00:00:00Z",
    expires_at: "2026-01-08T00:00:00Z",
    last_sent_at: "2026-01-01T00:00:00Z",
    responded_at: null,
  };
}

describe("ReceivedInvitesSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aceita convite e navega para a organização", async () => {
    const onAccepted = vi.fn();
    api.acceptInvite.mockResolvedValue({
      ...invite(),
      status: "accepted",
    });

    render(
      <ToastProvider>
        <ReceivedInvitesSheet
          open
          invites={[invite()]}
          onClose={vi.fn()}
          onAccepted={onAccepted}
          onDeclined={vi.fn()}
        />
      </ToastProvider>,
    );

    expect(screen.getByText("Décimo terceiro")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Aceitar" }));

    await waitFor(() => {
      expect(api.acceptInvite).toHaveBeenCalledWith("invite-1");
    });
    expect(onAccepted).toHaveBeenCalledWith("org-1");
  });

  it("recusa convite", async () => {
    const onDeclined = vi.fn();
    api.declineInvite.mockResolvedValue({
      ...invite(),
      status: "declined",
    });

    render(
      <ToastProvider>
        <ReceivedInvitesSheet
          open
          invites={[invite()]}
          onClose={vi.fn()}
          onAccepted={vi.fn()}
          onDeclined={onDeclined}
        />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Recusar" }));

    await waitFor(() => {
      expect(api.declineInvite).toHaveBeenCalledWith("invite-1");
    });
    expect(onDeclined).toHaveBeenCalledWith("invite-1");
  });
});
