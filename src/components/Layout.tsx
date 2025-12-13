import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, FolderKanban, PieChart, Settings, Users, LogOut,
    Moon, Sun, Bell, Check, Trash2, Brain, FileText, Copy, Upload,
    TrendingUp, Search, Shield, BarChart3, Briefcase
} from 'lucide-react';
import { checkDeadlines, checkResourceConflicts } from '../utils/notifications';
import clsx from 'clsx';
import { useStore } from '../store/useStore';
import { useDarkMode } from '../hooks/useDarkMode';
import NotificationToast from './NotificationToast';
import GlobalSearch from './GlobalSearch';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { logout, user, projects, resourcePool, alerts, addAlert, markAlertRead, clearAlerts } = useStore();
    const { isDark, toggleDarkMode } = useDarkMode();

    // Global Search Shortcut (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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

    // PMO-Oriented Main Navigation Categories
    const mainNavItems = [
        {
            label: '工作台',
            path: '/',
            icon: LayoutDashboard,
            description: 'PMO 总览'
        },
        {
            label: '项目组合',
            path: '/projects',
            icon: Briefcase,
            activePrefix: '/projects',
            description: '项目管理'
        },
        {
            label: '资源团队',
            path: '/resources',
            icon: Users,
            activePrefix: '/resources',
            description: '资源与人员'
        },
        {
            label: '风险质量',
            path: '/delivery-efficiency',
            icon: Shield,
            activePrefix: '/delivery-efficiency',
            description: '风险与交付'
        },
        {
            label: '分析报告',
            path: '/analysis',
            icon: BarChart3,
            activePrefix: '/analysis',
            description: '数据与洞察'
        },
    ];

    // Enhanced Sub Navigation with better categorization
    const getSubNavItems = () => {
        const path = location.pathname;

        // 项目组合管理
        if (path.startsWith('/projects') || path.startsWith('/portfolio') || path.startsWith('/dependencies')) {
            return [
                { label: '项目列表', path: '/projects', icon: FolderKanban, description: '所有项目' },
                { label: '项目模板', path: '/projects/templates', icon: Copy, description: '快速创建' },
                { label: '批量导入', path: '/projects/import', icon: Upload, description: '数据导入' },
                { label: '项目组合', path: '/portfolio', icon: Briefcase, description: 'PMO 总览' },
                { label: '依赖分析', path: '/dependencies', icon: Search, description: '跨项目依赖' },
            ];
        }

        // 资源与团队管理
        if (path.startsWith('/resources')) {
            return [
                { label: '资源总览', path: '/resources', icon: Users, description: '资源池管理' },
            ];
        }

        // 风险与质量管理
        if (path.startsWith('/delivery-efficiency') || path.startsWith('/ai-decision')) {
            return [
                { label: '交付效率', path: '/delivery-efficiency', icon: TrendingUp, description: '效率指标' },
                { label: 'AI 决策', path: '/ai-decision', icon: Brain, description: '智能建议' },
            ];
        }

        // 分析与报告
        if (path.startsWith('/analysis') || path.startsWith('/reports') || path.startsWith('/evm')) {
            return [
                { label: '成本分析', path: '/analysis', icon: PieChart, description: '财务视图' },
                { label: '挣值管理', path: '/evm', icon: TrendingUp, description: 'EVM 分析' },
                { label: '高级报表', path: '/reports', icon: FileText, description: '定制报告' },
            ];
        }

        return [];
    };

    const subNavItems = getSubNavItems();

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">

            <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

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
                    {/* Search Trigger Button */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 text-sm transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                    >
                        <Search size={16} />
                        <span className="hidden lg:inline">Search...</span>
                        <div className="flex items-center gap-0.5 ml-1 px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 text-xs font-mono">
                            <span className="text-[10px]">⌘</span>K
                        </div>
                    </button>
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                        <Search size={20} />
                    </button>

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
                                                className={`p - 4 border - b border - slate - 50 dark: border - slate - 700 hover: bg - slate - 50 dark: hover: bg - slate - 700 / 50 transition - colors ${alert.read ? 'opacity-60' : 'bg-blue-50/30 dark:bg-blue-900/10'} `}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`mt - 1 w - 2 h - 2 rounded - full shrink - 0 ${alert.type === 'error' ? 'bg-red-500' : alert.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'} `} />
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

                    <button
                        onClick={() => navigate('/settings')}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                        title="系统设置"
                    >
                        <Settings size={20} />
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
                <div className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800/30 border-b border-slate-200 dark:border-slate-700 backdrop-blur-sm z-10 shrink-0">
                    <div className="px-6 py-3">
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                            {subNavItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={clsx(
                                            "group relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap",
                                            isActive
                                                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-900/50"
                                                : "text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-slate-200"
                                        )}
                                        title={item.description}
                                    >
                                        <item.icon size={16} className={isActive ? "text-blue-600 dark:text-blue-400" : ""} />
                                        <span>{item.label}</span>
                                        {item.description && !isActive && (
                                            <span className="hidden xl:inline text-xs text-slate-400 dark:text-slate-500 ml-1">
                                                · {item.description}
                                            </span>
                                        )}
                                        {isActive && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
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
