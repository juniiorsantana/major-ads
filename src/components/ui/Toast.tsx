/**
 * Toast Notification Component
 * Renders global toast notifications with auto-dismiss
 * Connected to useToast Zustand store for global access
 */

import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore, type Toast as ToastData, type ToastType } from '../../hooks/useToast';

const ICON_MAP: Record<ToastType, typeof CheckCircle> = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const STYLE_MAP: Record<ToastType, string> = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const ICON_STYLE_MAP: Record<ToastType, string> = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
};

function ToastItem({ toast }: { toast: ToastData }) {
    const removeToast = useToastStore((s) => s.removeToast);
    const Icon = ICON_MAP[toast.type];
    const duration = toast.duration ?? 4000;

    useEffect(() => {
        if (duration <= 0) return;
        const timer = setTimeout(() => removeToast(toast.id), duration);
        return () => clearTimeout(timer);
    }, [toast.id, duration, removeToast]);

    return (
        <div
            className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm ${STYLE_MAP[toast.type]}`}
            style={{ animation: 'slideIn 0.3s ease-out' }}
            role="alert"
        >
            <Icon size={20} className={`shrink-0 mt-0.5 ${ICON_STYLE_MAP[toast.type]}`} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug">{toast.message}</p>
                {toast.action && (
                    <button
                        onClick={toast.action.onClick}
                        className="mt-1 text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>
            <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors"
                aria-label="Fechar"
            >
                <X size={14} />
            </button>
        </div>
    );
}

export default function ToastContainer() {
    const toasts = useToastStore((s) => s.toasts);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-auto">
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} />
            ))}
        </div>
    );
}

// Keep backward-compat export for existing usage
export { ToastContainer as Toast };
