import React, { useEffect, useState } from 'react';
import {
    CheckCircle2, AlertCircle, XCircle, QrCode, UserCheck, RefreshCw
} from 'lucide-react';

/**
 * QrScanResult — Full-screen color-coded result modal after each QR scan.
 * Auto-returns to scanning after 3 s, or user can tap "Scan Next".
 */
export const QrScanResult = ({ result, checkedInCount, totalConfirmed, onScanNext }) => {
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) {
                    clearInterval(timer);
                    onScanNext();
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [onScanNext]);

    const isSuccess = result.success;
    const code = result.code;

    // Color scheme
    const scheme = isSuccess
        ? { bg: '#ECFDF5', border: '#6EE7B7', icon: <CheckCircle2 className="w-14 h-14 text-emerald-500" />, titleColor: '#065F46' }
        : { bg: '#FEF2F2', border: '#FCA5A5', icon: <XCircle className="w-14 h-14 text-red-500" />, titleColor: '#991B1B' };

    // Human-readable message overrides by code
    const messageMap = {
        already_checked_in: 'Already Checked In',
        wrong_event: 'Wrong Event',
        not_confirmed: 'Not Confirmed',
        not_found: 'Invalid Ticket',
        invalid_signature: 'Invalid / Tampered Ticket',
        server_error: 'Server Error',
        forbidden: 'Access Denied',
    };
    const headline = isSuccess ? '✓ Checked In!' : (messageMap[code] || 'Check-In Failed');

    // Detail lines
    const details = [];
    if (isSuccess) {
        if (result.attendeeName) details.push({ label: 'Attendee', value: result.attendeeName, bold: true });
        if (result.eventTitle) details.push({ label: 'Event', value: result.eventTitle });
        if (result.teamName) details.push({ label: 'Team', value: result.teamName });
        if (result.checked_in_at) {
            const t = new Date(result.checked_in_at);
            details.push({ label: 'Time', value: t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) });
        }
    } else {
        if (result.reason) details.push({ label: 'Reason', value: result.reason });
        if (code === 'already_checked_in' && result.checked_in_at) {
            const t = new Date(result.checked_in_at);
            details.push({ label: 'Checked In At', value: t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) });
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
            style={{ background: scheme.bg }}
        >
            {/* Animated icon */}
            <div
                className={`w-28 h-28 rounded-full flex items-center justify-center border-4 mb-5 ${isSuccess ? 'border-emerald-300' : 'border-red-300'
                    }`}
                style={{ background: 'white' }}
            >
                {scheme.icon}
            </div>

            {/* Headline */}
            <h2 className="text-3xl font-extrabold mb-4 text-center" style={{ color: scheme.titleColor }}>
                {headline}
            </h2>

            {/* Detail Cards */}
            {details.length > 0 && (
                <div className="w-full max-w-xs space-y-2 mb-6">
                    {details.map(({ label, value, bold }) => (
                        <div
                            key={label}
                            className="bg-white rounded-xl px-4 py-2.5 flex justify-between items-center border"
                            style={{ borderColor: scheme.border }}
                        >
                            <span className="text-xs font-semibold text-[#64748B]">{label}</span>
                            <span className={`text-sm ${bold ? 'font-extrabold text-[#2D3748]' : 'font-medium text-[#64748B]'}`}>
                                {value}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Running counter (on success) */}
            {isSuccess && (
                <div
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-full text-white text-sm font-bold mb-6"
                    style={{ background: 'var(--accent)' }}
                >
                    <UserCheck className="w-4 h-4" />
                    <span>{checkedInCount} of {totalConfirmed} checked in</span>
                </div>
            )}

            {/* Scan Next button */}
            <button
                onClick={onScanNext}
                className="flex items-center space-x-2 px-8 py-3.5 rounded-2xl text-white font-bold text-base shadow-md transition-transform hover:scale-105"
                style={{ background: isSuccess ? '#059669' : scheme.titleColor }}
            >
                <QrCode className="w-5 h-5" />
                <span>Scan Next ({countdown}s)</span>
            </button>
        </div>
    );
};
