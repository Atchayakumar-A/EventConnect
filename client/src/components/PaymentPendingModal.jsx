import React, { useState } from 'react';
import { X, IndianRupee, Copy, CheckCircle2, Clock, AlertCircle, Smartphone } from 'lucide-react';

/**
 * PaymentPendingModal
 * Shown after a user registers for a paid event.
 * Displays UPI payment details and instructions.
 * Props:
 *   registrationId  — the new registration ID
 *   event           — the event object (price, title, organizer_upi_id)
 *   upiId           — organizer's UPI ID
 *   amount          — ticket price (₹)
 *   onClose         — close callback
 */
export const PaymentPendingModal = ({ registrationId, event, upiId, amount, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  // Build a UPI deep-link intent (works on Android with GPay/PhonePe)
  const upiLink = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(event?.organizer_name || 'Organizer')}&am=${amount}&cu=INR&tn=${encodeURIComponent('EventConnect: ' + (event?.title || 'Event'))}`
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-6 space-y-5 border border-[#E6E4DC] shadow-2xl relative animate-in slide-in-from-bottom sm:zoom-in duration-300">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#64748B] hover:text-[#2D3748] p-1.5 rounded-full bg-[#FAF9F5] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
            <IndianRupee className="w-7 h-7 text-amber-600" />
          </div>
          <h2 className="text-lg font-bold text-[#2D3748]">Complete Payment</h2>
          <p className="text-xs text-[#64748B]">
            Your spot is reserved. Complete UPI payment so the organizer can confirm your ticket.
          </p>
        </div>

        {/* Amount Banner */}
        <div className="bg-gradient-to-r from-[#5F8670] to-[#3A7CA5] text-white rounded-2xl p-4 text-center space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Amount to Pay</p>
          <p className="text-3xl font-extrabold">₹{amount}</p>
          <p className="text-xs opacity-80 truncate">{event?.title}</p>
        </div>

        {/* UPI ID */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#2D3748] uppercase tracking-wide">Pay to UPI ID</p>
          <div className="flex items-center justify-between bg-[#FAF9F5] border border-[#E6E4DC] rounded-2xl px-4 py-3">
            <span className="text-sm font-mono font-bold text-[#3A7CA5] truncate mr-2">
              {upiId || 'N/A'}
            </span>
            <button
              onClick={handleCopy}
              className={`shrink-0 flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-xl transition-all ${
                copied
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-[#E8F2F8] text-[#3A7CA5] hover:bg-[#d0e9f5]'
              }`}
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2.5 bg-[#FAF9F5] border border-[#E6E4DC] rounded-2xl p-4">
          <p className="text-xs font-bold text-[#2D3748]">How to pay</p>
          {[
            'Open GPay, PhonePe, Paytm or any UPI app',
            `Send exactly ₹${amount} to the UPI ID above`,
            'Add note: "EventConnect — ' + (event?.title || 'Event') + '"',
            'Wait for organizer to verify & confirm your ticket'
          ].map((step, i) => (
            <div key={i} className="flex items-start space-x-2.5 text-xs text-[#64748B]">
              <span className="shrink-0 w-5 h-5 bg-[#5F8670] text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span>{step}</span>
            </div>
          ))}
        </div>

        {/* UPI App Deep Link (mobile convenience) */}
        {upiLink && (
          <a
            href={upiLink}
            className="block w-full bg-[#5F8670] hover:bg-[#486856] text-white font-bold py-3 rounded-2xl text-sm text-center shadow-sm transition-colors flex items-center justify-center space-x-2"
          >
            <Smartphone className="w-4 h-4" />
            <span>Open UPI App to Pay</span>
          </a>
        )}

        {/* Pending notice */}
        <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
          <Clock className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <p>Your ticket QR will be generated <strong>only after</strong> the organizer manually verifies your payment. You'll get a notification once confirmed.</p>
        </div>

        <button
          onClick={onClose}
          className="w-full border border-[#E6E4DC] text-[#64748B] font-semibold py-2.5 rounded-2xl text-xs hover:bg-[#FAF9F5] transition-colors"
        >
          I'll pay later — close
        </button>
      </div>
    </div>
  );
};
