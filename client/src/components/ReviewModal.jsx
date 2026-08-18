import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { api } from '../utils/api';

export const StarRating = ({ rating, setRating, readOnly = false, size = 'md' }) => {
  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => setRating && setRating(star)}
          className={`transition-colors ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <Star
            className={`${iconSizes[size] || 'w-4 h-4'} ${
              star <= Math.round(rating)
                ? 'text-amber-400 fill-amber-400'
                : 'text-[#E6E4DC]'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export const ReviewModal = ({ event, onClose, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/reviews', {
        event_id: event.id,
        rating,
        comment
      });

      alert('Thank you for rating this event!');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

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
          <h3 className="text-base font-bold text-[#2D3748]">Rate Event</h3>
          <p className="text-xs text-[#64748B] line-clamp-1">{event.title}</p>
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-2xl text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center justify-center space-y-2 py-2 bg-[#FAF9F5] rounded-2xl border border-[#E6E4DC]">
            <StarRating rating={rating} setRating={setRating} size="lg" />
            <span className="text-xs font-semibold text-[#5F8670]">
              {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1]}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-semibold text-[#2D3748] block">Your Feedback (Optional)</label>
            <textarea
              rows="3"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              className="w-full p-3 rounded-2xl border border-[#E6E4DC] focus:outline-none focus:border-[#5F8670] bg-[#FAF9F5]"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5F8670] hover:bg-[#486856] text-white font-bold py-3 rounded-2xl text-xs shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>

      </div>
    </div>
  );
};
