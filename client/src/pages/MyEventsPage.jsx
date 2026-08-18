import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { TicketModal } from '../components/TicketModal';
import { ReviewModal } from '../components/ReviewModal';
import {
  Ticket, QrCode, Calendar, MapPin, Star, RefreshCw, BarChart2,
  Clock, AlertCircle, CheckCircle2, IndianRupee, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ── Payment Status Badge ───────────────────────────────── */
const PaymentBadge = ({ status }) => {
  if (!status || status === 'not_required') return null;
  const cfg = {
    awaiting_verification: { label: 'Payment Pending', cls: 'bg-amber-100 text-amber-800', icon: <Clock className="w-3 h-3" /> },
    confirmed:             { label: 'Payment Confirmed', cls: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle2 className="w-3 h-3" /> },
    rejected:              { label: 'Payment Rejected', cls: 'bg-red-100 text-red-700', icon: <AlertCircle className="w-3 h-3" /> },
  };
  const c = cfg[status];
  if (!c) return null;
  return (
    <span className={`inline-flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.cls}`}>
      {c.icon}<span>{c.label}</span>
    </span>
  );
};

/* ── Organizer: Pending Payments Panel ─────────────────── */
const PendingPaymentsPanel = ({ eventId, eventTitle, price, onDone }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/registrations/pending-payments/${eventId}`);
      setItems(data.pendingPayments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, [eventId]);

  const handleConfirm = async (regId) => {
    setActing(regId);
    try {
      await api.post(`/registrations/payments/${regId}/confirm`, {});
      fetchPending();
    } catch (e) {
      alert(e.message || 'Failed to confirm');
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (regId) => {
    const note = prompt('Rejection reason (optional):') ?? '';
    setActing(regId);
    try {
      await api.post(`/registrations/payments/${regId}/reject`, { note });
      fetchPending();
    } catch (e) {
      alert(e.message || 'Failed to reject');
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 border border-[#E6E4DC] shadow-calm-lg relative max-h-[85vh] flex flex-col">
        <button onClick={onDone} className="absolute top-4 right-4 text-[#64748B] hover:text-[#2D3748] p-1.5 rounded-full bg-[#FAF9F5]">
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-0.5">
          <h3 className="text-base font-bold text-[#2D3748] pr-8">Pending Payments</h3>
          <p className="text-xs text-[#64748B] truncate">{eventTitle} · ₹{price}</p>
        </div>

        <div className="overflow-y-auto flex-1 space-y-3 pr-0.5">
          {loading ? (
            <div className="py-10 text-center">
              <RefreshCw className="w-5 h-5 text-[#5F8670] animate-spin mx-auto" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-[#2D3748]">All clear!</p>
              <p className="text-xs text-[#64748B]">No pending payment verifications.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.registration_id} className="bg-[#FAF9F5] border border-[#E6E4DC] rounded-2xl p-3.5 space-y-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-[#2D3748]">{item.attendee_name}</p>
                  <p className="text-xs text-[#64748B]">{item.attendee_email}</p>
                  <p className="text-[10px] text-[#94A3B8]">
                    Requested: {new Date(item.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleConfirm(item.registration_id)}
                    disabled={acting === item.registration_id}
                    className="flex-1 bg-[#5F8670] hover:bg-[#486856] disabled:opacity-60 text-white text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{acting === item.registration_id ? '...' : 'Confirm Payment'}</span>
                  </button>
                  <button
                    onClick={() => handleReject(item.registration_id)}
                    disabled={acting === item.registration_id}
                    className="flex-1 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-700 text-xs font-bold py-2 rounded-xl border border-red-200 transition-colors flex items-center justify-center space-x-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <button onClick={onDone} className="w-full border border-[#E6E4DC] text-[#64748B] font-semibold py-2 rounded-2xl text-xs hover:bg-[#FAF9F5] transition-colors">
          Close
        </button>
      </div>
    </div>
  );
};

/* ── Main Page ──────────────────────────────────────────── */
export const MyEventsPage = ({ onSelectEvent, onOpenAnalytics }) => {
  const [activeSubTab, setActiveSubTab] = useState('registered');
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [createdEvents, setCreatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [reviewingEvent, setReviewingEvent] = useState(null);
  const [pendingPaymentsEvent, setPendingPaymentsEvent] = useState(null);

  const { user } = useAuth();
  const isOrganizer = user?.role === 'organizer';

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get('/registrations/my-events');
      setRegisteredEvents(data.registeredEvents || []);
      setCreatedEvents(data.createdEvents || []);
    } catch (err) {
      console.error('Failed to load my events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="space-y-4 pb-20">
      
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-[#2D3748]">My Events & Tickets</h2>
        <p className="text-xs text-[#64748B]">Manage your registrations and organized events</p>
      </div>

      {/* Sub Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-[#E6E4DC] flex space-x-1 text-xs font-semibold shadow-calm-sm">
        <button
          onClick={() => setActiveSubTab('registered')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeSubTab === 'registered' ? 'bg-[#5F8670] text-white shadow-xs' : 'text-[#64748B]'
          }`}
        >
          My Tickets ({registeredEvents.length})
        </button>

        {isOrganizer && (
          <button
            onClick={() => setActiveSubTab('created')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeSubTab === 'created' ? 'bg-[#3A7CA5] text-white shadow-xs' : 'text-[#64748B]'
            }`}
          >
            Organized ({createdEvents.length})
          </button>
        )}
      </div>

      {/* Content Feed */}
      {loading ? (
        <div className="py-16 text-center space-y-2">
          <RefreshCw className="w-6 h-6 text-[#5F8670] animate-spin mx-auto" />
          <p className="text-xs text-[#64748B]">Loading your schedule...</p>
        </div>
      ) : activeSubTab === 'registered' ? (
        registeredEvents.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-[#E6E4DC] text-center space-y-2">
            <Ticket className="w-8 h-8 text-[#94A3B8] mx-auto" />
            <h3 className="text-sm font-bold text-[#2D3748]">No registrations yet</h3>
            <p className="text-xs text-[#64748B]">Browse events on Home or Search to RSVP!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {registeredEvents.map((item) => {
              const dateStr = new Date(item.start_time).toLocaleString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              });

              const isWaitlisted = item.registration_status === 'waitlisted';
              const isPendingPayment = item.payment_status === 'awaiting_verification';
              const isRejected = item.payment_status === 'rejected';

              const statusColor = isRejected
                ? 'bg-red-100 text-red-700'
                : isPendingPayment
                  ? 'bg-amber-100 text-amber-800'
                  : isWaitlisted
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800';

              const statusLabel = isRejected
                ? 'rejected'
                : isPendingPayment
                  ? 'pending payment'
                  : item.registration_status;

              return (
                <div
                  key={item.registration_id}
                  className="bg-white rounded-2xl border border-[#E6E4DC] p-4 shadow-calm-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-[#5F8670] bg-[#E8EFEA] px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                      <h3
                        onClick={() => onSelectEvent(item.id)}
                        className="text-base font-bold text-[#2D3748] hover:text-[#5F8670] cursor-pointer"
                      >
                        {item.title}
                      </h3>
                    </div>

                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Payment status badge */}
                  <PaymentBadge status={item.payment_status} />

                  {/* Rejection note */}
                  {isRejected && item.payment_note && (
                    <p className="text-[10px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-2.5 py-1.5">
                      Reason: {item.payment_note}
                    </p>
                  )}

                  <div className="space-y-1 text-xs text-[#64748B]">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-[#5F8670]" />
                      <span>{dateStr}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-[#3A7CA5]" />
                      <span>{item.venue_name}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E6E4DC] flex items-center justify-between">
                    {!isWaitlisted && !isPendingPayment && !isRejected && (
                      <button
                        onClick={() => setReviewingEvent(item)}
                        className="text-xs text-amber-700 font-semibold flex items-center space-x-1 hover:underline"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                        <span>Rate Event</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedTicketId(item.registration_id)}
                      className={`font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition-colors ml-auto ${
                        isPendingPayment
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : isRejected
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-[#3A7CA5] hover:bg-[#2B5B7A] text-white'
                      }`}
                    >
                      {isPendingPayment
                        ? <><Clock className="w-3.5 h-3.5" /><span>Check Payment Status</span></>
                        : isRejected
                          ? <><AlertCircle className="w-3.5 h-3.5" /><span>View Details</span></>
                          : <><QrCode className="w-3.5 h-3.5" /><span>View Ticket QR</span></>
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ─── Created Events tab for Organizers ─── */
        createdEvents.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-[#E6E4DC] text-center space-y-2">
            <Calendar className="w-8 h-8 text-[#94A3B8] mx-auto" />
            <h3 className="text-sm font-bold text-[#2D3748]">No organized events</h3>
            <p className="text-xs text-[#64748B]">Use the Create tab to host your first event!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {createdEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-2xl border border-[#E6E4DC] p-4 shadow-calm-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div onClick={() => onSelectEvent(event.id)} className="cursor-pointer space-y-1">
                    <span className="text-[10px] font-semibold text-[#3A7CA5] bg-[#E8F2F8] px-2 py-0.5 rounded-full">
                      {event.category}
                    </span>
                    <h3 className="text-base font-bold text-[#2D3748] hover:text-[#3A7CA5]">
                      {event.title}
                    </h3>
                  </div>
                  {Number(event.price) > 0 && (
                    <span className="text-xs font-bold text-[#5F8670] bg-[#E8EFEA] px-2.5 py-1 rounded-full">
                      ₹{event.price}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-[#64748B] pt-1 border-t border-[#E6E4DC]">
                  <span>Registered: <strong>{event.confirmed_count || 0} / {event.capacity}</strong></span>
                  
                  <div className="flex items-center space-x-2">
                    {/* Pending Payments button */}
                    {Number(event.price) > 0 && (
                      <button
                        onClick={() => setPendingPaymentsEvent(event)}
                        className="relative bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 shadow-xs transition-colors"
                      >
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span>Payments</span>
                        {Number(event.pending_payments_count) > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                            {event.pending_payments_count}
                          </span>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => onOpenAnalytics(event.id)}
                      className="bg-[#5F8670] hover:bg-[#486856] text-white font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 shadow-xs transition-colors"
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>Analytics</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Ticket Modal */}
      {selectedTicketId && (
        <TicketModal
          registrationId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
        />
      )}

      {/* Review Modal */}
      {reviewingEvent && (
        <ReviewModal
          event={reviewingEvent}
          onClose={() => setReviewingEvent(null)}
          onSuccess={() => fetchData()}
        />
      )}

      {/* Pending Payments Panel (Organizer) */}
      {pendingPaymentsEvent && (
        <PendingPaymentsPanel
          eventId={pendingPaymentsEvent.id}
          eventTitle={pendingPaymentsEvent.title}
          price={pendingPaymentsEvent.price}
          onDone={() => { setPendingPaymentsEvent(null); fetchData(); }}
        />
      )}
    </div>
  );
};
