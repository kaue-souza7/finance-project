import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FreeTextEditor } from "./FreeTextEditor";
import { ToastProvider } from "@/contexts/ToastContext";
import { ApiError } from "@/services/api";
import { additionalOrganizationApi } from "@/services/additionalOrganization";
import type {
  AdditionalOrganizationDetail,
  AdditionalOrganizationSummary,
} from "@/types/additionalOrganization";

vi.mock("@/services/additionalOrganization", () => ({
  additionalOrganizationApi: {
    updateContent: vi.fn(),
    getById: vi.fn(),
  },
}));

const api = vi.mocked(additionalOrganizationApi);

function detail(content: string): AdditionalOrganizationDetail {
  return {
    id: "org-1",
    user_id: "user-1",
    title: "Minhas notas",
    type: "free_text",
    total_amount: null,
    content,
    content_preview: content || null,
    show_observations: false,
    content_version: 1,
    item_count: 0,
    allocated_amount: "0.00",
    remaining_amount: null,
    role: "owner",
    owner: {
      id: "user-1",
      name: "Proprietário",
      avatar_url: null,
    },
    items: [],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function summary(): AdditionalOrganizationSummary {
  const organization = detail("Minhas anotações");
  const { items, content, ...rest } = organization;
  void items;
  void content;
  return { ...rest, content_version: 2 };
}

describe("FreeTextEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("salva automaticamente após a digitação", async () => {
    const onSaved = vi.fn();
    api.updateContent.mockResolvedValue(summary());

    render(
      <ToastProvider>
        <FreeTextEditor
          organization={detail("")}
          onSaved={onSaved}
          onReload={vi.fn()}
        />
      </ToastProvider>,
    );

    fireEvent.change(
      screen.getByLabelText("Anotações da organização"),
      { target: { value: "Minhas anotações" } },
    );

    expect(screen.getByText("Alterações não salvas")).toBeInTheDocument();

    await waitFor(
      () => {
        expect(api.updateContent).toHaveBeenCalledWith("org-1", {
          content: "Minhas anotações",
          expected_version: 1,
        });
      },
      { timeout: 3000 },
    );

    await waitFor(() => {
      expect(screen.getByText("Salvo")).toBeInTheDocument();
    });
    expect(onSaved).toHaveBeenCalled();
  });

  it("salva ao perder o foco", async () => {
    api.updateContent.mockResolvedValue(summary());

    render(
      <ToastProvider>
        <FreeTextEditor
          organization={detail("Inicial")}
          onSaved={vi.fn()}
          onReload={vi.fn()}
        />
      </ToastProvider>,
    );

    const textarea = screen.getByLabelText("Anotações da organização");
    fireEvent.change(textarea, { target: { value: "Atualizado" } });
    fireEvent.blur(textarea);

    await waitFor(() => {
      expect(api.updateContent).toHaveBeenCalledWith("org-1", {
        content: "Atualizado",
        expected_version: 1,
      });
    });
  });

  it("preserva o texto local e permite sobrescrever em conflito", async () => {
    api.updateContent
      .mockRejectedValueOnce(new ApiError("Conflito", 409))
      .mockResolvedValueOnce({ ...summary(), content_version: 3 });
    api.getById.mockResolvedValue({
      ...detail("Versão remota"),
      content_version: 2,
    });

    render(
      <ToastProvider>
        <FreeTextEditor
          organization={detail("")}
          onSaved={vi.fn()}
          onReload={vi.fn()}
        />
      </ToastProvider>,
    );

    fireEvent.change(
      screen.getByLabelText("Anotações da organização"),
      { target: { value: "Meu texto local" } },
    );

    expect(
      await screen.findByText(
        "Texto alterado por outra pessoa",
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Manter meu texto e sobrescrever",
      }),
    );

    await waitFor(() => {
      expect(api.updateContent).toHaveBeenLastCalledWith("org-1", {
        content: "Meu texto local",
        expected_version: 2,
      });
    });
  });
});
