/**
 * Toast Store (Zustand)
 * Global toast notification management
 */

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastState {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => string;
    removeToast: (id: string) => void;
    clearAll: () => void;
}

let toastCounter = 0;

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],

    addToast: (toast) => {
        const id = `toast-${++toastCounter}-${Date.now()}`;
        set((state) => ({
            toasts: [...state.toasts, { ...toast, id }],
        }));
        return id;
    },

    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),

    clearAll: () => set({ toasts: [] }),
}));

// Convenience functions for use outside React components (e.g., in services)
export const toast = {
    success: (message: string, duration = 4000) =>
        useToastStore.getState().addToast({ message, type: 'success', duration }),
    error: (message: string, duration = 6000) =>
        useToastStore.getState().addToast({ message, type: 'error', duration }),
    warning: (message: string, duration = 5000) =>
        useToastStore.getState().addToast({ message, type: 'warning', duration }),
    info: (message: string, duration = 4000) =>
        useToastStore.getState().addToast({ message, type: 'info', duration }),
};
