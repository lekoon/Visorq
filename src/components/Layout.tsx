import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, PieChart, Settings, Users, LogOut, Moon, Sun, Bell, Check, Trash2, Brain, FileText, Copy, Upload } from 'lucide-react';
import { checkDeadlines, checkResourceConflicts } from '../utils/notifications';
import clsx from 'clsx';
import { useStore } from '../store/useStore';
import { useDarkMode } from '../hooks/useDarkMode';
import NotificationToast from './NotificationToast';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const { logout, user, projects, resourcePool, alerts, addAlert, markAlertRead, clearAlerts } = useStore();
    const { isDark, toggleDarkMode } = useDarkMode();

    // Check for notifications
    useEffect(() => {
        const newAlerts = [
            ...checkDeadlines(projects),
            ...checkResourceConflicts(projects, resourcePool)
        ];

        newAlerts.forEach(alert => {
            const exists = alerts.some(a => a.message === alert.message && !a.read);
            if (!exists) {
                addAlert(alert);
            }
        });
    }, [projects, resourcePool]);

    const unreadCount = alerts.filter(a => !a.read).length;

    // Main Navigation Categories
    const mainNavItems = [
        { label: '首页', path: '/', icon: LayoutDashboard },
        { label: '项目管理', path: '/projects', icon: FolderKanban, activePrefix: '/projects' },
        { label: '资源管理', path: '/resources', icon: Users, activePrefix: '/resources' },
        { label: '成本分析', path: '/cost', icon: PieChart, activePrefix: '/cost' },
        { label: '决策支持', path: '/decision', icon: Brain, activePrefix: '/decision' },
    ];

    // Sub Navigation Items based on current category
    const getSubNavItems = () => {
        const path = location.pathname;
        if (path.startsWith('/projects')) {
            return [
                { label: '项目列表', path: '/projects', icon: FolderKanban },
                { label: '项目模板', path: '/projects/templates', icon: Copy },
                { label: '批量导入', path: '/projects/import', icon: Upload },
            ];
        }
        if (path.startsWith('/resources')) {
            return [
                { label: '资源池', path: '/resources', icon: Users },
                // Add more if we split resources page
            ];
        }
        if (path.startsWith('/cost')) {
            return [
                { label: '成本分析', path: '/cost', icon: PieChart },
            ];
        }
        if (path.startsWith('/decision')) {
            return [
                { label: '高管仪表盘', path: '/decision', icon: LayoutDashboard },
                { label: 'AI 智能决策', path: '/decision/ai', icon: Brain },
                { label: '高级报表', path: '/decision/reports', icon: FileText },
            ];
        }
        return [];
    };

    const subNavItems = getSubNavItems();

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">

            {/* Top Navigation Bar */}
            <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shadow-sm z-20 shrink-0">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            V
                        </div>
                        <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                            Visorq
                        </h1>
                    </div>

                    <nav className="hidden md:flex items-center gap-1">
                        {mainNavItems.map((item) => {
                            const isActive = item.path === '/'
                                ? location.pathname === '/'
                                : location.pathname.startsWith(item.activePrefix || item.path);

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={clsx(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                                        isActive
                                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
                                    )}
                                >
                                    <item.icon size={18} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

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
                                    <h3 className="font-bold text-slate-900 dark:text-slate-100">通知</h3>
                                    {alerts.length > 0 && (
                                        <button onClick={clearAlerts} className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1">
                                            <Trash2 size={12} /> 清空
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {alerts.length === 0 ? (
                                        <div className="p-8 text-center text-slate-500 text-sm">
                                            暂无通知
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
                                                                    <Check size={12} /> 标记已读
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
                        title={isDark ? '切换亮色模式' : '切换暗色模式'}
                    >
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                    <div className="flex items-center gap-3 pl-2">
                        <div className="text-right hidden md:block">
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-200">{user?.name || 'User'}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{user?.role || 'Guest'}</div>
                        </div>
                        <div className="relative group">
                            <button className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md hover:shadow-lg transition-shadow">
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </button>

                            {/* User Dropdown */}
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 hidden group-hover:block hover:block z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                <div className="py-1">
                                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                                        <Users size={16} /> 个人资料
                                    </Link>
                                    <Link to="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                                        <Settings size={16} /> 系统设置
                                    </Link>
                                    <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
                                    <button
                                        onClick={() => {
                                            logout();
                                            window.location.href = '/login';
                                        }}
                                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <LogOut size={16} /> 退出登录
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Sub Navigation Bar (Only if items exist) */}
            {subNavItems.length > 0 && (
                <div className="h-12 bg-white dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center px-6 backdrop-blur-sm z-10 shrink-0">
                    <div className="flex items-center gap-1">
                        {subNavItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2",
                                        isActive
                                            ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-300"
                                    )}
                                >
                                    <item.icon size={14} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden relative bg-slate-50 dark:bg-slate-900">
                <div className="h-full overflow-y-auto p-6 scroll-smooth">
                    <div className="max-w-7xl mx-auto min-h-full">
                        {children}
                    </div>
                </div>
            </main>

            <NotificationToast />
        </div>
    );
};

export default Layout;
