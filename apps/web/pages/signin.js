import { useState } from "react";
import NavBar from "../components/NavBar";
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signInWithPhone,
  verifyPhoneOtp,
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
      <div style={{ maxWidth: 400, margin: "80px auto", fontFamily: "sans-serif" }}>
      <h1>Welcome Back</h1>
      <p>Sign in to continue your NatureVeda wellness journey.</p>

      <button onClick={signInWithGoogle} style={{ width: "100%", padding: 12, marginBottom: 16 }}>
        Continue with Google
      </button>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setMethod("email")}>Email</button>
        <button onClick={() => setMethod("phone")}>Phone</button>
      </div>

      {method === "email" && (
        <form onSubmit={handleEmailSubmit}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 10, marginBottom: 8 }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 10, marginBottom: 8 }}
          />
          <button type="submit" style={{ width: "100%", padding: 12 }}>
            {isSignUp ? "Sign Up" : "Sign In"}
          </button>
          <p onClick={() => setIsSignUp(!isSignUp)} style={{ cursor: "pointer", marginTop: 8 }}>
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
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
            style={{ width: "100%", padding: 10, marginBottom: 8 }}
          />
          {otpSent && (
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={{ width: "100%", padding: 10, marginBottom: 8 }}
            />
          )}
          <button type="submit" style={{ width: "100%", padding: 12 }}>
            {otpSent ? "Verify Code" : "Send OTP"}
          </button>
        </form>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
}
