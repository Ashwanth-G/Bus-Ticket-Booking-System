import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import toast from 'react-hot-toast';
import { 
  Calendar, Star, AlertCircle, Loader2, MessageSquare, X 
} from 'lucide-react';

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Review Modal states
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/users/history');
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to load journey history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleOpenReviewModal = (scheduleId) => {
    setSelectedScheduleId(scheduleId);
    setRating(5);
    setComment('');
  };

  const handleCloseReviewModal = () => {
    setSelectedScheduleId(null);
    setRating(5);
    setComment('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please write a review comment.');
      return;
    }

    setReviewSubmitLoading(true);
    try {
      await api.post('/users/reviews', {
        scheduleId: selectedScheduleId,
        rating,
        comment
      });
      toast.success('Thank you for your review!');
      handleCloseReviewModal();
      fetchHistory(); // reload
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error submitting review.');
    } finally {
      setReviewSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 relative">
      <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Booking & Journey History</h2>
      <p className="text-sm text-slate-500 mb-8">Review details of your completed, past, or cancelled journeys.</p>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <AlertCircle className="h-12 w-12 text-slate-350 mx-auto mb-4" />
          <h3 className="font-bold text-xl text-slate-800 mb-1">No Past Journeys</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            You don't have any past journeys or cancelled bookings on this account.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const isCancelled = booking.bookingStatus === 'CANCELLED';
            
            return (
              <div
                key={booking.id}
                className="bg-white rounded-3xl border border-slate-250 p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 relative"
              >
                
                {/* Trip details */}
                <div className="flex-grow space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-black text-slate-500">{booking.bookingReference}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isCancelled 
                        ? 'bg-rose-50 text-rose-700' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isCancelled ? 'Cancelled & Refunded' : 'Journey Completed'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Bus</span>
                      <span className="font-bold text-slate-750 text-sm">{booking.schedule.bus.busName}</span>
                      <span className="text-xs text-slate-500 block">{booking.schedule.bus.busType}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Route</span>
                      <span className="font-bold text-slate-750 text-sm">
                        {booking.schedule.route.sourceCity} ➔ {booking.schedule.route.destinationCity}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Date & Time</span>
                      <span className="font-bold text-slate-750 text-sm flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {new Date(booking.schedule.departureDate).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-slate-500 block">Departure: {booking.schedule.departureTime}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Passengers</span>
                    <div className="flex flex-wrap gap-2">
                      {booking.passengers.map(p => (
                        <span key={p.id} className="text-xs bg-slate-50 border border-slate-200 text-slate-550 px-2 py-0.5 rounded-md">
                          {p.passengerName} (Seat {p.seatNumber})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pricing / review action column */}
                <div className="flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-3 min-w-[140px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 shrink-0">
                  <div className="text-left md:text-right">
                    <p className="text-xs text-slate-400 font-semibold">Total Fare</p>
                    <p className="text-lg font-black text-slate-700">${booking.totalFare.toFixed(2)}</p>
                  </div>
                  
                  {/* Review Action (Only for completed bookings, not cancelled ones) */}
                  {!isCancelled && (
                    <button
                      onClick={() => handleOpenReviewModal(booking.scheduleId)}
                      className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs bg-slate-50 hover:bg-brand-50 hover:text-brand-700 border-slate-200"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Review Journey
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Review Dialog Modal */}
      {selectedScheduleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseReviewModal}></div>
          
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 w-full max-w-md relative z-10 animate-slide-up shadow-2xl">
            <button onClick={handleCloseReviewModal} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer">
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-bold text-lg text-white mb-1 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400 fill-amber-400" /> Review Journey
            </h3>
            <p className="text-xs text-slate-400 mb-6">Rate your travel comfort and share driver or bus quality.</p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              
              {/* Rating selection (1-5 stars) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none cursor-pointer"
                    >
                      <Star className={`h-6 w-6 ${rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment text area */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Comment</label>
                <textarea
                  rows={4}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you liked or how we can improve..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                ></textarea>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={reviewSubmitLoading}
                className="w-full btn-primary py-2 text-sm flex items-center justify-center gap-2"
              >
                {reviewSubmitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Review'}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
