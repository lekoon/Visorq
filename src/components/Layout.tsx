import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, PieChart, Settings, Menu, Users, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../store/useStore';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { logout, user } = useStore();

    const navItems = [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'Projects', path: '/projects', icon: FolderKanban },
        { label: 'Resources', path: '/resources', icon: Users },
        { label: 'Analysis', path: '/analysis', icon: PieChart },
        { label: 'Settings', path: '/settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
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
                        {isSidebarOpen && <span className="font-medium">Log Out</span>}
                    </button>
                </div>

                <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
                    {isSidebarOpen && <p>© 2025 Antigravity CTPM</p>}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
                    <h2 className="text-2xl font-bold text-slate-800">
                        {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <Link to="/profile" className="flex items-center gap-2 hover:bg-slate-50 p-2 rounded-lg transition-colors">
                            <div className="text-right hidden md:block">
                                <div className="text-sm font-bold text-slate-900">{user?.name || 'User'}</div>
                                <div className="text-xs text-slate-500">{user?.role || 'Guest'}</div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
