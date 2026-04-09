import { cookies } from "next/headers";

export const ACCESS_TOKEN_COOKIE = "lrm_access_token";
export const REFRESH_TOKEN_COOKIE = "lrm_refresh_token";

type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
};

type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: AuthUser;
};

type AuthSignupResponse = {
  user: AuthUser | null;
  session: AuthSession | null;
};

type AuthLoginResponse = AuthSession;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function ensureAuthEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase auth env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.");
  }
}

async function supabaseAuthFetch(path: string, init: RequestInit) {
  ensureAuthEnv();

  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY as string,
      Authorization: `Bearer ${SUPABASE_ANON_KEY as string}`,
      "Content-Type": "application/json",
      ...init.headers
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase auth request failed (${response.status}): ${errorBody}`);
  }

  return response;
}

export async function signUpWithEmailPassword(input: { email: string; password: string; fullName: string }) {
  const response = await supabaseAuthFetch("signup", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      data: { full_name: input.fullName }
    })
  });

  return (await response.json()) as AuthSignupResponse;
}

export async function signInWithEmailPassword(input: { email: string; password: string }) {
  const response = await supabaseAuthFetch("token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      password: input.password
    })
  });

  return (await response.json()) as AuthLoginResponse;
}

export async function getUserFromAccessToken(accessToken: string): Promise<AuthUser | null> {
  ensureAuthEnv();

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY as string,
      Authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as AuthUser;
}

export async function getCurrentAuthenticatedUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return null;
  }

  return getUserFromAccessToken(accessToken);
}

export type { AuthSession, AuthUser };
