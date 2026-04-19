'use client';

import { useEffect, useCallback } from 'react';
import { Toaster, toast, Toast } from 'react-hot-toast';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Custom toast styles
const toastStyles = {
  success: {
    container: 'bg-white shadow-card border border-gray-100 rounded-xl p-4',
    content: 'flex items-start gap-3',
    icon: CheckCircle,
    iconClassName: 'text-green-500',
    message: 'text-gray-900 font-medium',
  },
  error: {
    container: 'bg-white shadow-card border border-red-100 rounded-xl p-4',
    content: 'flex items-start gap-3',
    icon: AlertCircle,
    iconClassName: 'text-red-500',
    message: 'text-gray-900 font-medium',
  },
  info: {
    container: 'bg-white shadow-card border border-blue-100 rounded-xl p-4',
    content: 'flex items-start gap-3',
    icon: Info,
    iconClassName: 'text-blue-500',
    message: 'text-gray-900 font-medium',
  },
  warning: {
    container: 'bg-white shadow-card border border-yellow-100 rounded-xl p-4',
    content: 'flex items-start gap-3',
    icon: AlertTriangle,
    iconClassName: 'text-yellow-500',
    message: 'text-gray-900 font-medium',
  },
};

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface CustomToastProps {
  toast: Toast;
  type?: ToastType;
  message: string;
}

function CustomToast({ toast: t, type = 'info', message }: CustomToastProps) {
  const style = toastStyles[type];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        style.container,
        'animate-in slide-in-from-top-5 fade-in duration-300'
      )}
      style={{
        transform: t.visible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: t.visible ? 1 : 0,
      }}
    >
      <div className={style.content}>
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', style.iconClassName)} />
        <div className="flex-1">
          <p className={style.message}>{message}</p>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Toast helper functions
export const showToast = {
  success: (message: string, options?: Omit<Parameters<typeof toast>[0], 'message'>) => {
    return toast.success(message, {
      ...options,
      duration: 4000,
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    });
  },
  error: (message: string, options?: Omit<Parameters<typeof toast>[0], 'message'>) => {
    return toast.error(message, {
      ...options,
      duration: 5000,
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
    });
  },
  info: (message: string, options?: Omit<Parameters<typeof toast>[0], 'message'>) => {
    return toast(message, {
      ...options,
      duration: 4000,
      icon: <Info className="w-5 h-5 text-blue-500" />,
    });
  },
  warning: (message: string, options?: Omit<Parameters<typeof toast>[0], 'message'>) => {
    return toast(message, {
      ...options,
      duration: 4500,
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    });
  },
  custom: (message: string, type: ToastType, options?: Omit<Parameters<typeof toast>[0], 'message'>) => {
    return toast(message, {
      ...options,
      duration: 4000,
    });
  },
};

// Toast provider component
export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      gutter={12}
      toastOptions={{
        className: '',
        duration: 4000,
      }}
    />
  );
}

export default ToastProvider;
