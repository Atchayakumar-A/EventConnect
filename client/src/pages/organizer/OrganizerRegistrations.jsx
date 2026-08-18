import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import {
    Users, RefreshCw, Filter, Calendar, CheckCircle2,
    Clock, XCircle, QrCode, UserCheck, ChevronDown
} from 'lucide-react';

const STATUS_TABS = [
    { id: 'all', label: 'All' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'waitlisted', label: 'Waitlisted' },
    { id: 'checked_in', label: 'Checked In' },
    { id: 'cancelled', label: 'Cancelled' },
];

const StatusBadge = ({ status }) => {
    const map = {
        confirmed: { label: 'Confirmed', cls: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle2 className="w-3 h-3" /> },
        waitlisted: { label: 'Waitlisted', cls: 'bg-amber-100 text-amber-800', icon: <Clock className="w-3 h-3" /> },
        cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
        checked_in: { label: 'Checked In', cls: 'bg-blue-100 text-blue-800', icon: <UserCheck className="w-3 h-3" /> },
        pending_payment: { label: 'Pmt Pending', cls: 'bg-orange-100 text-orange-800', icon: <Clock className="w-3 h-3" /> },
    };
    const c = map[status] || { label: status, cls: 'bg-gray-100 text-gray-600', icon: null };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.cls}`}>
            {c.icon}{c.label}
        </span>
    );
};

export const OrganizerRegistrations = ({ preSelectedEventId, onChangeEvent }) => {
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState(preSelectedEventId || '');
    const [attendees, setAttendees] = useState([]);
    const [activeStatus, setActiveStatus] = useState('all');
    const [loading, setLoading] = useState(false);
    const [eventsLoading, setEventsLoading] = useState(true);

    // Load organizer's events
    useEffect(() => {
        const loadEvents = async () => {
            setEventsLoading(true);
            try {
                const data = await api.get('/registrations/my-events');
                const evts = data.createdEvents || [];
                setEvents(evts);
                if (!selectedEventId && evts.length > 0) {
                    setSelectedEventId(String(evts[0].id));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setEventsLoading(false);
            }
        };
        loadEvents();
    }, []);

    // Reload when event or status filter changes
    useEffect(() => {
        if (!selectedEventId) return;
        const loadAttendees = async () => {
            setLoading(true);
            try {
                const params = activeStatus !== 'all' ? `?status=${activeStatus}` : '';
                const data = await api.get(`/registrations/event/${selectedEventId}${params}`);
                setAttendees(data.attendees || []);
            } catch (err) {
                console.error(err);
                setAttendees([]);
            } finally {
                setLoading(false);
            }
        };
        loadAttendees();
    }, [selectedEventId, activeStatus]);

    const handleEventChange = (id) => {
        setSelectedEventId(id);
        setActiveStatus('all');
        if (onChangeEvent) onChangeEvent(id);
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
    });

    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold text-[#2D3748]">Registrations</h1>
                <p className="text-sm text-[#94A3B8] mt-0.5">View and filter attendees per event</p>
            </div>

            {/* Event Selector */}
            {eventsLoading ? (
                <div className="h-10 bg-white border border-[#E6E4DC] rounded-xl animate-pulse" />
            ) : (
                <div className="relative">
                    <select
                        value={selectedEventId}
                        onChange={(e) => handleEventChange(e.target.value)}
                        className="w-full bg-white border border-[#E6E4DC] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#2D3748] appearance-none focus:outline-none focus:border-[#C07D3A] pr-10"
                    >
                        {events.length === 0 && <option value="">No events found</option>}
                        {events.map((e) => (
                            <option key={e.id} value={String(e.id)}>{e.title}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex space-x-1 bg-white border border-[#E6E4DC] rounded-xl p-1 overflow-x-auto">
                {STATUS_TABS.map(({ id, label }) => (
                    <button
                        key={id}
                        onClick={() => setActiveStatus(id)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeStatus === id
                                ? 'text-white shadow-sm'
                                : 'text-[#64748B] hover:text-[#2D3748]'
                            }`}
                        style={activeStatus === id ? { background: 'var(--accent)' } : {}}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Attendee List */}
            {!selectedEventId ? (
                <div className="bg-white border border-[#E6E4DC] rounded-2xl p-8 text-center space-y-2">
                    <Users className="w-8 h-8 text-[#94A3B8] mx-auto" />
                    <p className="text-sm text-[#94A3B8]">Select an event to view attendees</p>
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center py-16 space-x-2">
                    <RefreshCw className="w-5 h-5 animate-spin" style={{ color: 'var(--accent)' }} />
                    <span className="text-sm text-[#94A3B8]">Loading attendees...</span>
                </div>
            ) : attendees.length === 0 ? (
                <div className="bg-white border border-[#E6E4DC] rounded-2xl p-8 text-center space-y-2">
                    <Users className="w-8 h-8 text-[#94A3B8] mx-auto" />
                    <h3 className="text-sm font-bold text-[#2D3748]">No attendees found</h3>
                    <p className="text-xs text-[#94A3B8]">
                        {activeStatus !== 'all' ? `No attendees with status "${activeStatus}"` : 'No registrations yet'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    <p className="text-xs text-[#94A3B8] font-medium">{attendees.length} attendee(s)</p>
                    {attendees.map((a) => (
                        <div key={a.registration_id} className="bg-white border border-[#E6E4DC] rounded-xl p-3.5 flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-[#2D3748]">{a.attendee_name}</span>
                                    {a.team_name && (
                                        <span className="text-[10px] text-[#64748B] bg-[#F4F3ED] px-2 py-0.5 rounded-full">
                                            Team: {a.team_name}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-[#94A3B8] mt-0.5">{a.attendee_email}</p>
                                <p className="text-[10px] text-[#94A3B8] mt-0.5">
                                    Registered: {formatDate(a.registered_at)}
                                    {a.checked_in_at && (
                                        <span className="ml-2 text-blue-600">
                                            · Checked in: {new Date(a.checked_in_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </p>
                            </div>
                            <StatusBadge status={a.status} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
