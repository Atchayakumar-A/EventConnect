import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import {
    IndianRupee, RefreshCw, CheckCircle2, X, AlertCircle, ChevronDown
} from 'lucide-react';

export const OrganizerPendingPayments = ({ preSelectedEventId }) => {
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState(preSelectedEventId || '');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [acting, setActing] = useState(null);

    // Load paid organizer events
    useEffect(() => {
        const load = async () => {
            setEventsLoading(true);
            try {
                const data = await api.get('/registrations/my-events');
                const paidEvents = (data.createdEvents || []).filter(e => Number(e.price) > 0);
                setEvents(paidEvents);
                if (!selectedEventId && paidEvents.length > 0) {
                    setSelectedEventId(String(paidEvents[0].id));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setEventsLoading(false);
            }
        };
        load();
    }, []);

    const fetchPending = async (eventId) => {
        if (!eventId) return;
        setLoading(true);
        try {
            const data = await api.get(`/registrations/pending-payments/${eventId}`);
            setItems(data.pendingPayments || []);
        } catch (err) {
            console.error(err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (selectedEventId) fetchPending(selectedEventId); }, [selectedEventId]);

    const handleConfirm = async (regId) => {
        setActing(regId);
        try {
            await api.post(`/registrations/payments/${regId}/confirm`, {});
            fetchPending(selectedEventId);
        } catch (e) {
            alert(e.message || 'Failed to confirm');
        } finally { setActing(null); }
    };

    const handleReject = async (regId) => {
        const note = prompt('Rejection reason (optional):') ?? '';
        setActing(regId);
        try {
            await api.post(`/registrations/payments/${regId}/reject`, { note });
            fetchPending(selectedEventId);
        } catch (e) {
            alert(e.message || 'Failed to reject');
        } finally { setActing(null); }
    };

    const selectedEvent = events.find(e => String(e.id) === String(selectedEventId));

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-extrabold text-[#2D3748]">Pending Payments</h1>
                <p className="text-sm text-[#94A3B8] mt-0.5">Confirm or reject payment verifications</p>
            </div>

            {/* Event Selector */}
            {eventsLoading ? (
                <div className="h-10 bg-white border border-[#E6E4DC] rounded-xl animate-pulse" />
            ) : events.length === 0 ? (
                <div className="bg-white border border-[#E6E4DC] rounded-2xl p-8 text-center space-y-2">
                    <IndianRupee className="w-8 h-8 text-[#94A3B8] mx-auto" />
                    <h3 className="text-sm font-bold text-[#2D3748]">No paid events</h3>
                    <p className="text-xs text-[#94A3B8]">Pending payments only appear for paid events.</p>
                </div>
            ) : (
                <>
                    <div className="relative">
                        <select
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                            className="w-full bg-white border border-[#E6E4DC] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#2D3748] appearance-none focus:outline-none focus:border-[#C07D3A] pr-10"
                        >
                            {events.map((e) => (
                                <option key={e.id} value={String(e.id)}>
                                    {e.title} · ₹{e.price}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-16 space-x-2">
                            <RefreshCw className="w-5 h-5 animate-spin" style={{ color: 'var(--accent)' }} />
                            <span className="text-sm text-[#94A3B8]">Loading...</span>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="bg-white border border-[#E6E4DC] rounded-2xl p-8 text-center space-y-2">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                            <h3 className="text-sm font-bold text-[#2D3748]">All clear!</h3>
                            <p className="text-xs text-[#94A3B8]">No pending payment verifications for this event.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-xs text-[#94A3B8] font-medium">{items.length} awaiting verification</p>
                            {items.map((item) => (
                                <div key={item.registration_id} className="bg-white border border-[#E6E4DC] rounded-xl p-4 space-y-3">
                                    <div>
                                        <p className="text-sm font-bold text-[#2D3748]">{item.attendee_name}</p>
                                        <p className="text-xs text-[#94A3B8]">{item.attendee_email}</p>
                                        {selectedEvent && (
                                            <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                                                Amount: ₹{selectedEvent.price}
                                            </p>
                                        )}
                                        {item.payment_note && (
                                            <p className="text-[10px] text-[#64748B] mt-0.5 italic">Ref: {item.payment_note}</p>
                                        )}
                                        <p className="text-[10px] text-[#94A3B8] mt-0.5">
                                            Requested: {new Date(item.created_at).toLocaleString('en-IN', {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleConfirm(item.registration_id)}
                                            disabled={acting === item.registration_id}
                                            className="flex-1 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-60 flex items-center justify-center space-x-1.5 transition-opacity"
                                            style={{ background: '#22C55E' }}
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>{acting === item.registration_id ? '...' : 'Confirm Payment'}</span>
                                        </button>
                                        <button
                                            onClick={() => handleReject(item.registration_id)}
                                            disabled={acting === item.registration_id}
                                            className="flex-1 py-2 rounded-xl text-red-700 text-xs font-bold bg-red-50 border border-red-200 disabled:opacity-60 flex items-center justify-center space-x-1.5 transition-opacity"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                            <span>Reject</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
