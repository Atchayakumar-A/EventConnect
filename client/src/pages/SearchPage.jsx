import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { EventCard } from '../components/EventCard';
import { Search, Filter, X, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Music & Concerts',
  'Technology & Workshops',
  'Sports & Fitness',
  'Food & Drink',
  'Arts & Culture',
  'Business & Networking',
  'Comedy & Entertainment',
  'Education & Learning',
  'Community & Charity',
  'Festivals & Celebrations'
];

export const SearchPage = ({ onSelectEvent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFilteredEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (startDate) params.append('startDate', startDate);

      const data = await api.get(`/events?${params.toString()}`);
      setEvents(data || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFilteredEvents();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, startDate]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setStartDate('');
  };

  return (
    <div className="space-y-4 pb-20">
      
      {/* Page Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-[#2D3748]">Search & Discover</h2>
        <p className="text-xs text-[#64748B]">Filter events by keyword, category, or date</p>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title, description, or location..."
          className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-[#E6E4DC] bg-white text-xs text-[#2D3748] focus:outline-none focus:border-[#5F8670] shadow-calm-sm"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-3 text-[#94A3B8] hover:text-[#2D3748]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Filter Chips */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
          Category
        </span>
        <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-medium whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[#5F8670] border-[#5F8670] text-white shadow-xs'
                    : 'bg-white border-[#E6E4DC] text-[#64748B] hover:border-[#5F8670]/50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Filter & Active Filters reset */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-2xl border border-[#E6E4DC]">
          <CalendarIcon className="w-3.5 h-3.5 text-[#3A7CA5]" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent text-xs text-[#2D3748] focus:outline-none"
          />
        </div>

        {(searchTerm || selectedCategory !== 'All' || startDate) && (
          <button
            onClick={clearFilters}
            className="text-xs text-amber-700 font-semibold hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Results Feed */}
      {loading ? (
        <div className="py-16 text-center space-y-2">
          <RefreshCw className="w-6 h-6 text-[#5F8670] animate-spin mx-auto" />
          <p className="text-xs text-[#64748B]">Searching events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-[#E6E4DC] text-center space-y-2">
          <Filter className="w-8 h-8 text-[#94A3B8] mx-auto" />
          <h3 className="text-sm font-bold text-[#2D3748]">No matching events found</h3>
          <p className="text-xs text-[#64748B]">Try searching with a different keyword or category.</p>
        </div>
      ) : (
        (() => {
          const soloEvents = events.filter(ev =>
            ev.participation_mode === 'solo_only' || (!ev.participation_mode && !ev.team_required)
          );
          const teamEvents = events.filter(ev =>
            ev.participation_mode === 'team_only' || ev.participation_mode === 'both' || Boolean(ev.team_required)
          );

          return (
            <div className="space-y-6 pt-1">
              <div className="text-xs text-[#64748B] font-medium">
                Found {events.length} event{events.length === 1 ? '' : 's'} matching your criteria
              </div>

              {/* Section 1: Solo Events */}
              {soloEvents.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-xl bg-[#E8EFEA] text-[#5F8670] flex items-center justify-center font-bold text-xs shadow-xs">
                        🎟️
                      </div>
                      <h3 className="text-base font-bold text-[#2D3748]">Solo Events</h3>
                    </div>
                    <span className="text-xs text-[#64748B] font-medium">{soloEvents.length} events</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {soloEvents.map((event) => (
                      <EventCard
                        key={`search-solo-${event.id}`}
                        event={event}
                        onClick={() => onSelectEvent(event.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 2: Team Events */}
              {teamEvents.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-xl bg-[#E8F2F8] text-[#3A7CA5] flex items-center justify-center font-bold text-xs shadow-xs">
                        👥
                      </div>
                      <h3 className="text-base font-bold text-[#2D3748]">Team Events</h3>
                    </div>
                    <span className="text-xs text-[#64748B] font-medium">{teamEvents.length} events</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {teamEvents.map((event) => (
                      <EventCard
                        key={`search-team-${event.id}`}
                        event={event}
                        onClick={() => onSelectEvent(event.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()
      )}

    </div>
  );
};
