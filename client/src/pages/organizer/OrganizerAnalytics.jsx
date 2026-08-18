import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { StarRating } from '../../components/ReviewModal';
import {
    BarChart2, Users, Star, TrendingUp, TrendingDown, IndianRupee,
    RefreshCw, ChevronDown, CheckCircle2, XCircle, Clock, UserCheck
} from 'lucide-react';

// Simple CSS bar chart component
const BarChart = ({ data }) => {
    if (!data || data.length === 0) {
        return <p className="text-xs text-[#94A3B8] text-center py-4">No data yet</p>;
    }
    const max = Math.max(...data.map(d => d.count), 1);
    return (
        <div className="flex items-end space-x-1.5 h-24 mt-2">
            {data.map((item) => (
                <div key={item.date} className="flex-1 flex flex-col items-center justify-end space-y-0.5">
                    <span className="text-[9px] text-[#94A3B8] font-bold">{item.count}</span>
                    <div
                        className="w-full rounded-t-md transition-all duration-500"
                        style={{
                            height: `${Math.max(4, (item.count / max) * 80)}px`,
                            background: 'var(--accent)',
                            opacity: 0.85,
                        }}
                    />
                    <span className="text-[8px] text-[#94A3B8] truncate w-full text-center">
                        {item.date?.slice(5)} {/* MM-DD */}
                    </span>
                </div>
            ))}
        </div>
    );
};

const StatCard = ({ label, value, sub, icon: Icon, color }) => (
    <div className="bg-white border border-[#E6E4DC] rounded-xl p-3.5 space-y-1">
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">{label}</span>
            {Icon && <Icon className="w-3.5 h-3.5" style={{ color: color || 'var(--accent)' }} />}
        </div>
        <div className="text-xl font-extrabold" style={{ color: color || '#2D3748' }}>{value}</div>
        {sub && <div className="text-[10px] text-[#94A3B8]">{sub}</div>}
    </div>
);

export const OrganizerAnalytics = ({ preSelectedEventId }) => {
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState(preSelectedEventId || '');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [eventsLoading, setEventsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setEventsLoading(true);
            try {
                const res = await api.get('/registrations/my-events');
                const evts = res.createdEvents || [];
                setEvents(evts);
                if (!selectedEventId && evts.length > 0) setSelectedEventId(String(evts[0].id));
            } catch (err) { console.error(err); }
            finally { setEventsLoading(false); }
        };
        load();
    }, []);

    useEffect(() => {
        if (!selectedEventId) return;
        const fetchAnalytics = async () => {
            setLoading(true);
            setData(null);
            try {
                const res = await api.get(`/analytics/organizer/${selectedEventId}`);
                setData(res);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchAnalytics();
    }, [selectedEventId]);

    const s = data?.stats || {};

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-extrabold text-[#2D3748]">Analytics</h1>
                <p className="text-sm text-[#94A3B8] mt-0.5">Per-event performance metrics</p>
            </div>

            {/* Event Selector */}
            {eventsLoading ? (
                <div className="h-10 bg-white border border-[#E6E4DC] rounded-xl animate-pulse" />
            ) : (
                <div className="relative">
                    <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="w-full bg-white border border-[#E6E4DC] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#2D3748] appearance-none focus:outline-none focus:border-[#C07D3A] pr-10"
                    >
                        {events.length === 0 && <option value="">No events</option>}
                        {events.map(e => <option key={e.id} value={String(e.id)}>{e.title}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center py-16 space-x-2">
                    <RefreshCw className="w-5 h-5 animate-spin" style={{ color: 'var(--accent)' }} />
                    <span className="text-sm text-[#94A3B8]">Loading analytics...</span>
                </div>
            )}

            {!loading && data && (
                <div className="space-y-4">
                    {/* Event title */}
                    <div className="bg-white border border-[#E6E4DC] rounded-xl p-4">
                        <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--accent)' }}>Event</div>
                        <h2 className="text-base font-bold text-[#2D3748]">{data.event?.title}</h2>
                    </div>

                    {/* Registration Counts */}
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label="Total Registrations" value={s.totalRegistrations} icon={Users} />
                        <StatCard label="Confirmed" value={s.confirmedCount} icon={CheckCircle2} color="#16A34A" />
                        <StatCard label="Checked In" value={s.checkedInCount} icon={UserCheck} color="#2563EB" />
                        <StatCard label="Waitlisted" value={s.waitlistCount} icon={Clock} color="#D97706" />
                        <StatCard label="Cancelled" value={s.cancelledCount} icon={XCircle} color="#DC2626" />
                        <StatCard label="Avg Rating" value={s.avgRating || '—'} sub={`${s.reviewCount} review(s)`} icon={Star} color="#F59E0B" />
                    </div>

                    {/* Attendance Rate */}
                    <div className="bg-white border border-[#E6E4DC] rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-[#2D3748]">Attendance Rate</span>
                            <div className="flex items-center space-x-1" style={{ color: 'var(--accent)' }}>
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-sm font-extrabold">{s.attendanceRate}%</span>
                            </div>
                        </div>
                        <div className="w-full bg-[#F4F3ED] rounded-full h-2">
                            <div
                                className="h-2 rounded-full transition-all duration-700"
                                style={{ width: `${s.attendanceRate}%`, background: 'var(--accent)' }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-[#94A3B8]">
                            <span>Attended: {s.checkedInCount}</span>
                            <span>No-show: {s.noShowRate}%</span>
                        </div>
                    </div>

                    {/* Revenue (paid events) */}
                    {Number(data.event?.price) > 0 && (
                        <div className="bg-white border border-[#E6E4DC] rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <div className="text-[10px] font-semibold uppercase text-[#94A3B8] tracking-wide">Revenue (Confirmed)</div>
                                <div className="text-2xl font-extrabold text-[#2D3748] mt-1">₹{s.revenue?.toLocaleString('en-IN')}</div>
                                <div className="text-xs text-[#94A3B8]">
                                    {Math.floor((s.revenue || 0) / (Number(data.event.price) || 1))} paid × ₹{data.event.price}
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--accent-light)' }}>
                                <IndianRupee className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                            </div>
                        </div>
                    )}

                    {/* Registrations Over Time */}
                    <div className="bg-white border border-[#E6E4DC] rounded-xl p-4 space-y-2">
                        <span className="text-sm font-bold text-[#2D3748]">Registrations Over Time</span>
                        <BarChart data={data.registrationsTimeline} />
                    </div>

                    {/* Team Stats */}
                    {data.teamStats && (
                        <div className="bg-white border border-[#E6E4DC] rounded-xl p-4 space-y-2">
                            <span className="text-sm font-bold text-[#2D3748]">Team Formation</span>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                                <div className="bg-[#FAF9F5] rounded-xl p-2">
                                    <div className="font-extrabold text-lg text-[#2D3748]">{data.teamStats.total_teams || 0}</div>
                                    <div className="text-[10px] text-[#94A3B8]">Total Teams</div>
                                </div>
                                <div className="rounded-xl p-2" style={{ background: 'var(--accent-light)' }}>
                                    <div className="font-extrabold text-lg" style={{ color: 'var(--accent)' }}>{data.teamStats.recruiting_teams || 0}</div>
                                    <div className="text-[10px]" style={{ color: 'var(--accent)' }}>Recruiting</div>
                                </div>
                                <div className="bg-blue-50 rounded-xl p-2 text-blue-700">
                                    <div className="font-extrabold text-lg">{data.teamStats.full_teams || 0}</div>
                                    <div className="text-[10px]">Full</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recent Reviews */}
                    <div className="bg-white border border-[#E6E4DC] rounded-xl p-4 space-y-3">
                        <span className="text-sm font-bold text-[#2D3748]">Recent Reviews</span>
                        {data.recentReviews.length === 0 ? (
                            <p className="text-xs text-[#94A3B8]">No reviews yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {data.recentReviews.map(r => (
                                    <div key={r.id} className="bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl p-3 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-[#2D3748]">{r.reviewer_name}</span>
                                            {StarRating && <StarRating rating={r.rating} readOnly size="sm" />}
                                        </div>
                                        <p className="text-[11px] text-[#64748B]">{r.comment || 'No comment.'}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
