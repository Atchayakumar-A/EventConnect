import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { ConflictModal } from '../components/ConflictModal';
import { TicketModal } from '../components/TicketModal';
import { TeamsTab } from '../components/TeamsTab';
import { StarRating } from '../components/ReviewModal';
import { CheckInScannerModal } from '../components/CheckInScannerModal';
import { PaymentPendingModal } from '../components/PaymentPendingModal';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Calendar, MapPin, Users, IndianRupee, Sparkles, CheckCircle2, AlertCircle, Star, Shield, Camera, Clock } from 'lucide-react';

export const EventDetailPage = ({ eventId, onBack, onRegistrationSuccess }) => {
  const [event, setEvent] = useState(null);
  const [reviewsData, setReviewsData] = useState({ reviews: [], avgRating: 0, reviewCount: 0 });
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const [ticketRegistrationId, setTicketRegistrationId] = useState(null);
  const [paymentData, setPaymentData] = useState(null); // { registrationId, upiId, amount }
  const [showScanner, setShowScanner] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { user } = useAuth();

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/events/${eventId}`);
      setEvent(data);

      const revs = await api.get(`/reviews/event/${eventId}`);
      setReviewsData(revs);

      // Fire-and-forget implicit interaction logger (page view)
      api.post('/recommendations/interaction', { eventId, actionType: 'viewed' }).catch(() => {});
    } catch (err) {
      setErrorMsg('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchDetails();
  }, [eventId]);

  const handleRegister = async (bypassConflict = false) => {
    setRegistering(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const data = await api.post('/registrations', {
        event_id: eventId,
        bypassConflictWarning: bypassConflict
      });

      setConflictData(null);

      const isPaidFlow = data.registration?.payment_status === 'awaiting_verification';

      if (isPaidFlow) {
        // Show payment instructions screen
        setPaymentData({
          registrationId: data.registration.id,
          upiId: data.registration.upiId,
          amount: data.registration.amount
        });
      } else {
        // Free event — show QR ticket immediately
        setSuccessMsg(data.message);
        if (data.registration?.id) {
          setTicketRegistrationId(data.registration.id);
        }
      }
      fetchDetails();
    } catch (err) {
      if (err.status === 409 && err.data?.conflict) {
        setConflictData(err.data);
      } else {
        setErrorMsg(err.message || 'Registration failed');
      }
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[#64748B]">
        Loading event details...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-xs text-red-500">{errorMsg || 'Event not found'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#5F8670] text-white text-xs font-semibold rounded-2xl"
        >
          Go Back
        </button>
      </div>
    );
  }

  const startDate = new Date(event.start_time).toLocaleString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const endDate = new Date(event.end_time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const priceText = Number(event.price) === 0 ? 'Free' : `₹${event.price}`;
  const confirmedCount = event.confirmed_count || 0;
  const isFull = confirmedCount >= event.capacity;
  const isOrganizer = user?.id === event.organizer_id;

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-200">
      
      {/* Top back button */}
      <button
        onClick={onBack}
        className="flex items-center space-x-1.5 text-xs font-semibold text-[#5F8670] hover:underline pt-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Events</span>
      </button>

      {/* Banner */}
      <div className="relative h-56 w-full rounded-3xl overflow-hidden bg-[#F4F3ED] shadow-calm-sm">
        <img
          src={event.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#2D3748]">
          {event.category}
        </div>
        <div className="absolute top-4 right-4 bg-[#5F8670] text-white px-3.5 py-1 rounded-full text-xs font-bold shadow-xs">
          {priceText}
        </div>
      </div>

      {/* Title & Metadata */}
      <div className="space-y-3">
        <h1 className="text-xl font-bold text-[#2D3748] leading-tight">
          {event.title}
        </h1>

        <div className="space-y-2 text-xs text-[#64748B] bg-white p-4 rounded-2xl border border-[#E6E4DC]">
          <div className="flex items-start space-x-2.5">
            <Calendar className="w-4 h-4 text-[#5F8670] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-[#2D3748]">{startDate}</div>
              <div className="text-[11px]">Ends around {endDate}</div>
            </div>
          </div>

          <div className="flex items-start space-x-2.5 pt-2 border-t border-[#E6E4DC]">
            <MapPin className="w-4 h-4 text-[#3A7CA5] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-[#2D3748]">{event.venue_name}</div>
              <div className="text-[11px] text-[#94A3B8]">Lat: {event.venue_lat}, Lng: {event.venue_lng}</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#E6E4DC]">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#64748B]" />
              <span>Organized by <strong>{event.organizer_name}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Capacity Progress Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E6E4DC] space-y-2">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-[#2D3748]">Registration Capacity</span>
          <span className="text-[#5F8670] font-bold">{confirmedCount} / {event.capacity}</span>
        </div>
        <div className="w-full h-2.5 bg-[#F4F3ED] rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${isFull ? 'bg-amber-500' : 'bg-[#5F8670]'}`}
            style={{ width: `${Math.min(100, (confirmedCount / event.capacity) * 100)}%` }}
          ></div>
        </div>
        {isFull && (
          <p className="text-[11px] text-amber-700 font-medium bg-amber-50 p-2 rounded-xl border border-amber-200">
            ⚠️ Capacity reached. New registrations will be placed on the waitlist.
          </p>
        )}
      </div>

      {/* Description */}
      <div className="bg-white p-4 rounded-2xl border border-[#E6E4DC] space-y-2">
        <h3 className="text-sm font-bold text-[#2D3748]">About this Event</h3>
        <p className="text-xs text-[#64748B] leading-relaxed whitespace-pre-line">
          {event.description}
        </p>
      </div>

      {/* Team Formation Tab Section if team_required */}
      {Boolean(event.team_required) && (
        <div className="bg-[#FAF9F5] p-4 rounded-3xl border border-[#E6E4DC] space-y-3">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#5F8670]" />
            <div>
              <h3 className="text-sm font-bold text-[#2D3748]">Team Formation Required</h3>
              <p className="text-[11px] text-[#64748B]">Create a team or request to join an existing team (Max {event.max_team_size || 4} members)</p>
            </div>
          </div>

          <TeamsTab eventId={eventId} event={event} />
        </div>
      )}

      {/* Ratings & Reviews Summary */}
      <div className="bg-white p-4 rounded-2xl border border-[#E6E4DC] space-y-3">
        <div className="flex items-center justify-between border-b border-[#E6E4DC] pb-2">
          <h3 className="text-sm font-bold text-[#2D3748]">Attendee Reviews</h3>
          <div className="flex items-center space-x-1.5">
            <StarRating rating={reviewsData.avgRating} readOnly size="sm" />
            <span className="text-xs font-bold text-[#2D3748]">{reviewsData.avgRating}</span>
            <span className="text-[10px] text-[#64748B]">({reviewsData.reviewCount})</span>
          </div>
        </div>

        {reviewsData.reviews.length === 0 ? (
          <p className="text-xs text-[#94A3B8]">No reviews submitted for this event yet.</p>
        ) : (
          <div className="space-y-2">
            {reviewsData.reviews.map(r => (
              <div key={r.id} className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E6E4DC] space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#2D3748]">{r.reviewer_name}</span>
                  <StarRating rating={r.rating} readOnly size="sm" />
                </div>
                {r.comment && <p className="text-[#64748B] text-[11px]">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Messages */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-14 left-0 right-0 p-3 bg-white/90 backdrop-blur-md border-t border-[#E6E4DC] z-30">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#64748B] uppercase font-semibold block">Ticket Price</span>
            <span className="text-base font-bold text-[#2D3748]">{priceText}</span>
          </div>

          {isOrganizer ? (
            <button
              onClick={() => setShowScanner(true)}
              className="bg-[#5F8670] hover:bg-[#486856] text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Attendee QR</span>
            </button>
          ) : (
            <button
              onClick={() => handleRegister(false)}
              disabled={registering}
              className={`px-6 py-3 rounded-2xl text-xs font-bold text-white shadow-sm transition-all ${
                isFull ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#5F8670] hover:bg-[#486856]'
              }`}
            >
              {registering ? 'Processing...' : isFull ? 'Join Waitlist' : 'Register Now'}
            </button>
          )}
        </div>
      </div>

      {/* Organizer QR Scanner Modal */}
      {showScanner && (
        <CheckInScannerModal
          event={event}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Conflict Warning Modal */}
      {conflictData && (
        <ConflictModal
          conflictData={conflictData}
          onConfirmAnyway={() => handleRegister(true)}
          onCancel={() => setConflictData(null)}
          loading={registering}
        />
      )}

      {/* Payment Pending Modal (paid events) */}
      {paymentData && (
        <PaymentPendingModal
          registrationId={paymentData.registrationId}
          event={event}
          upiId={paymentData.upiId}
          amount={paymentData.amount}
          onClose={() => {
            setPaymentData(null);
            onRegistrationSuccess();
          }}
        />
      )}

      {/* QR Code Ticket Modal (free events or after payment confirmed) */}
      {ticketRegistrationId && (
        <TicketModal
          registrationId={ticketRegistrationId}
          onClose={() => {
            setTicketRegistrationId(null);
            onRegistrationSuccess();
          }}
        />
      )}

    </div>
  );
};
