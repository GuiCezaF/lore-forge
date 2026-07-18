import { vi } from "vitest";

export function useRouter() {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  };
}

export function usePathname() {
  return "/";
}

export const redirect = vi.fn();
