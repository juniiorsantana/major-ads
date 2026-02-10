import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Megaphone,
    Wand2, // For AI Tools
    BarChart3,
    Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DashboardLayout: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
        { path: '/dashboard/campaigns', label: 'Campanhas', icon: Megaphone },
        { path: '/dashboard/ai-tools', label: 'Otimizador IA', icon: Wand2 },
        { path: '/settings', label: 'Configurações', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-neutral-100 font-sans text-neutral-900 overflow-hidden">
            {/* Structural Sidebar - Tech/Precision Style */}
            <aside
                className={`bg-neutral-900 text-neutral-400 border-r border-neutral-800 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col relative z-20 ${collapsed ? 'w-16' : 'w-64'
                    }`}
            >
                {/* Brand Header */}
                <div className="h-16 flex items-center px-4 border-b border-neutral-800">
                    <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                        <div className="w-8 h-8 bg-brand-600 rounded-sm flex items-center justify-center shrink-0 shadow-lg shadow-brand-900/20">
                            <BarChart3 className="text-white w-5 h-5" />
                        </div>
                        <span className="font-display font-bold text-white tracking-tight text-lg">AdsManager<span className="text-brand-500">.Pro</span></span>
                    </div>
                    {/* Collapsed Brand Icon fallback */}
                    {collapsed && (
                        <div className="w-8 h-8 bg-brand-600 rounded-sm flex items-center justify-center shrink-0 mx-auto">
                            <span className="text-white font-bold text-xs">M</span>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 space-y-1 px-2 overflow-y-auto custom-scrollbar">
                    {/* Section Label */}
                    {!collapsed && (
                        <div className="px-3 mb-2 text-[10px] uppercase tracking-wider font-bold text-neutral-600">
                            Menu Principal
                        </div>
                    )}

                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        // Precision Design: Active state uses a "glow" or sharp indicator, not just bg color
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-all duration-200 group relative ${isActive
                                    ? 'bg-neutral-800/80 text-white font-medium border-l-2 border-brand-500'
                                    : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200 border-l-2 border-transparent'
                                    }`}
                                title={collapsed ? item.label : ''}
                            >
                                <item.icon size={18} className={`shrink-0 transition-colors ${isActive ? 'text-brand-500' : 'text-neutral-500 group-hover:text-neutral-300'}`} />

                                <span className={`whitespace-nowrap transition-all duration-300 ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'
                                    }`}>
                                    {item.label}
                                </span>

                                {/* Hover Tooltip for Collapsed State */}
                                {collapsed && (
                                    <div className="absolute left-full ml-4 px-2 py-1 bg-neutral-900 text-white text-xs rounded-sm border border-neutral-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl">
                                        {item.label}
                                    </div>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Footer Controls */}
                <div className="p-3 border-t border-neutral-800 bg-neutral-900/50">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-sm text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
                    >
                        {collapsed ? <ChevronRight size={18} className="mx-auto" /> : (
                            <>
                                <ChevronLeft size={18} />
                                <span className="text-xs font-medium">Recolher Menu</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleLogout}
                        className={`mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-sm text-neutral-500 hover:text-red-400 hover:bg-red-950/20 transition-colors group ${collapsed ? 'justify-center' : ''
                            }`}
                        title={collapsed ? "Sair" : ""}
                    >
                        <LogOut size={18} className="shrink-0 group-hover:text-red-400" />
                        <span className={`whitespace-nowrap transition-all duration-300 ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'
                            }`}>
                            Sair
                        </span>
                    </button>

                    {/* User Info (Mini) */}
                    {!collapsed && (
                        <div className="mt-4 pt-4 border-t border-neutral-800 flex items-center gap-3 px-1">
                            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-400">
                                US
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-neutral-300 truncate">Admin User</p>
                                <p className="text-[10px] text-neutral-500 truncate">admin@majorhub.com</p>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area - Engineered for Focus */}
            <main className="flex-1 flex flex-col relative overflow-hidden h-screen bg-neutral-50/50">
                {/* Top Subtle Bar - Structure/Breadcrumbs context could go here */}
                <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-neutral-200 flex items-center justify-between px-6 sticky top-0 z-10">
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <Layers size={14} />
                        <span className="text-neutral-300">/</span>
                        <span className="font-medium text-neutral-800 capitalize">{location.pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}</span>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
