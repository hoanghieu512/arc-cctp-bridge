"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ParticleButtonProps extends ButtonProps {
  onSuccess?: () => void;
  successDuration?: number;
  /** Number of particles to emit on click. */
  particleCount?: number;
}

function SuccessParticles({
  buttonRef,
  count,
}: {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  count: number;
}) {
  const rect = buttonRef.current?.getBoundingClientRect();
  if (!rect) return null;

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  return (
    <AnimatePresence>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none fixed z-[60] h-1 w-1 rounded-full bg-primary shadow-[0_0_8px_2px_hsl(var(--primary)/0.8)]"
          style={{ left: centerX, top: centerY }}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0],
            x: [0, (i % 2 ? 1 : -1) * (Math.random() * 60 + 20)],
            y: [0, -Math.random() * 60 - 20],
          }}
          transition={{
            duration: 0.6,
            delay: i * 0.06,
            ease: "easeOut",
          }}
        />
      ))}
    </AnimatePresence>
  );
}

function ParticleButton({
  children,
  onClick,
  onSuccess,
  successDuration = 800,
  particleCount = 10,
  className,
  ...props
}: ParticleButtonProps) {
  const [showParticles, setShowParticles] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!props.disabled) {
      setShowParticles(true);
      window.setTimeout(() => {
        setShowParticles(false);
        onSuccess?.();
      }, successDuration);
    }
    onClick?.(e);
  };

  return (
    <>
      {showParticles && (
        <SuccessParticles buttonRef={buttonRef} count={particleCount} />
      )}
      <Button
        ref={buttonRef}
        onClick={handleClick}
        className={cn(
          "relative transition-transform duration-100",
          showParticles && "scale-[0.98]",
          className,
        )}
        {...props}
      >
        {children}
      </Button>
    </>
  );
}

export { ParticleButton };
