"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useAuth } from "../../lib/useAuth";

function getMessage(error) {
  if (!error?.code) return "เข้าสู่ระบบไม่สำเร็จ";

  const messages = {
    "auth/email-already-in-use": "อีเมลนี้ถูกใช้งานแล้ว",
    "auth/invalid-email": "รูปแบบอีเมลไม่ถูกต้อง",
    "auth/invalid-credential": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    "auth/weak-password": "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
    "auth/operation-not-allowed": "ยังไม่ได้เปิด Email/Password provider ใน Firebase"
  };

  return messages[error.code] || error.message;
}

export default function LoginPage() {
  const router = useRouter();
  const { user, authLoading } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/scan");
    }
  }, [authLoading, router, user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (mode === "register") {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }

      router.replace("/scan");
    } catch (loginError) {
      setError(getMessage(loginError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-shell auth-shell">
      <section className="panel login-card">
        <div className="brand">
          <h1 className="brand-title">RFID Box Login</h1>
          <p className="brand-subtitle">เข้าสู่ระบบก่อนใช้งาน Scan และ Dashboard</p>
        </div>

        <div className="segmented-control" aria-label="Login mode">
          <button
            className={mode === "login" ? "segment active" : "segment"}
            type="button"
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={mode === "register" ? "segment active" : "segment"}
            type="button"
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="text-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            required
          />

          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="text-input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            minLength={6}
            required
          />

          {error ? <div className="form-error">{error}</div> : null}

          <button className="primary-button full-button" type="submit" disabled={saving}>
            {saving ? "กำลังตรวจสอบ..." : mode === "register" ? "Create Account" : "Login"}
          </button>
        </form>

        <div className="auth-links">
          <Link href="/scan">Scan</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </section>
    </main>
  );
}
