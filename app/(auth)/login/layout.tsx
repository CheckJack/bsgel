import type { ReactNode } from "react";

/**
 * Preload LCP auth backgrounds early (media-matched) so hard navigations
 * like logout → /login start the image fetch before client JS mounts.
 */
export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/auth/login-desktop.webp"
        type="image/webp"
        media="(min-width: 1024px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href="/auth/login-mobile.webp"
        type="image/webp"
        media="(max-width: 1023px)"
        fetchPriority="high"
      />
      {children}
    </>
  );
}
