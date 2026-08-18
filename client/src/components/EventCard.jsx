import React from 'react';
import { Calendar, MapPin, Sparkles, Users, IndianRupee } from 'lucide-react';

export const EventCard = ({ event, onClick, isRecommended }) => {
  const formattedDate = new Date(event.start_time).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const priceText = Number(event.price) === 0 ? 'Free' : `₹${event.price}`;
  const confirmedCount = event.confirmed_count || 0;
  const isFull = confirmedCount >= event.capacity;

  const modeBadgeText = event.participation_mode === 'team_only'
    ? 'Team Required'
    : event.participation_mode === 'both'
    ? 'Solo or Team'
    : event.team_required
    ? 'Team Required'
    : null;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-2xl border border-[#E6E4DC] overflow-hidden shadow-calm-sm hover:shadow-calm-md hover:border-[#5F8670]/40 transition-all duration-300 transform hover:-translate-y-0.5"
    >
      {/* Banner Image */}
      <div className="relative h-44 w-full bg-[#F4F3ED] overflow-hidden">
        <img
          src={event.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Category Chip */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-[#2D3748] shadow-sm">
          {event.category}
        </div>

        {/* Team Mode Badge */}
        {modeBadgeText && (
          <div className="absolute bottom-3 left-3 bg-[#E8F2F8] text-[#3A7CA5] backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold border border-[#3A7CA5]/30 shadow-sm flex items-center space-x-1">
            <Users className="w-3 h-3 text-[#3A7CA5]" />
            <span>{modeBadgeText}</span>
          </div>
        )}

        {/* Price Tag */}
        <div className="absolute top-3 right-3 bg-[#5F8670] text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
          {priceText}
        </div>

        {/* Recommendation Score Badge */}
        {isRecommended && event.matchScore > 0 && (
          <div className="absolute bottom-3 right-3 bg-[#3A7CA5] text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 shadow-sm">
            <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
            <span>{event.matchScore}% Match</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2.5">
        {/* Recommendation Rationale if available */}
        {isRecommended && event.recommendationRationale && (
          <div className="bg-[#E8F2F8] text-[#2B5B7A] text-[11px] font-medium px-2.5 py-1 rounded-xl flex items-start space-x-1.5 border border-[#3A7CA5]/20">
            <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#3A7CA5]" />
            <span className="leading-snug">{event.recommendationRationale}</span>
          </div>
        )}

        <h3 className="text-base font-bold text-[#2D3748] line-clamp-1 group-hover:text-[#5F8670] transition-colors">
          {event.title}
        </h3>

        <div className="space-y-1.5 text-xs text-[#64748B]">
          <div className="flex items-center space-x-2">
            <Calendar className="w-3.5 h-3.5 text-[#5F8670] shrink-0" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center space-x-2">
            <MapPin className="w-3.5 h-3.5 text-[#3A7CA5] shrink-0" />
            <span className="truncate">{event.venue_name}</span>
          </div>
        </div>

        {/* Capacity & Status */}
        <div className="pt-2 border-t border-[#E6E4DC] flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-[#64748B]">
            <Users className="w-3.5 h-3.5" />
            <span>{confirmedCount} / {event.capacity} registered</span>
          </div>

          {isFull ? (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Waitlist Only
            </span>
          ) : (
            <span className="text-xs font-medium text-[#5F8670]">
              Seats available
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
