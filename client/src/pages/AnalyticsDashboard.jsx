import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { StarRating } from '../components/ReviewModal';
import { BarChart2, Users, Calendar, ShieldCheck, RefreshCw, Star, Ban, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AnalyticsDashboard = ({ eventId, onBack }) => {
  const [tab, setTab] = useState(eventId ? 'organizer' : 'admin'); // 'organizer', 'admin'
  const [organizerData, setOrganizerData] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      if (eventId) {
        const data = await api.get(`/analytics/organizer/${eventId}`);
        setOrganizerData(data);
      }
      
      const adminRes = await api.get('/analytics/admin');
      setAdminData(adminRes);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [eventId]);

  const handleToggleEventStatus = async (targetEventId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'cancelled' ? 'active' : 'cancelled';
      await api.put(`/analytics/admin/events/${targetEventId}/status`, { status: nextStatus });
      fetchAnalytics();
    } catch (err) {
      alert('Failed to update event status');
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-xs text-[#64748B]">Loading analytics dashboard...</div>;
  }

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-semibold text-[#5F8670] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <h2 className="text-lg font-bold text-[#2D3748]">Analytics & Admin</h2>
      </div>

      {/* Tabs */}
      <div className="bg-white p-1 rounded-2xl border border-[#E6E4DC] flex text-xs font-semibold shadow-calm-sm">
        {eventId && (
          <button
            onClick={() => setTab('organizer')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              tab === 'organizer' ? 'bg-[#5F8670] text-white shadow-xs' : 'text-[#64748B]'
            }`}
          >
            Event Metrics
          </button>
        )}
        <button
          onClick={() => setTab('admin')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            tab === 'admin' ? 'bg-[#3A7CA5] text-white shadow-xs' : 'text-[#64748B]'
          }`}
        >
          Admin Management
        </button>
      </div>

      {tab === 'organizer' && organizerData ? (
        <div className="space-y-4 text-xs">
          
          {/* Event Title */}
          <div className="bg-white p-4 rounded-3xl border border-[#E6E4DC] shadow-calm-sm space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#5F8670]">Event Overview</span>
            <h3 className="text-base font-bold text-[#2D3748]">{organizerData.event.title}</h3>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-[#E6E4DC] space-y-1">
              <span className="text-[#64748B]">Total Registrations</span>
              <div className="text-xl font-extrabold text-[#2D3748]">{organizerData.stats.totalRegistrations}</div>
              <div className="text-[10px] text-[#5F8670] font-medium">
                Confirmed: {organizerData.stats.confirmedCount} | Waitlist: {organizerData.stats.waitlistCount}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E6E4DC] space-y-1">
              <span className="text-[#64748B]">Average Rating</span>
              <div className="text-xl font-extrabold text-amber-500 flex items-center space-x-1">
                <span>{organizerData.stats.avgRating}</span>
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
              <div className="text-[10px] text-[#64748B]">From {organizerData.stats.reviewCount} review(s)</div>
            </div>
          </div>

          {/* Team stats if applicable */}
          {organizerData.teamStats && (
            <div className="bg-white p-4 rounded-2xl border border-[#E6E4DC] space-y-2">
              <span className="font-bold text-[#2D3748]">Team Formation Stats</span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="bg-[#FAF9F5] p-2 rounded-xl">
                  <div className="font-bold text-base">{organizerData.teamStats.total_teams || 0}</div>
                  <div className="text-[10px] text-[#64748B]">Total Teams</div>
                </div>
                <div className="bg-[#E8EFEA] p-2 rounded-xl text-[#5F8670]">
                  <div className="font-bold text-base">{organizerData.teamStats.recruiting_teams || 0}</div>
                  <div className="text-[10px]">Recruiting</div>
                </div>
                <div className="bg-[#E8F2F8] p-2 rounded-xl text-[#3A7CA5]">
                  <div className="font-bold text-base">{organizerData.teamStats.full_teams || 0}</div>
                  <div className="text-[10px]">Full Teams</div>
                </div>
              </div>
            </div>
          )}

          {/* Registration Timeline Chart */}
          <div className="bg-white p-4 rounded-2xl border border-[#E6E4DC] space-y-3">
            <span className="font-bold text-[#2D3748] block">Registration Volume over Time</span>
            {organizerData.registrationsTimeline.length === 0 ? (
              <p className="text-[11px] text-[#94A3B8]">No registrations recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {organizerData.registrationsTimeline.map(item => (
                  <div key={item.date} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-medium text-[#2D3748]">{item.date}</span>
                      <span className="font-bold text-[#5F8670]">{item.count} reg(s)</span>
                    </div>
                    <div className="w-full h-2 bg-[#F4F3ED] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#5F8670] rounded-full"
                        style={{ width: `${Math.min(100, item.count * 20)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Reviews */}
          <div className="bg-white p-4 rounded-2xl border border-[#E6E4DC] space-y-3">
            <span className="font-bold text-[#2D3748] block">Recent Attendee Reviews</span>
            {organizerData.recentReviews.length === 0 ? (
              <p className="text-[11px] text-[#94A3B8]">No reviews submitted yet.</p>
            ) : (
              <div className="space-y-2">
                {organizerData.recentReviews.map(r => (
                  <div key={r.id} className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E6E4DC] space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-[#2D3748]">{r.reviewer_name}</span>
                      <StarRating rating={r.rating} readOnly size="sm" />
                    </div>
                    <p className="text-[#64748B] text-[11px]">{r.comment || 'No comment provided.'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Admin Panel */
        <div className="space-y-4 text-xs">
          
          {/* Users Overview */}
          <div className="bg-white p-4 rounded-2xl border border-[#E6E4DC] space-y-3 shadow-calm-sm">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[#2D3748]">Registered Platform Users</h3>
              <span className="text-[11px] text-[#5F8670] bg-[#E8EFEA] px-2 py-0.5 rounded-full font-bold">
                {adminData?.users?.length || 0} Total
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(adminData?.users || []).map(u => (
                <div key={u.id} className="p-2.5 bg-[#FAF9F5] rounded-xl border border-[#E6E4DC] flex justify-between items-center text-xs">
                  <div>
                    <div className="font-semibold text-[#2D3748]">{u.name}</div>
                    <div className="text-[10px] text-[#64748B]">{u.email}</div>
                  </div>
                  <span className="capitalize font-bold text-[10px] bg-white border border-[#E6E4DC] px-2 py-0.5 rounded-full">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Events Management */}
          <div className="bg-white p-4 rounded-2xl border border-[#E6E4DC] space-y-3 shadow-calm-sm">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[#2D3748]">All Platform Events</h3>
              <span className="text-[11px] text-[#3A7CA5] bg-[#E8F2F8] px-2 py-0.5 rounded-full font-bold">
                {adminData?.events?.length || 0} Events
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {(adminData?.events || []).map(ev => (
                <div key={ev.id} className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E6E4DC] space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-[#2D3748]">{ev.title}</h4>
                      <p className="text-[10px] text-[#64748B]">Organizer: {ev.organizer_name} | {ev.category}</p>
                    </div>

                    <button
                      onClick={() => handleToggleEventStatus(ev.id, ev.status)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-colors ${
                        ev.status === 'cancelled'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {ev.status === 'cancelled' ? 'Un-cancel Event' : 'Cancel/Unpublish'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
