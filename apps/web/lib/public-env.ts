const DEFAULT_DEV_API_URL = "http://localhost:3000";

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function getPublicApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_DEV_API_URL;
}

export function getGoogleAuthUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL?.trim();
  if (explicit) {
    return explicit;
  }

  return `${trimTrailingSlash(getPublicApiUrl())}/auth/google`;
}

export function getAuthBypassUrl(): string {
  return `${trimTrailingSlash(getPublicApiUrl())}/auth/bypass`;
}
