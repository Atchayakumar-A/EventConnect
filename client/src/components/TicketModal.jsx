import React, { useEffect, useState } from 'react';
import { X, Calendar, MapPin, QrCode, CheckCircle, Clock, AlertCircle, IndianRupee } from 'lucide-react';
import { api } from '../utils/api';

export const TicketModal = ({ registrationId, onClose }) => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!registrationId) return;

    const fetchTicket = async () => {
      try {
        const data = await api.get(`/registrations/${registrationId}/ticket`);
        setTicket(data);
      } catch (err) {
        console.error('Failed to load ticket details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [registrationId]);

  if (!registrationId) return null;

  const paymentStatus = ticket?.payment_status;
  const isAwaiting = paymentStatus === 'awaiting_verification';
  const isRejected = paymentStatus === 'rejected';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-[#E6E4DC] shadow-calm-lg relative animate-in fade-in zoom-in duration-200">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#64748B] hover:text-[#2D3748] p-1.5 rounded-full bg-[#FAF9F5]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1 pt-1">
          {isAwaiting ? (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              <Clock className="w-3.5 h-3.5" />
              <span>Payment Pending Verification</span>
            </div>
          ) : isRejected ? (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Payment Rejected</span>
            </div>
          ) : (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8EFEA] text-[#5F8670]">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="capitalize">{ticket?.status || 'Confirmed'} Ticket</span>
            </div>
          )}
          <h2 className="text-lg font-bold text-[#2D3748]">{ticket?.title || 'Event Ticket'}</h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#64748B]">
            Loading ticket...
          </div>
        ) : ticket ? (
          <div className="space-y-4">
            {/* QR Code — only if payment confirmed (or free event) */}
            {isAwaiting ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center space-y-3">
                <Clock className="w-10 h-10 text-amber-500 mx-auto" />
                <div>
                  <p className="text-sm font-bold text-amber-800">Awaiting Payment Verification</p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    The organizer needs to verify your UPI payment. Your QR ticket will appear here once confirmed.
                  </p>
                </div>
                {ticket.organizer_upi_id && (
                  <div className="bg-white border border-amber-200 rounded-xl p-2.5 text-xs text-[#64748B]">
                    <span className="font-semibold">Pay ₹{ticket.price} → </span>
                    <span className="font-mono text-[#3A7CA5]">{ticket.organizer_upi_id}</span>
                  </div>
                )}
              </div>
            ) : isRejected ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center space-y-2">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                <p className="text-sm font-bold text-red-700">Payment Not Verified</p>
                {ticket.payment_note && (
                  <p className="text-xs text-red-600 bg-white border border-red-200 rounded-xl p-2.5">
                    Reason: {ticket.payment_note}
                  </p>
                )}
                <p className="text-xs text-red-500">Please contact the organizer to resolve this.</p>
              </div>
            ) : (
              /* Confirmed — show QR */
              <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-[#E6E4DC] flex flex-col items-center justify-center space-y-2">
                {ticket.qrCodeDataUrl ? (
                  <>
                    <img
                      src={ticket.qrCodeDataUrl}
                      alt="Ticket QR Code"
                      className="w-48 h-48 rounded-xl shadow-xs border border-[#E6E4DC]"
                    />
                    <span className="text-[10px] text-[#94A3B8] font-mono tracking-wider">
                      TOKEN: {ticket.qr_token ? ticket.qr_token.slice(-16) : 'SIGNED_HMAC'}
                    </span>
                  </>
                ) : (
                  <div className="py-6 text-center space-y-1">
                    <QrCode className="w-8 h-8 text-[#94A3B8] mx-auto" />
                    <p className="text-xs text-[#94A3B8]">QR not available</p>
                  </div>
                )}
              </div>
            )}

            {/* Event Info Card */}
            <div className="space-y-2 text-xs text-[#64748B] bg-[#F4F3ED] p-3.5 rounded-2xl border border-[#E6E4DC]">
              <div className="flex items-center space-x-2">
                <Calendar className="w-3.5 h-3.5 text-[#5F8670] shrink-0" />
                <span>
                  {new Date(ticket.start_time).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-[#3A7CA5] shrink-0" />
                <span className="truncate">{ticket.venue_name}</span>
              </div>

              <div className="pt-2 border-t border-[#E6E4DC] text-[11px] text-[#2D3748]">
                <strong>Attendee:</strong> {ticket.attendee_name} ({ticket.attendee_email})
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-red-500">
            Failed to load ticket information.
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full bg-[#5F8670] hover:bg-[#486856] text-white font-semibold py-2.5 rounded-2xl text-xs shadow-sm transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
