export const HOME_ENTRY_LOADER_COMPLETE_EVENT = "homeEntryLoaderComplete";
export const HOME_ENTRY_LOADER_SCROLL_LOCK_CLASS = "home-entry-loader-scroll-lock";
export const HOME_ENTRY_LOADER_ACTIVE_CLASS = "home-entry-loader-active";
export const HOME_ENTRY_LOADER_COLOR = "#857d71";

export function syncAppViewportHeight() {
  if (typeof window === "undefined") return;

  const vv = window.visualViewport;
  // Layout viewport (innerHeight) must win on iOS Safari so fixed overlays
  // extend behind the floating URL bar; visualViewport alone leaves a black gap.
  const height = Math.max(
    window.innerHeight,
    document.documentElement.clientHeight,
    vv ? vv.height + vv.offsetTop : 0
  );
  document.documentElement.style.setProperty("--app-height", `${height}px`);
  document.documentElement.style.setProperty("--ios-viewport-height", `${height}px`);
}

export function setHomeLoaderChromeActive(active: boolean) {
  if (typeof document === "undefined") return;

  const loaderChromeColor = HOME_ENTRY_LOADER_COLOR;

  document.documentElement.classList.toggle(HOME_ENTRY_LOADER_ACTIVE_CLASS, active);
  if (active) {
    syncAppViewportHeight();
    document.documentElement.style.backgroundColor = loaderChromeColor;
    document.body.style.backgroundColor = loaderChromeColor;
    return;
  }

  document.documentElement.style.backgroundColor = "";
  document.body.style.backgroundColor = "";
}

export function releaseHomeScrollLock() {
  if (typeof document === "undefined") return;

  document.documentElement.classList.remove(HOME_ENTRY_LOADER_SCROLL_LOCK_CLASS);
  setHomeLoaderChromeActive(false);
  document.body.style.position = "";
  document.body.style.inset = "";
  document.body.style.top = "";
  document.body.style.width = "";
  document.body.style.height = "";
  document.body.style.overflow = "";
}

export function notifyHomeEntryLoaderComplete() {
  if (typeof window !== "undefined") {
    releaseHomeScrollLock();
    window.dispatchEvent(new CustomEvent(HOME_ENTRY_LOADER_COMPLETE_EVENT));
  }
}
