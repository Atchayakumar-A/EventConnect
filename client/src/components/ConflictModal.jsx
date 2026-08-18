import React from 'react';
import { AlertTriangle, Clock, MapPin, Navigation, X } from 'lucide-react';

export const ConflictModal = ({ conflictData, onConfirmAnyway, onCancel, loading }) => {
  if (!conflictData) return null;

  const hasSpatial = conflictData.hasSpatialConflict && conflictData.spatialConflicts?.length > 0;
  const spatialInfo = hasSpatial ? conflictData.spatialConflicts[0] : null;
  const timeInfo = conflictData.conflictingEvent || (conflictData.timeConflicts ? conflictData.timeConflicts[0] : null);

  const formattedConflictingStart = timeInfo?.existingStartTime ? new Date(timeInfo.existingStartTime).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : '';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-[#E6E4DC] shadow-calm-lg animate-in fade-in zoom-in duration-200">
        
        {/* Header Icon */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
          hasSpatial ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-amber-50 border-amber-200 text-amber-600'
        }`}>
          {hasSpatial ? <Navigation className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-[#2D3748]">
            {hasSpatial ? 'Geographic Travel Conflict' : 'Schedule Time Conflict'}
          </h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            {hasSpatial
              ? 'This event is far from another event on your schedule on the same day.'
              : 'This event overlaps with an existing confirmed event in your schedule.'}
          </p>
        </div>

        {/* Spatial / Time Details Card */}
        {hasSpatial ? (
          <div className="bg-indigo-50/60 rounded-2xl p-3.5 border border-indigo-100 space-y-2 text-xs text-indigo-950">
            <div className="font-bold text-sm text-indigo-900">
              {spatialInfo.title}
            </div>
            
            <div className="flex items-center space-x-2 text-indigo-800">
              <Navigation className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Distance: <strong>{spatialInfo.distanceKm} km</strong> away (Haversine km)</span>
            </div>

            <div className="flex items-center space-x-2 text-indigo-800">
              <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Gap: <strong>{spatialInfo.gapMinutes} mins</strong> (Est. transit: {spatialInfo.requiredTransitMinutes} mins)</span>
            </div>

            <div className="flex items-center space-x-2 text-indigo-700 text-[11px] pt-1 border-t border-indigo-200">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{spatialInfo.targetVenueName} $\rightarrow$ {spatialInfo.venueName}</span>
            </div>
          </div>
        ) : timeInfo ? (
          <div className="bg-[#FAF9F5] rounded-2xl p-3.5 border border-[#E6E4DC] space-y-2 text-xs">
            <div className="font-semibold text-[#2D3748] text-sm">
              {timeInfo.title}
            </div>
            
            <div className="flex items-center space-x-2 text-[#64748B]">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{formattedConflictingStart}</span>
            </div>

            <div className="flex items-center space-x-2 text-[#64748B]">
              <MapPin className="w-3.5 h-3.5 text-[#3A7CA5] shrink-0" />
              <span className="truncate">{timeInfo.venueName}</span>
            </div>
          </div>
        ) : null}

        {/* Question */}
        <p className="text-xs text-center font-medium text-[#2D3748]">
          Do you want to register for this event anyway?
        </p>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            onClick={onConfirmAnyway}
            disabled={loading}
            className="w-full bg-[#5F8670] hover:bg-[#486856] text-white font-semibold py-2.5 rounded-2xl text-xs shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Confirming...' : 'Yes, Register Anyway'}
          </button>

          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full bg-[#F4F3ED] hover:bg-[#E6E4DC] text-[#64748B] font-semibold py-2.5 rounded-2xl text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
