import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_LIFETIME_SECONDS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_LIFETIME_SECONDS,
  buildSessionCookieOptions,
} from "@/lib/auth-cookies";
import { getServerApiUrl } from "@/lib/api-url";

export async function GET(request: NextRequest) {
  const handoff = request.nextUrl.searchParams.get("handoff");
  if (!handoff) {
    return NextResponse.redirect(new URL("/?auth=missing", request.url));
  }

  const apiUrl = getServerApiUrl().replace(/\/+$/, "");
  let redeemResponse: Response;
  try {
    redeemResponse = await fetch(
      `${apiUrl}/auth/handoff/redeem?token=${encodeURIComponent(handoff)}`,
      { cache: "no-store" },
    );
  } catch {
    return NextResponse.redirect(new URL("/?auth=failed", request.url));
  }

  if (!redeemResponse.ok) {
    return NextResponse.redirect(new URL("/?auth=failed", request.url));
  }

  const session = (await redeemResponse.json()) as {
    accessToken: string;
    refreshToken: string;
  };

  const response = NextResponse.redirect(new URL("/home", request.url));
  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    session.accessToken,
    buildSessionCookieOptions(ACCESS_TOKEN_LIFETIME_SECONDS),
  );
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    session.refreshToken,
    buildSessionCookieOptions(REFRESH_TOKEN_LIFETIME_SECONDS),
  );

  return response;
}
