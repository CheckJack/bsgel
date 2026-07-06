import { signOut } from "next-auth/react";

/** Sign out and stay on the current site origin (avoids NEXTAUTH_URL mismatches). */
export async function signOutToLogin() {
  await signOut({ redirect: false });
  window.location.assign("/login");
}
