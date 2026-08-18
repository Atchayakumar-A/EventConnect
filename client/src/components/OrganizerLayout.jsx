import React, { useState } from 'react';
import {
    LayoutDashboard, PlusCircle, Users, IndianRupee,
    QrCode, BarChart2, User, Menu, X, LogOut, ChevronRight, Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
    { id: 'my-events', label: 'My Events', icon: LayoutDashboard },
    { id: 'create', label: 'Create Event', icon: PlusCircle },
    { id: 'registrations', label: 'Registrations', icon: Users },
    { id: 'payments', label: 'Pending Payments', icon: IndianRupee },
    { id: 'scan', label: 'Scan QR', icon: QrCode },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'profile', label: 'Profile', icon: User },
];

export const OrganizerLayout = ({ activeTab, setActiveTab, children }) => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { user, logout } = useAuth();

    const handleNav = (id) => {
        setActiveTab(id);
        setDrawerOpen(false);
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full" data-theme="organizer">
            {/* Brand */}
            <div className="px-5 py-5 border-b border-[#F0EDE5]">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                        <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-[#2D3748] leading-tight">EventConnect</div>
                        <div className="text-[10px] font-semibold" style={{ color: 'var(--accent)' }}>Organizer Portal</div>
                    </div>
                </div>
            </div>

            {/* User info */}
            <div className="px-4 py-3 border-b border-[#F0EDE5]">
                <div className="flex items-center space-x-2.5">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ background: 'var(--accent)' }}
                    >
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'O'}
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-bold text-[#2D3748] truncate">{user?.name}</div>
                        <div className="text-[10px] text-[#94A3B8] truncate">{user?.email}</div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
                    const isActive = activeTab === id;
                    return (
                        <button
                            key={id}
                            onClick={() => handleNav(id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group ${isActive
                                    ? 'text-white shadow-sm'
                                    : 'text-[#64748B] hover:bg-[#FAF9F5] hover:text-[#2D3748]'
                                }`}
                            style={isActive ? { background: 'var(--accent)' } : {}}
                        >
                            <div className="flex items-center space-x-2.5">
                                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#94A3B8] group-hover:text-[#64748B]'}`} />
                                <span>{label}</span>
                            </div>
                            {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
                        </button>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="px-3 py-3 border-t border-[#F0EDE5]">
                <button
                    onClick={() => { logout(); }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );

    return (
        <div data-theme="organizer" className="min-h-screen bg-[#FAF9F5]">
            {/* Desktop Sidebar */}
            <aside className="organizer-sidebar hidden md:flex flex-col">
                <SidebarContent />
            </aside>

            {/* Mobile: hamburger overlay */}
            <>
                {/* Hamburger button */}
                <button
                    onClick={() => setDrawerOpen(true)}
                    className="md:hidden fixed top-4 left-4 z-40 w-9 h-9 bg-white border border-[#E6E4DC] rounded-xl flex items-center justify-center shadow-sm"
                >
                    <Menu className="w-4 h-4 text-[#2D3748]" />
                </button>

                {/* Backdrop */}
                {drawerOpen && (
                    <div
                        className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
                        onClick={() => setDrawerOpen(false)}
                    />
                )}

                {/* Drawer */}
                <aside
                    className={`md:hidden organizer-sidebar flex flex-col ${drawerOpen ? 'open' : ''}`}
                >
                    <div className="flex items-center justify-end px-4 pt-4">
                        <button
                            onClick={() => setDrawerOpen(false)}
                            className="w-7 h-7 rounded-lg bg-[#FAF9F5] flex items-center justify-center"
                        >
                            <X className="w-4 h-4 text-[#64748B]" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <SidebarContent />
                    </div>
                </aside>
            </>

            {/* Main Content */}
            <div className="organizer-content">
                <div className="max-w-4xl mx-auto p-4 md:p-6 pt-14 md:pt-6">
                    {children}
                </div>
            </div>
        </div>
    );
};
