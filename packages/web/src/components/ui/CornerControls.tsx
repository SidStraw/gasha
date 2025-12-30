import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface CornerControlsProps {
  children: ReactNode;
  position: Position;
  className?: string;
}

const positionClasses: Record<Position, string> = {
  'top-left': 'top-5 left-5',
  'top-right': 'top-5 right-5',
  'bottom-left': 'bottom-5 left-5',
  'bottom-right': 'bottom-5 right-5',
};

const directionMap: Record<Position, number> = {
  'top-left': -100,
  'top-right': 100,
  'bottom-left': -100,
  'bottom-right': 100,
};

export default function CornerControls({ 
  children, 
  position, 
  className = '' 
}: CornerControlsProps) {
  const direction = directionMap[position];
  
  return (
    <motion.div
      className={`fixed z-10 flex pointer-events-auto gap-3 ${positionClasses[position]} ${className}`}
      initial={{ x: direction, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: direction, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
    >
      {children}
    </motion.div>
  );
}
