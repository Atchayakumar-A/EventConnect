import React, { useState } from 'react';
import { api } from '../utils/api';
import { PlusCircle, Calendar, MapPin, IndianRupee, Image, Users, CheckCircle2 } from 'lucide-react';

const CATEGORIES = [
  'Music & Concerts',
  'Technology & Workshops',
  'Sports & Fitness',
  'Food & Drink',
  'Arts & Culture',
  'Business & Networking',
  'Comedy & Entertainment',
  'Education & Learning',
  'Community & Charity',
  'Festivals & Celebrations'
];

export const CreateEventPage = ({ onCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueLat, setVenueLat] = useState('12.9716');
  const [venueLng, setVenueLng] = useState('77.5946');
  const [capacity, setCapacity] = useState('50');
  const [price, setPrice] = useState('0');
  const [upiId, setUpiId] = useState('');
  const [bannerUrl, setBannerUrl] = useState('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80');
  const [participationMode, setParticipationMode] = useState('both');
  const [teamLockTime, setTeamLockTime] = useState('');
  const [teamRequired, setTeamRequired] = useState(true);
  const [maxTeamSize, setMaxTeamSize] = useState('4');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/events', {
        title,
        description,
        category,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        venue_name: venueName,
        venue_lat: parseFloat(venueLat) || 0,
        venue_lng: parseFloat(venueLng) || 0,
        capacity: parseInt(capacity) || 50,
        price: parseFloat(price) || 0,
        organizer_upi_id: parseFloat(price) > 0 ? upiId : null,
        banner_url: bannerUrl,
        team_required: teamRequired || participationMode !== 'solo_only',
        max_team_size: parseInt(maxTeamSize) || 4,
        participation_mode: participationMode,
        team_lock_time: teamLockTime ? new Date(teamLockTime).toISOString() : null
      });

      setSuccess('Event created successfully!');
      setTimeout(() => {
        onCreated();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-[#2D3748]">Create New Event</h2>
        <p className="text-xs text-[#64748B]">Fill out the details below to host your event</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-5 rounded-3xl border border-[#E6E4DC] shadow-calm-sm space-y-4 text-xs">

        {/* Title */}
        <div className="space-y-1">
          <label className="font-semibold text-[#2D3748] block">Event Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Next-Gen Tech Summit 2026"
            className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E6E4DC] focus:outline-none focus:border-[#5F8670] bg-[#FAF9F5]"
          />
        </div>

        {/* Category */}
        <div className="space-y-1">
          <label className="font-semibold text-[#2D3748] block">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E6E4DC] focus:outline-none focus:border-[#5F8670] bg-[#FAF9F5]"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="font-semibold text-[#2D3748] block">Description</label>
          <textarea
            rows="3"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide a comprehensive summary of the event..."
            className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E6E4DC] focus:outline-none focus:border-[#5F8670] bg-[#FAF9F5]"
          ></textarea>
        </div>

        {/* Timings */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-semibold text-[#2D3748] block">Start Date & Time</label>
            <input
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl border border-[#E6E4DC] focus:outline-none focus:border-[#5F8670] bg-[#FAF9F5]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#2D3748] block">End Date & Time</label>
            <input
              type="datetime-local"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl border border-[#E6E4DC] focus:outline-none focus:border-[#5F8670] bg-[#FAF9F5]"
            />
          </div>
        </div>

        {/* Venue details */}
        <div className="space-y-1">
          <label className="font-semibold text-[#2D3748] block">Venue Name</label>
          <input
            type="text"
            required
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            placeholder="e.g. City Tech Convention Center, Hall A"
            className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E6E4DC] focus:outline-none focus:border-[#5F8670] bg-[#FAF9F5]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-semibold text-[#2D3748] block">Capacity</label>
            <input
              type="number"
              min="1"
              required
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E6E4DC] focus:outline-none focus:border-[#5F8670] bg-[#FAF9F5]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#2D3748] block">Ticket Price (₹)</label>
            <input
              type="number"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0 for free"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E6E4DC] focus:outline-none focus:border-[#5F8670] bg-[#FAF9F5]"
            />
          </div>
        </div>

        {/* UPI ID — shown only for paid events */}
        {parseFloat(price) > 0 && (
          <div className="space-y-1">
            <label className="font-semibold text-[#2D3748] block">
              Your UPI ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required={parseFloat(price) > 0}
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. yourname@upi or 98765@bank"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E6E4DC] focus:outline-none focus:border-[#3A7CA5] bg-[#FAF9F5]"
            />
            <p className="text-[10px] text-[#94A3B8]">Attendees will send payment to this UPI ID before you confirm their ticket.</p>
          </div>
        )}

        {/* Participation Mode & Team Settings */}
        <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#E6E4DC] space-y-3">
          <div className="space-y-1">
            <label className="font-bold text-[#2D3748] block">Participation Mode</label>
            <select
              value={participationMode}
              onChange={(e) => {
                setParticipationMode(e.target.value);
                setTeamRequired(e.target.value !== 'solo_only');
              }}
              className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] bg-white font-medium focus:outline-none focus:border-[#5F8670]"
            >
              <option value="solo_only">Solo Participants Only</option>
              <option value="team_only">Team Required Only (Hackathon Mode)</option>
              <option value="both">Both Solo & Team Allowed</option>
            </select>
          </div>

          {participationMode !== 'solo_only' && (
            <div className="pt-2 border-t border-[#E6E4DC] space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#2D3748] block">Max Team Size</label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={maxTeamSize}
                    onChange={(e) => setMaxTeamSize(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#2D3748] block">Team Lock Deadline</label>
                  <input
                    type="datetime-local"
                    value={teamLockTime}
                    onChange={(e) => setTeamLockTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#5F8670] hover:bg-[#486856] text-white font-bold py-3 rounded-2xl text-xs shadow-sm transition-all flex items-center justify-center space-x-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{loading ? 'Publishing Event...' : 'Publish Event'}</span>
        </button>
      </form>
    </div>
  );
};
