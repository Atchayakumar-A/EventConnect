import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { EventCard } from '../components/EventCard';
import { Sparkles, Calendar, Search, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const HomePage = ({ onSelectEvent, onOpenSearch }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch recommendations
      const recData = await api.get('/recommendations');
      setRecommendations(recData.recommendations || []);

      // 2. Fetch all events
      const eventsData = await api.get('/events');
      setAllEvents(eventsData || []);
    } catch (err) {
      console.error('Failed to load home page feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#5F8670] to-[#3A7CA5] text-white rounded-3xl p-5 shadow-calm-md space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
            Welcome back 👋
          </span>
          <span className="text-[11px] bg-white/20 px-2.5 py-0.5 rounded-full font-medium">
            {user?.name || 'Explorer'}
          </span>
        </div>
        <h2 className="text-xl font-extrabold tracking-tight leading-snug">
          Discover handpicked events around you
        </h2>
        
        {/* Search quick button */}
        <button
          onClick={onOpenSearch}
          className="w-full mt-3 bg-white/90 text-[#2D3748] rounded-2xl py-2.5 px-4 text-xs font-medium flex items-center justify-between shadow-xs hover:bg-white transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-[#5F8670]" />
            <span className="text-[#64748B]">Search by title, topic, or venue...</span>
          </div>
          <span className="text-[10px] bg-[#E8EFEA] text-[#5F8670] px-2 py-0.5 rounded-full font-bold">
            Filter
          </span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-[#5F8670] animate-spin mx-auto" />
          <p className="text-xs text-[#64748B]">Calculating recommendations & loading events...</p>
        </div>
      ) : (
        <>
          {/* Section: Recommended for You */}
          {recommendations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-xl bg-[#E8F2F8] text-[#3A7CA5] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#2D3748]">Recommended for You</h3>
                    <p className="text-[11px] text-[#64748B]">Ranked using vector similarity & preferences</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {recommendations.slice(0, 4).map((event) => (
                  <EventCard
                    key={`rec-${event.id}`}
                    event={event}
                    isRecommended={true}
                    onClick={() => onSelectEvent(event.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Split events by participation mode */}
          {(() => {
            const soloEvents = allEvents.filter(ev =>
              ev.participation_mode === 'solo_only' || (!ev.participation_mode && !ev.team_required)
            );
            const teamEvents = allEvents.filter(ev =>
              ev.participation_mode === 'team_only' || ev.participation_mode === 'both' || Boolean(ev.team_required)
            );

            if (allEvents.length === 0) {
              return (
                <div className="bg-white rounded-2xl p-8 border border-[#E6E4DC] text-center space-y-2">
                  <Calendar className="w-8 h-8 text-[#94A3B8] mx-auto" />
                  <p className="text-xs font-semibold text-[#2D3748]">No upcoming events found</p>
                </div>
              );
            }

            return (
              <div className="space-y-6 pt-2">
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
                          key={`solo-${event.id}`}
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
                          key={`team-${event.id}`}
                          event={event}
                          onClick={() => onSelectEvent(event.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}

    </div>
  );
};
