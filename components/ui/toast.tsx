"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle2, AlertCircle, Info, ShieldAlert, Ban } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export type ToastType = "success" | "error" | "info" | "warning" | "notice";

export interface Toast {
  id: string;
  message: string;
  title?: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastComponent({ toast, onClose }: ToastProps) {
  const { t } = useLanguage();

  const isNotice = toast.type === "notice";
  const isAssertive = toast.type === "error" || isNotice;
  const role = isAssertive ? "alert" : "status";
  const ariaLive = isAssertive ? "assertive" : "polite";

  if (isNotice) {
    return (
      <div
        role={role}
        aria-live={ariaLive}
        aria-atomic="true"
        className="relative flex min-w-[300px] max-w-[420px] items-start gap-3.5 rounded-none border border-brand-black/10 bg-brand-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
      >
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center bg-pink-900/[0.08]"
          aria-hidden="true"
        >
          <Ban className="h-[18px] w-[18px] text-pink-900" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          {toast.title ? (
            <>
              <p className="font-header text-[11px] font-semibold uppercase tracking-[0.14em] text-pink-900">
                {toast.title}
              </p>
              <p className="mt-2 font-header text-sm font-normal leading-relaxed text-brand-black/70">
                {toast.message}
              </p>
            </>
          ) : (
            <p className="font-header text-sm font-medium leading-relaxed text-brand-black/85">
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="-mr-0.5 -mt-0.5 flex-shrink-0 p-0.5 text-brand-black/35 transition-colors hover:text-brand-black"
          aria-label={t("toasts.closeNotification")}
          type="button"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  const type = toast.type as Exclude<ToastType, "notice">;

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-brand-champagne" strokeWidth={1.75} />,
    error: <AlertCircle className="h-5 w-5 text-brand-champagne-dark" strokeWidth={1.75} />,
    warning: <ShieldAlert className="h-5 w-5 text-brand-champagne" strokeWidth={1.75} />,
    info: <Info className="h-5 w-5 text-brand-champagne" strokeWidth={1.75} />,
  };

  const styles = {
    success:
      "border-brand-champagne/25 bg-brand-white text-brand-black shadow-[0_12px_40px_rgba(0,0,0,0.12)]",
    error:
      "border-brand-champagne/30 bg-brand-white text-brand-black shadow-[0_12px_40px_rgba(0,0,0,0.12)]",
    warning:
      "border-brand-champagne/30 bg-brand-white text-brand-black shadow-[0_12px_40px_rgba(0,0,0,0.12)]",
    info: "border-brand-champagne/25 bg-brand-white text-brand-black shadow-[0_12px_40px_rgba(0,0,0,0.12)]",
  };

  return (
    <div
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      className={`relative flex min-w-[300px] max-w-[420px] items-start gap-3 overflow-hidden rounded-none border p-4 ${styles[type]}`}
    >
      <div className="mt-0.5 flex-shrink-0" aria-hidden="true">
        {icons[type]}
      </div>
      <div className="min-w-0 flex-1">
        {toast.title ? (
          <>
            <p className="font-header text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-champagne-dark">
              {toast.title}
            </p>
            <p className="mt-1.5 font-header text-sm font-normal leading-relaxed text-brand-black/75">
              {toast.message}
            </p>
          </>
        ) : (
          <p className="font-header text-sm font-medium leading-relaxed text-brand-black/85">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 text-brand-black/40 transition-colors hover:text-brand-black"
        aria-label={t("toasts.closeNotification")}
        type="button"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleToast = (event: CustomEvent<Toast>) => {
      const newToast = {
        ...event.detail,
        id: event.detail.id || Math.random().toString(36).substring(7),
      };
      setToasts((prev) => [...prev, newToast]);
    };

    window.addEventListener("toast" as any, handleToast as EventListener);

    return () => {
      window.removeEventListener("toast" as any, handleToast as EventListener);
    };
  }, []);

  const handleClose = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-4 z-[9999] flex flex-col-reverse gap-2 max-sm:bottom-4 max-sm:left-4 max-sm:right-4">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onClose={handleClose} />
      ))}
    </div>
  );
}

export function toast(
  message: string,
  type: ToastType = "info",
  _duration?: number,
  title?: string
) {
  const event = new CustomEvent<Toast>("toast", {
    detail: {
      id: Math.random().toString(36).substring(7),
      message,
      title,
      type,
      duration: 0,
    },
  });
  window.dispatchEvent(event);
}
