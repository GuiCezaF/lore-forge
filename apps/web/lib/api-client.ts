import { getBrowserApiUrl } from "./api-url";

const REFRESH_PATH = "/auth/refresh";
let refreshRequest: Promise<boolean> | null = null;

function isRefreshRequest(input: RequestInfo | URL): boolean {
  return input.toString().includes(REFRESH_PATH);
}

async function refreshSession(): Promise<boolean> {
  if (!refreshRequest) {
    refreshRequest = fetch(`${getBrowserApiUrl()}${REFRESH_PATH}`, {
      method: "POST",
      credentials: "include",
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const requestInit: RequestInit = { ...init, credentials: "include" };
  const response = await fetch(input, requestInit);
  if (response.status !== 401 || isRefreshRequest(input)) return response;

  const refreshed = await refreshSession();
  if (refreshed) return fetch(input, requestInit);

  if (typeof window !== "undefined") {
    window.location.assign("/?auth=session");
  }
  return response;
}
