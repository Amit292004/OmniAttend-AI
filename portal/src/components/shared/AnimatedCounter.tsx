"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

export function AnimatedCounter({
  value,
  className,
  prefix = "",
  suffix = "",
  duration = 1.5,
}: AnimatedCounterProps) {
  const [hasHydrated, setHasHydrated] = useState(false);
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    mass: 1,
  });

  const display = useTransform(spring, (current) =>
    Math.round(current).toString()
  );

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (hasHydrated) {
      spring.set(value);
    }
  }, [value, spring, hasHydrated]);

  if (!hasHydrated) {
    return <span className={className}>{prefix}{value}{suffix}</span>;
  }

  return (
    <span className={cn("inline-flex font-medium tabular-nums", className)}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}
