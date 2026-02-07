'use client';

import { Fragment, ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { AlertTriangle, Trash2, X, Check, Info } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export type ConfirmationType = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationType;
  loading?: boolean;
}

const typeConfig = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-neon-red/20',
    iconColor: 'text-neon-red',
    buttonVariant: 'danger' as const,
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-neon-yellow/20',
    iconColor: 'text-neon-yellow',
    buttonVariant: 'primary' as const,
  },
  info: {
    icon: Info,
    iconBg: 'bg-neon-cyan/20',
    iconColor: 'text-neon-cyan',
    buttonVariant: 'primary' as const,
  },
  success: {
    icon: Check,
    iconBg: 'bg-neon-green/20',
    iconColor: 'text-neon-green',
    buttonVariant: 'primary' as const,
  },
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  loading = false,
}: ConfirmModalProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm();
    if (!loading) {
      onClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-dark-800 border border-dark-600 shadow-xl transition-all">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6"
                >
                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    disabled={loading}
                  >
                    <X className="w-5 h-5 text-white/40" />
                  </button>

                  {/* Icon */}
                  <div className="flex justify-center mb-4">
                    <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', config.iconBg)}>
                      <Icon className={cn('w-7 h-7', config.iconColor)} />
                    </div>
                  </div>

                  {/* Title */}
                  <Dialog.Title className="text-xl font-bold text-white text-center mb-2">
                    {title}
                  </Dialog.Title>

                  {/* Message */}
                  <div className="text-white/60 text-center mb-6">
                    {typeof message === 'string' ? <p>{message}</p> : message}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={onClose}
                      disabled={loading}
                    >
                      {cancelText}
                    </Button>
                    <Button
                      variant={config.buttonVariant}
                      className="flex-1"
                      onClick={handleConfirm}
                      loading={loading}
                    >
                      {confirmText}
                    </Button>
                  </div>
                </motion.div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// Hook for managing confirm modal state
import { useState, useCallback } from 'react';

interface UseConfirmOptions {
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationType;
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<UseConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: UseConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolver?.(true);
    setIsOpen(false);
    setResolver(null);
  }, [resolver]);

  const handleClose = useCallback(() => {
    resolver?.(false);
    setIsOpen(false);
    setResolver(null);
  }, [resolver]);

  const ConfirmDialog = useCallback(() => {
    if (!options) return null;
    return (
      <ConfirmModal
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        {...options}
      />
    );
  }, [isOpen, options, handleClose, handleConfirm]);

  return { confirm, ConfirmDialog };
}
