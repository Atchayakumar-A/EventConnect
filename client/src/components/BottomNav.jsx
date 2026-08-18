import React from 'react';
import { Home, Search, Ticket, User, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const BottomNav = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const isOrganizer = user?.role === 'organizer';

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    ...(isOrganizer ? [{ id: 'create', label: 'Create', icon: PlusCircle }] : []),
    { id: 'my-events', label: 'My Events', icon: Ticket },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E6E4DC] px-2 py-1.5 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-[#5F8670] bg-[#E8EFEA] font-semibold scale-105'
                  : 'text-[#64748B] hover:text-[#2D3748]'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              <span className="text-[11px] leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
