export const APP_SCROLL_ROOT_SELECTOR = ".app-scroll-root";

export function getStableMobileLayoutHeight(): number {
  if (typeof window === "undefined") return 0;

  let lvhHeight = 0;
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;visibility:hidden;pointer-events:none;height:100lvh;top:0;left:0;width:0;";
  document.documentElement.appendChild(probe);
  lvhHeight = probe.offsetHeight;
  probe.remove();

  return Math.max(window.innerHeight, document.documentElement.clientHeight, lvhHeight);
}

export function syncAuthMobileBgHeight(): void {
  if (typeof window === "undefined") return;
  if (!window.matchMedia("(max-width: 1023px)").matches) return;

  const height = getStableMobileLayoutHeight();
  const header =
    Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--site-header-height")
    ) || 113;

  document.documentElement.style.setProperty(
    "--auth-mobile-bg-height",
    `${Math.ceil(height - header)}px`
  );
}

export function clearAuthMobileBgHeight(): void {
  if (typeof document === "undefined") return;
  document.documentElement.style.removeProperty("--auth-mobile-bg-height");
}

export function syncIosViewportHeight() {
  if (typeof window === "undefined") return;

  if (!window.matchMedia("(max-width: 1023px)").matches) return;

  const vv = window.visualViewport;
  let lvhHeight = 0;

  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;visibility:hidden;pointer-events:none;height:100lvh;top:0;left:0;width:0;";
  document.documentElement.appendChild(probe);
  lvhHeight = probe.offsetHeight;
  probe.remove();

  const height = Math.max(
    window.innerHeight,
    document.documentElement.clientHeight,
    lvhHeight,
    vv ? vv.height + (vv.offsetTop || 0) : 0
  );
  document.documentElement.style.setProperty("--ios-viewport-height", `${height}px`);
  document.documentElement.style.setProperty("--app-height", `${height}px`);
}

const MOBILE_BROWSER_TOOLBAR_RESERVE_PX = 84;

export type SalonMapChromeSyncOptions = {
  reserveBottomToolbar?: boolean;
};

/** Safari / mobile browser chrome — sizes salon panel to the visible viewport. */
export function syncSalonMapMobileChrome(options?: SalonMapChromeSyncOptions) {
  if (typeof window === "undefined") return;
  if (!window.matchMedia("(max-width: 1023px)").matches) return;

  syncIosViewportHeight();

  const vv = window.visualViewport;
  const layoutHeight = window.innerHeight;

  if (!vv) {
    clearSalonMapMobileChrome();
    return;
  }

  const top = Math.round(vv.offsetTop);
  let visibleHeight = Math.round(vv.height);
  let bottomChrome = Math.max(0, layoutHeight - visibleHeight - top);

  if (bottomChrome < 48 && options?.reserveBottomToolbar) {
    bottomChrome = MOBILE_BROWSER_TOOLBAR_RESERVE_PX;
    visibleHeight = Math.max(0, layoutHeight - top - bottomChrome);
  }

  document.documentElement.style.setProperty("--salon-map-visible-top", `${top}px`);
  document.documentElement.style.setProperty("--salon-map-visible-height", `${visibleHeight}px`);
  document.documentElement.style.setProperty("--salon-map-bottom-chrome", `${bottomChrome}px`);
  document.documentElement.style.setProperty("--salon-map-top-offset", `${top}px`);
}

export function syncSalonMapImmersiveViewport() {
  if (typeof window === "undefined") return;
  if (!window.matchMedia("(max-width: 1023px)").matches) return;

  syncIosViewportHeight();

  const offsetTop = window.visualViewport ? Math.round(window.visualViewport.offsetTop) : 0;
  document.documentElement.style.setProperty("--salon-map-immersive-offset-top", `${offsetTop}px`);
}

export function clearSalonMapImmersiveViewport() {
  if (typeof document === "undefined") return;
  document.documentElement.style.removeProperty("--salon-map-immersive-offset-top");
}

export function clearSalonMapMobileChrome() {
  if (typeof document === "undefined") return;
  document.documentElement.style.removeProperty("--salon-map-bottom-chrome");
  document.documentElement.style.removeProperty("--salon-map-top-offset");
  document.documentElement.style.removeProperty("--salon-map-visible-top");
  document.documentElement.style.removeProperty("--salon-map-visible-height");
  clearSalonMapImmersiveViewport();
}

export function setAppScrollLocked(locked: boolean) {
  if (typeof document === "undefined") return;

  const root = document.querySelector<HTMLElement>(APP_SCROLL_ROOT_SELECTOR);
  if (!root) return;

  root.style.overflow = locked ? "hidden" : "";
}

export function scrollAppScrollRootToTop() {
  if (typeof window === "undefined") return;

  const root = document.querySelector<HTMLElement>(APP_SCROLL_ROOT_SELECTOR);
  if (root) {
    root.scrollTop = 0;
  }

  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}
