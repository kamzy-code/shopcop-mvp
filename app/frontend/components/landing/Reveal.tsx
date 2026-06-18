'use client';
import { motion, useInView } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  as?: 'div' | 'section';
  className?: string;
}

export function Reveal({ children, delay = 0, y = 40, duration = 0.6, as = 'div', className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const Tag = motion[as];

  return (
    <Tag
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </Tag>
  );
}

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 24 } as const,
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};
