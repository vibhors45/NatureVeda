import { useState } from "react";
import NavBar from "../components/NavBar";
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signInWithPhone,
  verifyPhoneOtp,
  isSupabaseConfigured,
} from "../lib/supabaseClient";

// Simple sign-in page supporting three methods, matching the
// "Google, email, phone number" sign-in requirement.
export default function SignIn() {
  const [method, setMethod] = useState("email"); // "email" | "phone"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setError(null);
    const { error } = isSignUp
      ? await signUpWithEmail(email, password)
      : await signInWithEmail(email, password);
    if (error) setError(error.message);
  }

  async function handlePhoneSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!otpSent) {
      const { error } = await signInWithPhone(phone);
      if (error) setError(error.message);
      else setOtpSent(true);
    } else {
      const { error } = await verifyPhoneOtp(phone, otp);
      if (error) setError(error.message);
    }
  }

  return (
    <div>
      <NavBar />
      <div style={pageStyles.outer}>
        <div style={pageStyles.glassCard}>
          <p style={pageStyles.eyebrow}>Welcome Back</p>
          <h1 style={pageStyles.title}>Sign In</h1>
          <p style={pageStyles.subtext}>
            Continue your NatureVeda wellness journey.
          </p>

          {!isSupabaseConfigured && (
            <div style={pageStyles.noticeBox}>
              Sign-in isn't fully set up yet — add your Supabase keys to{" "}
              <code>.env.local</code> to enable this.
            </div>
          )}

          <button onClick={signInWithGoogle} style={pageStyles.googleButton}>
            <span style={pageStyles.googleIcon}>G</span>
            Continue with Google
          </button>

          <div style={pageStyles.divider}>
            <span style={pageStyles.dividerLine} />
            <span style={pageStyles.dividerText}>or</span>
            <span style={pageStyles.dividerLine} />
          </div>

          <div style={pageStyles.methodToggle}>
            <button
              onClick={() => setMethod("email")}
              style={{
                ...pageStyles.methodButton,
                ...(method === "email" ? pageStyles.methodButtonActive : {}),
              }}
            >
              Email
            </button>
            <button
              onClick={() => setMethod("phone")}
              style={{
                ...pageStyles.methodButton,
                ...(method === "phone" ? pageStyles.methodButtonActive : {}),
              }}
            >
              Phone
            </button>
          </div>

          {method === "email" && (
            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={pageStyles.input}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={pageStyles.input}
              />
              <button type="submit" style={pageStyles.primaryButton}>
                {isSignUp ? "Sign Up" : "Sign In"}
              </button>
              <p
                onClick={() => setIsSignUp(!isSignUp)}
                style={pageStyles.switchText}
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </p>
            </form>
          )}

          {method === "phone" && (
            <form onSubmit={handlePhoneSubmit}>
              <input
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={pageStyles.input}
              />
              {otpSent && (
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={pageStyles.input}
                />
              )}
              <button type="submit" style={pageStyles.primaryButton}>
                {otpSent ? "Verify Code" : "Send OTP"}
              </button>
            </form>
          )}

          {error && <p style={pageStyles.errorText}>{error}</p>}
        </div>
      </div>
    </div>
  );
}

const pageStyles = {
  outer: {
    padding: "60px 24px",
    minHeight: "70vh",
    background:
      "linear-gradient(135deg, #E8E2D0 0%, #D9E3D3 45%, #F0DCC0 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    fontFamily: "sans-serif",
  },
  glassCard: {
    maxWidth: 400,
    width: "100%",
    padding: "40px 32px",
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid rgba(255, 255, 255, 0.6)",
    boxShadow: "0 8px 32px rgba(75, 122, 81, 0.12)",
  },
  eyebrow: {
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 1,
    color: "#4B7A51",
    fontWeight: 600,
    margin: 0,
  },
  title: {
    fontFamily: "Georgia, serif",
    fontSize: 30,
    margin: "6px 0 4px 0",
    color: "#2B2B24",
  },
  subtext: { color: "#6B6B5E", fontSize: 14, marginBottom: 24 },
  noticeBox: {
    padding: 12,
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: "#FCF7EE",
    border: "1px solid #F0C37A",
    color: "#946200",
    fontSize: 13,
    lineHeight: 1.5,
  },
  googleButton: {
    width: "100%",
    padding: "12px 16px",
    marginBottom: 20,
    borderRadius: 10,
    border: "1px solid #E4E0D5",
    backgroundColor: "#FFFFFF",
    color: "#2B2B24",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 18,
    height: 18,
    borderRadius: "50%",
    backgroundColor: "#4B7A51",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E4E0D5",
  },
  dividerText: { fontSize: 12, color: "#8A8A7C" },
  methodToggle: {
    display: "flex",
    gap: 8,
    marginBottom: 18,
    backgroundColor: "#F5F3EC",
    borderRadius: 10,
    padding: 4,
  },
  methodButton: {
    flex: 1,
    padding: "9px 0",
    borderRadius: 8,
    border: "none",
    backgroundColor: "transparent",
    color: "#6B6B5E",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  methodButtonActive: {
    backgroundColor: "#FFFFFF",
    color: "#2B2B24",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    marginBottom: 10,
    borderRadius: 10,
    border: "1px solid #E4E0D5",
    fontSize: 14,
    boxSizing: "border-box",
  },
  primaryButton: {
    width: "100%",
    padding: "12px 0",
    marginTop: 4,
    borderRadius: 10,
    border: "none",
    backgroundColor: "#4B7A51",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  switchText: {
    cursor: "pointer",
    marginTop: 14,
    fontSize: 13,
    color: "#4B7A51",
    textAlign: "center",
  },
  errorText: {
    color: "#A33A3A",
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
  },
};