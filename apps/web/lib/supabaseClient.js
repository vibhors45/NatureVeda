// Supabase client setup — shared across the web app.
// Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
// in a .env.local file (free, self-generated from your Supabase project dashboard).

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Auth helper functions covering Google, email, and phone sign-in ---

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({ provider: "google" });
}

export async function signUpWithEmail(email, password) {
  return supabase.auth.signUp({ email, password });
}

export async function signInWithEmail(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

// Phone auth: step 1, send OTP
export async function signInWithPhone(phone) {
  return supabase.auth.signInWithOtp({ phone });
}

// Phone auth: step 2, verify the OTP code the user received via SMS
export async function verifyPhoneOtp(phone, token) {
  return supabase.auth.verifyOtp({ phone, token, type: "sms" });
}

export async function signOut() {
  return supabase.auth.signOut();
}
