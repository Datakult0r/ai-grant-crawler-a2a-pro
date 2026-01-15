/**
 * Toast Notification Store
 * Provides a simple, reactive toast notification system
 */

import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

function createToastStore() {
    const { subscribe, update } = writable<Toast[]>([]);

    function addToast(toast: Omit<Toast, 'id'>) {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast: Toast = {
            id,
            duration: 5000, // Default 5 seconds
            ...toast,
        };

        update(toasts => [...toasts, newToast]);

        // Auto-remove after duration
        if (newToast.duration && newToast.duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, newToast.duration);
        }

        return id;
    }

    function removeToast(id: string) {
        update(toasts => toasts.filter(t => t.id !== id));
    }

    function clearAll() {
        update(() => []);
    }

    return {
        subscribe,
        add: addToast,
        remove: removeToast,
        clear: clearAll,
        
        // Convenience methods
        success: (title: string, message?: string, duration?: number) => 
            addToast({ type: 'success', title, message, duration }),
        
        error: (title: string, message?: string, duration?: number) => 
            addToast({ type: 'error', title, message, duration: duration ?? 8000 }), // Errors stay longer
        
        warning: (title: string, message?: string, duration?: number) => 
            addToast({ type: 'warning', title, message, duration }),
        
        info: (title: string, message?: string, duration?: number) => 
            addToast({ type: 'info', title, message, duration }),
    };
}

export const toasts = createToastStore();
