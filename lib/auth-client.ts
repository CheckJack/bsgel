import { signOut } from "next-auth/react";
import { clearAuthMobileBgHeight } from "@/lib/mobile-scroll-root";

/** Remove leftover auth portals/CSS that can survive soft navigations. */
function clearAuthPageChrome() {
  if (typeof document === "undefined") return;
  document
    .querySelectorAll(".auth-mobile-bg-bleed, [data-auth-mobile-pane]")
    .forEach((el) => el.remove());
  clearAuthMobileBgHeight();
}

/** Sign out and hard-navigate to login on the current origin (avoids NEXTAUTH_URL mismatches). */
export async function signOutToLogin() {
  try {
    await signOut({ redirect: false });
  } catch (error) {
    console.error("Sign out failed:", error);
  }
  clearAuthPageChrome();
  // Full page load so login images remount cleanly (no stale RSC/image cache shell)
  window.location.assign("/login");
}
