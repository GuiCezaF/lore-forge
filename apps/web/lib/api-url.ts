import { getPublicApiUrl } from "./public-env";

const SAME_ORIGIN_API_PREFIX = "/api/backend";
const DEFAULT_DEV_API_URL = "http://localhost:3000";

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function isLocalhostApiUrl(apiUrl: string): boolean {
  try {
    const { hostname } = new URL(apiUrl);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return true;
  }
}

export function resolveServerApiUrl(): string {
  const explicit =
    process.env.API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();

  if (explicit) {
    return trimTrailingSlash(explicit);
  }

  return DEFAULT_DEV_API_URL;
}

export function isServerApiUrlMisconfigured(): boolean {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  return isLocalhostApiUrl(resolveServerApiUrl());
}

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
  return resolveServerApiUrl();
}

export { SAME_ORIGIN_API_PREFIX };
