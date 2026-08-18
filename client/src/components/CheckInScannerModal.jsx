import React, { useState, useEffect, useRef } from 'react';
import { QrCode, CheckCircle2, AlertCircle, X, Camera, RefreshCw } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { api } from '../utils/api';

export const CheckInScannerModal = ({ event, onClose }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { success: boolean, message/reason, attendeeName, eventTitle }
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef(null);

  const handleVerify = async (tokenToVerify) => {
    const targetToken = tokenToVerify || tokenInput;
    if (!targetToken || !targetToken.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const data = await api.post('/checkin/verify', {
        qrToken: targetToken.trim(),
        eventId: event.id
      });
      setResult(data);
      setTokenInput('');
    } catch (err) {
      setResult({
        success: false,
        reason: err.data?.reason || err.message || 'Check-in verification failed'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cameraActive) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 200, height: 200 } },
        /* verbose= */ false
      );

      scanner.render((decodedText) => {
        scanner.clear();
        setCameraActive(false);
        handleVerify(decodedText);
      }, (error) => {
        // Camera scan errors ignored during active scanning
      });

      scannerRef.current = scanner;

      return () => {
        scanner.clear().catch(() => {});
      };
    }
  }, [cameraActive]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-[#E6E4DC] shadow-calm-lg relative animate-in fade-in zoom-in duration-150">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#64748B] hover:text-[#2D3748] p-1 rounded-full bg-[#FAF9F5]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1 pt-1">
          <div className="w-10 h-10 rounded-2xl bg-[#E8EFEA] text-[#5F8670] flex items-center justify-center mx-auto shadow-xs">
            <Camera className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-[#2D3748]">Scan Tickets</h3>
          <p className="text-xs text-[#64748B] line-clamp-1">{event.title}</p>
        </div>

        {/* Verification Result Feedback */}
        {result && (
          <div
            className={`p-4 rounded-2xl border text-xs space-y-1.5 animate-in zoom-in duration-200 text-center ${
              result.success
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-1.5 font-bold text-sm">
              {result.success ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Check-In Verified!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span>Check-In Failed</span>
                </>
              )}
            </div>

            <p className="text-xs font-medium">
              {result.success ? result.message : result.reason}
            </p>

            {result.success && (
              <div className="pt-1.5 border-t border-emerald-200 text-[11px] font-semibold text-emerald-800">
                Attendee: {result.attendeeName || result.attendee?.name || 'Verified Attendee'}
              </div>
            )}
          </div>
        )}

        {/* Camera Scanner View container */}
        {cameraActive ? (
          <div className="space-y-2">
            <div id="reader" className="w-full rounded-2xl overflow-hidden border border-[#E6E4DC]"></div>
            <button
              onClick={() => setCameraActive(false)}
              className="w-full bg-[#F4F3ED] text-[#64748B] text-xs font-semibold py-2 rounded-xl"
            >
              Cancel Camera Scan
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCameraActive(true)}
            className="w-full bg-[#E8EFEA] hover:bg-[#5F8670] hover:text-white text-[#5F8670] text-xs font-bold py-2.5 rounded-2xl border border-[#5F8670]/30 transition-colors flex items-center justify-center space-x-1.5"
          >
            <Camera className="w-4 h-4" />
            <span>Open Device Camera Scanner</span>
          </button>
        )}

        {/* Manual Payload Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="space-y-3 pt-1 border-t border-[#E6E4DC]"
        >
          <div className="space-y-1 text-xs">
            <label className="font-semibold text-[#2D3748] block">Or Enter Ticket Token Manually</label>
            <textarea
              rows="2"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste attendee QR token string..."
              className="w-full p-2.5 rounded-2xl border border-[#E6E4DC] text-[11px] font-mono focus:outline-none focus:border-[#5F8670] bg-[#FAF9F5]"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading || !tokenInput.trim()}
            className="w-full bg-[#5F8670] hover:bg-[#486856] text-white font-bold py-3 rounded-2xl text-xs shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                <span>Verify Ticket Token</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
