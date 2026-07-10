// Supabase client setup -- shared across the web app.
// Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
// in a .env.local file (free, self-generated from your Supabase project dashboard).

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Only create a real client if both env vars are actually set. Without this
// guard, createClient() throws immediately at import time whenever the
// .env.local values are missing/placeholder, which crashes every page that
// imports this file (500 error) instead of just disabling auth gracefully.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const NOT_CONFIGURED_ERROR = {
  data: null,
  error: {
    message:
      "Sign-in isn't configured yet. Add your Supabase URL and anon key to .env.local (see docs/SETUP.md).",
  },
};

// --- Auth helper functions covering Google, email, and phone sign-in ---

export async function signInWithGoogle() {
  if (!supabase) return NOT_CONFIGURED_ERROR;
  return supabase.auth.signInWithOAuth({ provider: "google" });
}

export async function signUpWithEmail(email, password) {
  if (!supabase) return NOT_CONFIGURED_ERROR;
  return supabase.auth.signUp({ email, password });
}

export async function signInWithEmail(email, password) {
  if (!supabase) return NOT_CONFIGURED_ERROR;
  return supabase.auth.signInWithPassword({ email, password });
}

// Phone auth: step 1, send OTP
export async function signInWithPhone(phone) {
  if (!supabase) return NOT_CONFIGURED_ERROR;
  return supabase.auth.signInWithOtp({ phone });
}

// Phone auth: step 2, verify the OTP code the user received via SMS
export async function verifyPhoneOtp(phone, token) {
  if (!supabase) return NOT_CONFIGURED_ERROR;
  return supabase.auth.verifyOtp({ phone, token, type: "sms" });
}

export async function signOut() {
  if (!supabase) return NOT_CONFIGURED_ERROR;
  return supabase.auth.signOut();
}
