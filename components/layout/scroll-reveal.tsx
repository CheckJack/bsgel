"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMotionEnabled, useAppScrollInView } from "@/lib/use-motion-enabled";

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "fade";
};

/**
 * Subtle scroll entrance. Never starts at opacity 0 — that left whole
 * homepage sections blank forever on mobile when the scroll container
 * is `.app-scroll-root` instead of the window.
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
}: ScrollRevealProps) {
  const motionEnabled = useMotionEnabled();
  const viewport = useAppScrollInView({ amount: 0.08 });

  if (!motionEnabled) {
    return <div className={cn("w-full", className)}>{children}</div>;
  }

  const hidden =
    direction === "left"
      ? { opacity: 1, x: -20 }
      : direction === "right"
        ? { opacity: 1, x: 20 }
        : direction === "fade"
          ? { opacity: 1 }
          : { opacity: 1, y: 24 };

  const visible = { opacity: 1, x: 0, y: 0 };

  return (
    <motion.div
      className={cn("w-full", className)}
      initial={hidden}
      whileInView={visible}
      viewport={{ ...viewport, margin: "0px 0px -4% 0px" }}
      transition={{
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1],
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}
