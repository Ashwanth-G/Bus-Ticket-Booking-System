import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import toast from 'react-hot-toast';
import { 
  Calendar, Bus, MapPin, Download, Trash2, ShieldAlert, AlertCircle, Loader2 
} from 'lucide-react';

export default function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(null);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/users/bookings');
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to load upcoming bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleDownloadPDF = async (booking) => {
    try {
      toast.loading('Generating ticket PDF...', { id: 'pdf' });
      const response = await api.get(`/bookings/${booking.id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket-${booking.bookingReference}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss('pdf');
      toast.success('Ticket PDF downloaded.');
    } catch (error) {
      toast.dismiss('pdf');
      toast.error('Error downloading ticket PDF.');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action is permanent and triggers a full simulated refund.')) {
      return;
    }

    setCancelLoading(bookingId);
    try {
      await api.post('/bookings/cancel', { bookingId });
      toast.success('Booking cancelled and refund processed successfully.');
      fetchBookings(); // reload
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error cancelling booking.');
    } finally {
      setCancelLoading(null);
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
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-extrabold text-slate-800 mb-2">My Upcoming Bookings</h2>
      <p className="text-sm text-slate-500 mb-8">Manage your upcoming journeys, download tickets, or process cancellations.</p>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <AlertCircle className="h-12 w-12 text-slate-350 mx-auto mb-4" />
          <h3 className="font-bold text-xl text-slate-800 mb-1">No Upcoming Journeys</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
            You don't have any schedules booked for future dates. Search and book tickets to get started.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary py-2 px-5 text-sm">
            Search Buses
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6"
            >
              
              {/* Trip details */}
              <div className="flex-grow space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-black text-brand-700">{booking.bookingReference}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                    Confirmed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Bus</span>
                    <span className="font-bold text-slate-800 text-sm">{booking.schedule.bus.busName}</span>
                    <span className="text-xs text-slate-500 block">{booking.schedule.bus.busType} | {booking.schedule.bus.busNumber}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Route</span>
                    <span className="font-bold text-slate-850 text-sm">
                      {booking.schedule.route.sourceCity} ➔ {booking.schedule.route.destinationCity}
                    </span>
                    <span className="text-xs text-slate-500 block">{booking.schedule.route.duration} | {booking.schedule.route.distance} km</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Date & Time</span>
                    <span className="font-bold text-slate-850 text-sm flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-slate-450" />
                      {new Date(booking.schedule.departureDate).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-slate-500 block">Departure: {booking.schedule.departureTime}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Passengers (Seats)</span>
                  <div className="flex flex-wrap gap-2">
                    {booking.passengers.map(p => (
                      <span key={p.id} className="text-xs bg-slate-100 border border-slate-200/60 text-slate-650 px-2.5 py-1 rounded-lg">
                        {p.passengerName} (Seat <span className="font-extrabold text-brand-600">{p.seatNumber}</span>)
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action column */}
              <div className="flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-3 min-w-[140px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 shrink-0">
                <div className="text-left md:text-right">
                  <p className="text-xs text-slate-400 font-semibold">Total Fare</p>
                  <p className="text-xl font-black text-slate-800">${booking.totalFare.toFixed(2)}</p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadPDF(booking)}
                    className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    title="Download Ticket PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    disabled={cancelLoading === booking.id}
                    onClick={() => handleCancelBooking(booking.id)}
                    className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                    title="Cancel Booking"
                  >
                    {cancelLoading === booking.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
