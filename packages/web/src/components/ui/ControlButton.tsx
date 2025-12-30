import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'reset' | 'settings' | 'shake' | 'draw';

interface ControlButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-gasha-red border-gasha-brown text-white',
  secondary: 'bg-white border-gasha-brown text-gasha-brown',
  reset: 'bg-white border-gasha-brown text-gasha-brown',
  settings: 'bg-gasha-yellow border-gasha-brown text-gasha-brown-dark',
  shake: 'bg-gasha-blue border-[#2E5E8E] text-white',
  draw: 'bg-gasha-red border-gasha-brown text-white',
};

const sizeStyles: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-12 h-12 text-xs',
  md: 'w-16 h-16 text-sm',
  lg: 'w-20 h-20 text-base',
};

export default function ControlButton({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled,
  onClick,
}: ControlButtonProps) {
  return (
    <motion.button
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        border-4 rounded-full
        flex flex-col items-center justify-center
        font-bold font-body
        shadow-lg
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      disabled={disabled}
      onClick={onClick}
    >
      {icon && <span className="mb-0.5">{icon}</span>}
      {children}
    </motion.button>
  );
}
