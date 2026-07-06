"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMotionEnabled } from "@/lib/use-motion-enabled";

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "fade";
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
}: ScrollRevealProps) {
  const motionEnabled = useMotionEnabled();

  if (!motionEnabled) {
    return <div className={cn("w-full", className)}>{children}</div>;
  }

  const hidden =
    direction === "left"
      ? { opacity: 0, x: -36 }
      : direction === "right"
        ? { opacity: 0, x: 36 }
        : direction === "fade"
          ? { opacity: 0 }
          : { opacity: 0, y: 40 };

  const visible = { opacity: 1, x: 0, y: 0 };

  return (
    <motion.div
      className={cn("w-full", className)}
      initial={hidden}
      whileInView={visible}
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -6% 0px" }}
      transition={{
        duration: 0.75,
        ease: [0.22, 1, 0.36, 1],
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}
