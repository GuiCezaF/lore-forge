import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  buildSessionCookieOptions,
  clearSessionCookieOptions,
} from "@/lib/auth-cookies";
import { getServerApiUrl } from "@/lib/api-url";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxyRequest(request: NextRequest, path: string[]) {
  const apiUrl = getServerApiUrl().replace(/\/+$/, "");
  const targetPath = path.join("/");
  const targetUrl = `${apiUrl}/${targetPath}${request.nextUrl.search}`;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const cookieParts: string[] = [];
  if (accessToken) {
    cookieParts.push(`${ACCESS_TOKEN_COOKIE}=${accessToken}`);
  }
  if (refreshToken) {
    cookieParts.push(`${REFRESH_TOKEN_COOKIE}=${refreshToken}`);
  }
  if (cookieParts.length > 0) {
    headers.set("cookie", cookieParts.join("; "));
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    // Forward the raw stream rather than serialising it with `text()`.  The
    // latter corrupts multipart boundaries, which made portrait uploads fail
    // when the web app is proxying to a separately hosted API.
    init.body = request.body;
    (init as RequestInit & { duplex?: "half" }).duplex = "half";
  }

  const apiResponse = await fetch(targetUrl, init);
  const responseHeaders = new Headers();
  const responseContentType = apiResponse.headers.get("content-type");
  if (responseContentType) {
    responseHeaders.set("content-type", responseContentType);
  }

  const response = new NextResponse(apiResponse.body, {
    status: apiResponse.status,
    headers: responseHeaders,
  });

  if (targetPath === "auth/refresh" && apiResponse.ok) {
    const setCookie = apiResponse.headers.getSetCookie();
    for (const cookie of setCookie) {
      const [nameValue] = cookie.split(";");
      const separator = nameValue.indexOf("=");
      if (separator === -1) continue;
      const name = nameValue.slice(0, separator);
      const value = nameValue.slice(separator + 1);
      if (name === ACCESS_TOKEN_COOKIE) {
        response.cookies.set(
          ACCESS_TOKEN_COOKIE,
          value,
          buildSessionCookieOptions(15 * 60),
        );
      }
      if (name === REFRESH_TOKEN_COOKIE) {
        response.cookies.set(
          REFRESH_TOKEN_COOKIE,
          value,
          buildSessionCookieOptions(30 * 24 * 60 * 60),
        );
      }
    }
  }

  if (targetPath === "auth/logout" && apiResponse.status === 204) {
    const clearOptions = clearSessionCookieOptions();
    response.cookies.set(ACCESS_TOKEN_COOKIE, "", clearOptions);
    response.cookies.set(REFRESH_TOKEN_COOKIE, "", clearOptions);
  }

  return response;
}

async function handleProxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}
