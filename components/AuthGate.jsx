"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../lib/useAuth";

export default function AuthGate({ children }) {
  const router = useRouter();
  const { user, authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, router, user]);

  if (authLoading) {
    return (
      <main className="app-shell">
        <section className="panel scan-panel">
          <p className="empty-state">กำลังตรวจสอบสิทธิ์...</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return children;
}
