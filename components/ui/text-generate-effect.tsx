"use client";

import { useEffect } from "react";
import { motion, stagger, useAnimate } from "framer-motion";
import { cn } from "@/lib/utils";

export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
  triggerOnScroll = false,
  isScrolling = false,
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
  triggerOnScroll?: boolean;
  isScrolling?: boolean;
}) => {
  const [scope, animate] = useAnimate();

  let wordsArray = words.split(" ");

  useEffect(() => {
    // Always start with text visible
    animate(
      "span, a",
      {
        opacity: 1,
        filter: filter ? "blur(0px)" : "none",
      },
      {
        duration: 0.1,
      }
    );

    if (triggerOnScroll && isScrolling) {
      // Add highlight effect when scrolling - make it more prominent
      animate(
        "span, a",
        {
          scale: 1.02,
          filter: filter ? "blur(0px)" : "none",
        },
        {
          duration: duration ? duration : 0.2,
          delay: stagger(0.01),
        }
      );
    } else if (triggerOnScroll && !isScrolling) {
      // Return to normal when not scrolling
      animate(
        "span, a",
        {
          scale: 1,
          filter: filter ? "blur(0px)" : "none",
        },
        {
          duration: 0.3,
        }
      );
    } else if (!triggerOnScroll) {
      // Original behavior - animate on mount with blur effect
      animate(
        "span, a",
        {
          opacity: 1,
          filter: filter ? "blur(0px)" : "none",
        },
        {
          duration: duration ? duration : 1,
          delay: stagger(0.2),
        }
      );
    }
  }, [isScrolling, triggerOnScroll, filter, duration, scope]);

  const renderWords = () => {
    return (
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => {
          // Check if word is a link (starts with #)
          const isLink = word.startsWith("#");
          const linkId = isLink ? word.slice(1) : null;
          
          if (isLink) {
            return (
              <motion.a
                key={word + idx}
                href={`#${linkId}`}
                className="dark:text-white text-brand-champagne hover:text-brand-black underline font-medium inline-block"
                style={{
                  opacity: 1,
                  filter: "none",
                }}
              >
                {word}{" "}
              </motion.a>
            );
          }
          
          return (
            <motion.span
              key={word + idx}
              className="dark:text-white text-black"
              style={{
                opacity: 1,
                filter: "none",
              }}
            >
              {word}{" "}
            </motion.span>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className="font-bold">
      <div className="mt-4">
        <div className={cn("dark:text-white text-black leading-snug tracking-wide", className)}>
          {renderWords()}
        </div>
      </div>
    </div>
  );
};

export default TextGenerateEffect;
