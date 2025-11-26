import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, PieChart, Settings, Menu, Users, LogOut, Globe, Moon, Sun, Bell, Check, Trash2, Briefcase } from 'lucide-react';
import { checkDeadlines, checkResourceConflicts } from '../utils/notifications';
import clsx from 'clsx';
import { useStore } from '../store/useStore';
import { useTranslation } from 'react-i18next';
import { useDarkMode } from '../hooks/useDarkMode';
import NotificationToast from './NotificationToast';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const { logout, user, projects, resourcePool, alerts, addAlert, markAlertRead, clearAlerts } = useStore();
    const { t, i18n } = useTranslation();
    const { isDark, toggleDarkMode } = useDarkMode();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'zh' : 'en';
        i18n.changeLanguage(newLang);
    };

    // Check for notifications
    React.useEffect(() => {
        const newAlerts = [
            ...checkDeadlines(projects),
            ...checkResourceConflicts(projects, resourcePool)
        ];

        newAlerts.forEach(alert => {
            // Avoid duplicates (simple check by message)
            const exists = alerts.some(a => a.message === alert.message && !a.read);
            if (!exists) {
                addAlert(alert);
            }
        });
    }, [projects, resourcePool]); // Run when data changes

    const unreadCount = alerts.filter(a => !a.read).length;

    const navItems = [
        { label: t('common.dashboard'), path: '/', icon: LayoutDashboard },
        { label: t('common.projects'), path: '/projects', icon: FolderKanban },
        { label: t('common.resources'), path: '/resources', icon: Users },
        { label: t('common.workbench'), path: '/workbench', icon: Briefcase },
        { label: t('common.analysis'), path: '/analysis', icon: PieChart },
        { label: t('common.settings'), path: '/settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside
                className={clsx(
                    "bg-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col",
                    isSidebarOpen ? "w-64" : "w-20"
                )}
            >
                <div className="p-6 flex items-center justify-between border-b border-slate-800">
                    {isSidebarOpen && <h1 className="text-xl font-bold tracking-wider text-blue-400">CTPM Tool</h1>}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-800 rounded">
                        <Menu size={20} />
                    </button>
                </div>

                <nav className="flex-1 py-6">
                    <ul className="space-y-2 px-3">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className={clsx(
                                            "flex items-center gap-4 px-4 py-3 rounded-xl transition-colors",
                                            isActive
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                                : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                                        )}
                                    >
                                        <Icon size={24} />
                                        {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={() => {
                            logout();
                            window.location.href = '/login';
                        }}
                        className={clsx(
                            "flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-all w-full",
                            !isSidebarOpen && "justify-center"
                        )}
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span className="font-medium">{t('common.logout')}</span>}
                    </button>
                </div>

                <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
                    {isSidebarOpen && <p>© 2025 Antigravity CTPM</p>}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-8 shadow-sm z-10 transition-colors">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {navItems.find(i => i.path === location.pathname)?.label || t('common.dashboard')}
                    </h2>
                    <div className="flex items-center gap-4">
                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors relative"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {isNotificationsOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-5 duration-200">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100">Notifications</h3>
                                        {alerts.length > 0 && (
                                            <button onClick={clearAlerts} className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1">
                                                <Trash2 size={12} /> Clear all
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {alerts.length === 0 ? (
                                            <div className="p-8 text-center text-slate-500 text-sm">
                                                No notifications
                                            </div>
                                        ) : (
                                            alerts.map(alert => (
                                                <div
                                                    key={alert.id}
                                                    className={`p-4 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${alert.read ? 'opacity-60' : 'bg-blue-50/30 dark:bg-blue-900/10'}`}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${alert.type === 'error' ? 'bg-red-500' : alert.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                                                        <div className="flex-1">
                                                            <p className="text-sm text-slate-800 dark:text-slate-200 mb-1">{alert.message}</p>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs text-slate-400">{new Date(alert.date).toLocaleDateString()}</span>
                                                                {!alert.read && (
                                                                    <button
                                                                        onClick={() => markAlertRead(alert.id)}
                                                                        className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1"
                                                                    >
                                                                        <Check size={12} /> Mark read
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium transition-colors"
                        >
                            <Globe size={20} />
                            <span>{i18n.language === 'en' ? 'English' : '中文'}</span>
                        </button>

                        <Link to="/profile" className="flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors">
                            <div className="text-right hidden md:block">
                                <div className="text-sm font-bold text-slate-900 dark:text-slate-200">{user?.name || 'User'}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{user?.role || 'Guest'}</div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-900 transition-colors">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
            <NotificationToast />
        </div>
    );
};

export default Layout;
