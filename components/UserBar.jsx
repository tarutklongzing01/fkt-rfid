"use client";

import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../lib/useAuth";

export default function UserBar() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="user-bar">
      <span className="user-email">{user.email}</span>
      <button className="ghost-button compact-button" type="button" onClick={() => signOut(auth)}>
        Logout
      </button>
    </div>
  );
}
