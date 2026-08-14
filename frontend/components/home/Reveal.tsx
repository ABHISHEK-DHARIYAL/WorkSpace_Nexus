import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  /** Direction the content enters from. 'none' just fades in. */
  from?: 'up' | 'down' | 'left' | 'right' | 'none';
}

const OFFSETS: Record<string, { x?: number; y?: number }> = {
  up: { y: 28 },
  down: { y: -28 },
  left: { x: 28 },
  right: { x: -28 },
  none: {},
};

/**
 * Scroll-triggered entrance animation used across the homepage sections.
 * Centralizing this avoids repeating the same whileInView/viewport config
 * in every section, and automatically disables motion for users who've
 * requested reduced motion at the OS level.
 */
const Reveal: React.FC<RevealProps> = ({ children, delay = 0, className, from = 'up' }) => {
  const prefersReducedMotion = useReducedMotion();
  const offset = OFFSETS[from];

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;
