import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./tokenStorage";

describe("api refresh flow", () => {
  beforeEach(() => {
    clearTokens();
    vi.restoreAllMocks();
  });

  it("renova o access token e repete a requisição original", async () => {
    setTokens("access-antigo", "refresh-valido");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "access-novo",
            refresh_token: "refresh-novo",
            token_type: "bearer",
            expires_in: 1800,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    const result = await api.get<{ ok: boolean }>("/plannings/");

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(getAccessToken()).toBe("access-novo");
    expect(getRefreshToken()).toBe("refresh-novo");
  });
});
