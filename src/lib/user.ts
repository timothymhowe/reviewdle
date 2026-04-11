import { v4 as uuidv4 } from "uuid";

const COOKIE_NAME = "reviewdle_uid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2 years

export function getUserId(cookieHeader: string | null): string {
  if (cookieHeader) {
    const match = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${COOKIE_NAME}=`));
    if (match) return match.split("=")[1];
  }
  return uuidv4();
}

export function setUserCookie(
  headers: Headers,
  userId: string,
  isNew: boolean
): void {
  if (isNew) {
    headers.set(
      "Set-Cookie",
      `${COOKIE_NAME}=${userId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`
    );
  }
}

export function getUserIdFromCookies(cookieHeader: string | null): {
  userId: string;
  isNew: boolean;
} {
  const existing = extractCookieValue(cookieHeader, COOKIE_NAME);
  if (existing) return { userId: existing, isNew: false };
  return { userId: uuidv4(), isNew: true };
}

function extractCookieValue(
  cookieHeader: string | null,
  name: string
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? match.split("=")[1] : null;
}
