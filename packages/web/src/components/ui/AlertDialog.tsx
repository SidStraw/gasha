import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  children?: ReactNode;
}

export default function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = '確認',
  cancelText = '取消',
  children,
}: AlertDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Dialog */}
          <motion.div
            className="relative bg-gasha-bg border-4 border-gasha-brown rounded-2xl p-6 max-w-sm w-[90%] shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <h2 className="text-xl font-bold text-gasha-brown-dark text-center mb-2">
              {title}
            </h2>
            
            {description && (
              <p className="text-gasha-brown-light text-center mb-4">
                {description}
              </p>
            )}
            
            {children}
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={onClose}
                className="flex-1 py-2 px-4 border-2 border-gasha-brown rounded-full text-gasha-brown font-bold hover:bg-gasha-brown/10 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-2 px-4 bg-gasha-red border-2 border-gasha-brown rounded-full text-white font-bold hover:bg-gasha-red/90 transition-colors"
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
