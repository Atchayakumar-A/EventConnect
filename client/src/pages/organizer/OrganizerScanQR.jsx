import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';
import { QrScanResult } from '../../components/QrScanResult';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
    QrCode, Camera, ChevronDown, RefreshCw, UserCheck
} from 'lucide-react';

export const OrganizerScanQR = ({ preSelectedEventId }) => {
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState(preSelectedEventId || '');
    const [eventsLoading, setEventsLoading] = useState(true);
    const [cameraActive, setCameraActive] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [counter, setCounter] = useState({ checkedInCount: 0, totalConfirmed: 0 });
    const scannerRef = useRef(null);

    // Load events
    useEffect(() => {
        const load = async () => {
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
        load();
    }, []);

    // Fetch counter when event changes
    useEffect(() => {
        if (!selectedEventId) return;
        const fetchCounter = async () => {
            try {
                const data = await api.get(`/checkin/counter/${selectedEventId}`);
                setCounter({ checkedInCount: data.checkedInCount, totalConfirmed: data.totalConfirmed });
            } catch (err) { /* silent */ }
        };
        fetchCounter();
    }, [selectedEventId, scanResult]);

    // Camera scanner
    useEffect(() => {
        if (!cameraActive) return;
        const scanner = new Html5QrcodeScanner(
            'qr-reader-organizer',
            { fps: 10, qrbox: { width: 220, height: 220 } },
            false
        );
        scanner.render(async (decodedText) => {
            scanner.clear().catch(() => { });
            scannerRef.current = null;
            setCameraActive(false);
            await handleVerify(decodedText);
        }, () => { });
        scannerRef.current = scanner;
        return () => {
            scanner.clear().catch(() => { });
        };
    }, [cameraActive, selectedEventId]);

    const handleVerify = async (qrToken) => {
        if (!selectedEventId || !qrToken?.trim()) return;
        setProcessing(true);
        try {
            const data = await api.post('/checkin/verify', {
                qrToken: qrToken.trim(),
                eventId: Number(selectedEventId),
            });
            setScanResult({
                ...data,
                checkedInCount: data.checkedInCount,
                totalConfirmed: data.totalConfirmed,
            });
        } catch (err) {
            // API returns error body as err.data
            setScanResult({
                success: false,
                code: err.data?.code || 'server_error',
                reason: err.data?.reason || err.message || 'Check-in failed',
                checked_in_at: err.data?.checked_in_at,
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleScanNext = () => {
        setScanResult(null);
        setCameraActive(true);
    };

    const selectedEvent = events.find(e => String(e.id) === String(selectedEventId));

    // Show full-screen result if scan just happened
    if (scanResult) {
        return (
            <QrScanResult
                result={scanResult}
                checkedInCount={scanResult.checkedInCount ?? counter.checkedInCount}
                totalConfirmed={scanResult.totalConfirmed ?? counter.totalConfirmed}
                onScanNext={handleScanNext}
            />
        );
    }

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-extrabold text-[#2D3748]">Scan QR</h1>
                <p className="text-sm text-[#94A3B8] mt-0.5">Scan attendee QR codes to check them in</p>
            </div>

            {/* Event Selector */}
            {eventsLoading ? (
                <div className="h-10 bg-white border border-[#E6E4DC] rounded-xl animate-pulse" />
            ) : (
                <div className="relative">
                    <select
                        value={selectedEventId}
                        onChange={(e) => { setSelectedEventId(e.target.value); setCameraActive(false); }}
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

            {/* Counter Strip */}
            {selectedEventId && (
                <div
                    className="flex items-center justify-center space-x-2 py-3 rounded-2xl text-white font-bold text-sm"
                    style={{ background: 'var(--accent)' }}
                >
                    <UserCheck className="w-4 h-4" />
                    <span>{counter.checkedInCount} of {counter.totalConfirmed} checked in</span>
                </div>
            )}

            {/* Camera / Scanner area */}
            {selectedEventId && (
                <div className="bg-white border border-[#E6E4DC] rounded-2xl p-4 space-y-4">
                    {cameraActive ? (
                        <div className="space-y-3">
                            <div id="qr-reader-organizer" className="w-full rounded-xl overflow-hidden border border-[#E6E4DC]" />
                            <button
                                onClick={() => { setCameraActive(false); if (scannerRef.current) scannerRef.current.clear().catch(() => { }); }}
                                className="w-full py-2 rounded-xl text-xs font-semibold text-[#64748B] bg-[#F4F3ED] hover:bg-[#E6E4DC] transition-colors"
                            >
                                Stop Camera
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setCameraActive(true)}
                            disabled={processing}
                            className="w-full flex items-center justify-center space-x-2 py-4 rounded-2xl text-white font-bold text-sm transition-transform hover:scale-[1.02] disabled:opacity-60"
                            style={{ background: 'var(--accent)' }}
                        >
                            <Camera className="w-5 h-5" />
                            <span>{processing ? 'Processing...' : 'Open Camera to Scan'}</span>
                            {processing && <RefreshCw className="w-4 h-4 animate-spin ml-1" />}
                        </button>
                    )}

                    {/* Manual entry fallback */}
                    <form
                        onSubmit={async (e) => { e.preventDefault(); const v = e.target.token.value; await handleVerify(v); e.target.reset(); }}
                        className="pt-3 border-t border-[#F4F3ED] space-y-2"
                    >
                        <label className="text-xs font-semibold text-[#64748B] block">Or paste QR token manually</label>
                        <div className="flex space-x-2">
                            <input
                                name="token"
                                placeholder="Paste QR token string..."
                                className="flex-1 text-xs px-3 py-2 rounded-xl border border-[#E6E4DC] bg-[#FAF9F5] focus:outline-none focus:border-[#C07D3A] font-mono"
                            />
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-3 py-2 rounded-xl text-white text-xs font-bold flex items-center space-x-1 disabled:opacity-60"
                                style={{ background: 'var(--accent)' }}
                            >
                                <QrCode className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
