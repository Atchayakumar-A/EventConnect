/**
 * EventConnect - Dual Conflict Detection Engine
 * 1. Time Overlap Verification (startA < endB AND startB < endA)
 * 2. Haversine Spatial Distance & Travel Buffer Conflict Analysis (Phase 3)
 * 
 * NOTE ON PRODUCTION API INTEGRATION:
 * The spatial distance calculation uses pure Haversine geodesic math with a linear transit buffer estimate (20 min / 5km).
 * In a full production version, this linear estimate would be replaced with live Google Maps Distance Matrix API queries.
 */

const { query, get } = require('../config/db');

/**
 * Pure Haversine formula to compute straight-line distance in kilometers
 */
const calculateHaversineDistance = (lat1, lng1, lat2, lng2) => {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 0;

  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Rounded to 1 decimal
};

/**
 * Check if target event overlaps in time OR violates spatial travel buffer with user's existing registrations
 */
const checkTimeConflict = async (userId, targetEventId) => {
  const targetEvent = await get('SELECT id, title, start_time, end_time, venue_name, venue_lat, venue_lng FROM events WHERE id = ?', [targetEventId]);
  if (!targetEvent) {
    throw new Error('Target event not found');
  }

  const targetStart = new Date(targetEvent.start_time);
  const targetEnd = new Date(targetEvent.end_time);

  // Fetch all active confirmed or checked-in registrations for user with event details
  const sql = `
    SELECT e.id as event_id, e.title, e.start_time, e.end_time, e.venue_name, e.venue_lat, e.venue_lng, r.id as registration_id
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    WHERE r.user_id = ? AND r.status IN ('confirmed', 'checked_in') AND e.status = 'active' AND e.id != ?
  `;

  const userRegs = await query(sql, [userId, targetEventId]);

  const timeConflicts = [];
  const spatialConflicts = [];

  for (const reg of userRegs.rows) {
    const existingStart = new Date(reg.start_time);
    const existingEnd = new Date(reg.end_time);

    // 1. Time Overlap Condition: startA < endB AND startB < endA
    if (targetStart < existingEnd && existingStart < targetEnd) {
      timeConflicts.push({
        conflictingEventId: reg.event_id,
        title: reg.title,
        venueName: reg.venue_name,
        existingStartTime: reg.start_time,
        existingEndTime: reg.end_time,
        targetStartTime: targetEvent.start_time,
        targetEndTime: targetEvent.end_time
      });
    }

    // 2. Same-Day Spatial Travel Buffer Analysis (Haversine)
    const isSameDay = targetStart.toDateString() === existingStart.toDateString();

    if (isSameDay && reg.venue_lat && reg.venue_lng && targetEvent.venue_lat && targetEvent.venue_lng) {
      const distanceKm = calculateHaversineDistance(
        targetEvent.venue_lat,
        targetEvent.venue_lng,
        reg.venue_lat,
        reg.venue_lng
      );

      // Threshold: > 10 km straight-line distance
      if (distanceKm > 10) {
        // Calculate gap between events in minutes
        let gapMs = 0;
        if (targetStart >= existingEnd) {
          gapMs = targetStart - existingEnd;
        } else if (existingStart >= targetEnd) {
          gapMs = existingStart - targetEnd;
        }

        const gapMinutes = Math.round(gapMs / (1000 * 60));
        // Estimated transit time: 20 minutes per 5 km (simple linear transit estimate)
        const requiredTransitMinutes = Math.round((distanceKm / 5) * 20);

        if (gapMinutes < requiredTransitMinutes) {
          spatialConflicts.push({
            conflictingEventId: reg.event_id,
            title: reg.title,
            venueName: reg.venue_name,
            targetVenueName: targetEvent.venue_name,
            distanceKm,
            gapMinutes,
            requiredTransitMinutes
          });
        }
      }
    }
  }

  return {
    hasConflict: timeConflicts.length > 0 || spatialConflicts.length > 0,
    hasTimeConflict: timeConflicts.length > 0,
    hasSpatialConflict: spatialConflicts.length > 0,
    conflicts: timeConflicts.concat(spatialConflicts),
    timeConflicts,
    spatialConflicts,
    targetEvent
  };
};

module.exports = { checkTimeConflict, calculateHaversineDistance };
