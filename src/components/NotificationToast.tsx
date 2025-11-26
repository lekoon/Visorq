import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import type { Notification } from '../types';

const ToastItem: React.FC<{ notification: Notification }> = ({ notification }) => {
    const { removeNotification } = useStore();

    useEffect(() => {
        const timer = setTimeout(() => {
            removeNotification(notification.id);
        }, notification.duration || 3000);
        return () => clearTimeout(timer);
    }, [notification, removeNotification]);

    const icons = {
        success: <CheckCircle size={20} className="text-green-600" />,
        error: <AlertCircle size={20} className="text-red-600" />,
        warning: <AlertTriangle size={20} className="text-orange-600" />,
        info: <Info size={20} className="text-blue-600" />
    };

    const styles = {
        success: 'bg-white border-green-200 text-slate-800 dark:bg-slate-800 dark:border-green-900 dark:text-slate-100',
        error: 'bg-white border-red-200 text-slate-800 dark:bg-slate-800 dark:border-red-900 dark:text-slate-100',
        warning: 'bg-white border-orange-200 text-slate-800 dark:bg-slate-800 dark:border-orange-900 dark:text-slate-100',
        info: 'bg-white border-blue-200 text-slate-800 dark:bg-slate-800 dark:border-blue-900 dark:text-slate-100'
    };

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-right-full duration-300 ${styles[notification.type]}`}>
            {icons[notification.type]}
            <span className="text-sm font-medium">{notification.message}</span>
            <button onClick={() => removeNotification(notification.id)} className="ml-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                <X size={16} />
            </button>
        </div>
    );
};

const NotificationToast: React.FC = () => {
    const { notifications } = useStore();

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {notifications.map((notification) => (
                <div key={notification.id} className="pointer-events-auto">
                    <ToastItem notification={notification} />
                </div>
            ))}
        </div>
    );
};

export default NotificationToast;
