import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import {
    LayoutDashboard, Calendar, MapPin, Users, IndianRupee,
    Star, AlertCircle, RefreshCw, QrCode, BarChart2, Plus,
    TrendingUp, Clock, CheckCircle2, ChevronRight
} from 'lucide-react';

const StatusBadge = ({ status }) => {
    const map = {
        active: { label: 'Active', cls: 'bg-emerald-100 text-emerald-800' },
        cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700' },
        draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-600' },
    };
    const c = map[status] || map.draft;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${c.cls}`}>
            {c.label}
        </span>
    );
};

export const OrganizerDashboard = ({ onOpenSection }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await api.get('/registrations/my-events');
            setEvents(data.createdEvents || []);
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Summary stats
    const totalEvents = events.length;
    const totalAttendees = events.reduce((sum, e) => sum + (Number(e.confirmed_count) || 0), 0);
    const pendingPayments = events.reduce((sum, e) => sum + (Number(e.pending_payments_count) || 0), 0);

    const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} />
                <p className="text-sm text-[#94A3B8]">Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#2D3748]">My Events</h1>
                    <p className="text-sm text-[#94A3B8] mt-0.5">Your organizer dashboard overview</p>
                </div>
                <button
                    onClick={() => onOpenSection('create')}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-white text-sm font-bold shadow-sm transition-transform hover:scale-105"
                    style={{ background: 'var(--accent)' }}
                >
                    <Plus className="w-4 h-4" />
                    <span>New Event</span>
                </button>
            </div>

            {/* Summary Strip */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { icon: Calendar, label: 'Total Events', value: totalEvents, color: 'var(--accent)' },
                    { icon: Users, label: 'Total Attendees', value: totalAttendees, color: '#3A7CA5' },
                    { icon: IndianRupee, label: 'Pending Payments', value: pendingPayments, color: pendingPayments > 0 ? '#D97706' : '#5F8670' },
                ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="bg-white border border-[#E6E4DC] rounded-2xl p-4 shadow-sm flex flex-col items-center text-center space-y-1">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                            <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <div className="text-xl font-extrabold text-[#2D3748]">{value}</div>
                        <div className="text-[10px] text-[#94A3B8] font-medium">{label}</div>
                    </div>
                ))}
            </div>

            {/* Event Cards */}
            {events.length === 0 ? (
                <div className="bg-white border border-[#E6E4DC] rounded-3xl p-12 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'var(--accent-light)' }}>
                        <Calendar className="w-7 h-7" style={{ color: 'var(--accent)' }} />
                    </div>
                    <h3 className="text-base font-bold text-[#2D3748]">No events yet</h3>
                    <p className="text-sm text-[#94A3B8]">Create your first event to get started.</p>
                    <button
                        onClick={() => onOpenSection('create')}
                        className="mt-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
                        style={{ background: 'var(--accent)' }}
                    >
                        Create Event
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {events.map((event) => (
                        <div key={event.id} className="bg-white border border-[#E6E4DC] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            {/* Banner */}
                            {event.banner_url && (
                                <div className="h-28 bg-[#F4F3ED] overflow-hidden">
                                    <img
                                        src={event.banner_url}
                                        alt={event.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                </div>
                            )}

                            <div className="p-4 space-y-3">
                                {/* Title row */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span
                                                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                                            >
                                                {event.category}
                                            </span>
                                            <StatusBadge status={event.status} />
                                        </div>
                                        <h3 className="text-base font-bold text-[#2D3748] truncate">{event.title}</h3>
                                    </div>
                                    {Number(event.price) > 0 && (
                                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex-shrink-0">
                                            ₹{event.price}
                                        </span>
                                    )}
                                </div>

                                {/* Meta */}
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#64748B]">
                                    <div className="flex items-center space-x-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{formatDate(event.start_time)}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span className="truncate max-w-[140px]">{event.venue_name}</span>
                                    </div>
                                </div>

                                {/* Stats row */}
                                <div className="flex items-center justify-between pt-2 border-t border-[#F4F3ED]">
                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="flex items-center space-x-1 text-[#64748B]">
                                            <Users className="w-3.5 h-3.5" />
                                            <span className="font-semibold text-[#2D3748]">{event.confirmed_count || 0}</span>
                                            <span>/ {event.capacity}</span>
                                        </div>
                                        {(event.avg_rating > 0) && (
                                            <div className="flex items-center space-x-1 text-amber-600">
                                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                                <span className="font-semibold">{Number(event.avg_rating).toFixed(1)}</span>
                                            </div>
                                        )}
                                        {Number(event.pending_payments_count) > 0 && (
                                            <div className="flex items-center space-x-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                                <AlertCircle className="w-3 h-3" />
                                                <span className="font-bold text-[10px]">{event.pending_payments_count} pending</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center space-x-1.5">
                                        <button
                                            onClick={() => onOpenSection('registrations', event.id)}
                                            title="Registrations"
                                            className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#FAF9F5] hover:text-[#2D3748] transition-colors"
                                        >
                                            <Users className="w-4 h-4" />
                                        </button>
                                        {Number(event.price) > 0 && (
                                            <button
                                                onClick={() => onOpenSection('payments', event.id)}
                                                title="Pending Payments"
                                                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                                            >
                                                <IndianRupee className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onOpenSection('scan', event.id)}
                                            title="Scan QR"
                                            className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#FAF9F5] hover:text-[#2D3748] transition-colors"
                                        >
                                            <QrCode className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onOpenSection('analytics', event.id)}
                                            title="Analytics"
                                            className="p-1.5 rounded-lg text-white text-xs rounded-lg shadow-sm transition-transform hover:scale-105"
                                            style={{ background: 'var(--accent)' }}
                                        >
                                            <BarChart2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
