import { getPublicApiUrl } from "./public-env";

const SAME_ORIGIN_API_PREFIX = "/api/backend";

function getApiHost(apiUrl: string): string | null {
  try {
    return new URL(apiUrl).host;
  } catch {
    return null;
  }
}

export function hasSplitOrigins(frontendHost?: string): boolean {
  const apiHost = getApiHost(getPublicApiUrl());
  if (!apiHost) {
    return false;
  }

  if (frontendHost) {
    return apiHost !== frontendHost;
  }

  if (typeof window !== "undefined") {
    return apiHost !== window.location.host;
  }

  return false;
}

export function getBrowserApiUrl(): string {
  if (hasSplitOrigins()) {
    return SAME_ORIGIN_API_PREFIX;
  }

  return getPublicApiUrl();
}

export function getServerApiUrl(): string {
  return getPublicApiUrl();
}

export { SAME_ORIGIN_API_PREFIX };
