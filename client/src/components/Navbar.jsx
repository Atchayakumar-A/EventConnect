import React, { useState, useEffect } from 'react';
import { Calendar, Bell, CheckCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export const Navbar = ({ onOpenAnalytics }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-[#E6E4DC] px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#5F8670] flex items-center justify-center text-white shadow-sm">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[#2D3748] leading-none">
              EventConnect
            </h1>
            <span className="text-[10px] font-medium text-[#5F8670] bg-[#E8EFEA] px-1.5 py-0.5 rounded-full inline-block mt-0.5">
              100% Phase 2 Build
            </span>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-2">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative w-8 h-8 rounded-full bg-[#FAF9F5] border border-[#E6E4DC] text-[#64748B] flex items-center justify-center hover:bg-[#F4F3ED] transition-colors"
            >
              <Bell className="w-4 h-4 text-[#2D3748]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Popup */}
            {showDropdown && (
              <div className="absolute right-0 top-10 w-72 bg-white rounded-2xl border border-[#E6E4DC] shadow-calm-lg p-3 z-50 space-y-2 animate-in fade-in zoom-in duration-150">
                <div className="flex items-center justify-between border-b border-[#E6E4DC] pb-2">
                  <h4 className="text-xs font-bold text-[#2D3748]">Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] text-[#5F8670] font-semibold flex items-center space-x-1 hover:underline"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>Mark all as read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 text-xs">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-[#94A3B8] text-[11px]">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.is_read && markAsRead(n.id)}
                        className={`p-2.5 rounded-xl border text-xs space-y-0.5 cursor-pointer transition-colors ${
                          n.is_read === 0
                            ? 'bg-[#E8EFEA]/40 border-[#5F8670]/30 text-[#2D3748] font-medium'
                            : 'bg-[#FAF9F5] border-[#E6E4DC] text-[#64748B]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-[#94A3B8]">
                          <span className="capitalize font-semibold text-[#5F8670]">{n.type.replace('_', ' ')}</span>
                          <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="leading-snug text-[11px]">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Badge */}
          {user && (
            <div className="flex items-center space-x-1 bg-[#F4F3ED] border border-[#E6E4DC] px-2.5 py-1 rounded-full text-xs font-medium text-[#2D3748]">
              <span className="w-2 h-2 rounded-full bg-[#5F8670]"></span>
              <span className="capitalize">{user.role}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
