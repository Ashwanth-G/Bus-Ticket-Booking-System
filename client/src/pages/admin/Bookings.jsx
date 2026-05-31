import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { 
  Ticket, Search, Calendar, AlertCircle, Loader2, User 
} from 'lucide-react';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');

  const fetchBookings = async () => {
    try {
      const res = await api.get('/admin/bookings', {
        params: { search, date }
      });
      setBookings(res.data);
    } catch (error) {
      toast.error('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [search, date]);

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white">Manage Bookings</h2>
        <p className="text-xs text-slate-400">View and track all customer reservation files and passenger passenger-manifest details.</p>
      </div>

      {/* Search Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Text search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Reference, User Name or Email..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent rounded-xl text-sm text-white"
          />
        </div>

        {/* Date filter */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Calendar className="h-4 w-4" />
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent rounded-xl text-sm text-white cursor-pointer"
          />
        </div>

      </div>

      {/* Bookings Table List */}
      {bookings.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <AlertCircle className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <p className="text-sm">No reservations match search parameters.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-850 text-slate-400 text-xs uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Ref Code</th>
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Journey Details</th>
                <th className="px-6 py-4">Date / Time</th>
                <th className="px-6 py-4">Passengers (Seats)</th>
                <th className="px-6 py-4 text-center">Amount</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-850/30">
                  <td className="px-6 py-4 font-mono font-black text-white">{booking.bookingReference}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-white text-sm block">{booking.user.fullName}</span>
                    <span className="text-xs text-slate-450 block">{booking.user.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-200 block uppercase">
                      {booking.schedule.route.sourceCity} ➔ {booking.schedule.route.destinationCity}
                    </span>
                    <span className="text-[11px] text-slate-450 block font-semibold">{booking.schedule.bus.busName}</span>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <span className="font-semibold block">{new Date(booking.schedule.departureDate).toLocaleDateString()}</span>
                    <span className="text-slate-450 block font-mono">Dep: {booking.schedule.departureTime}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {booking.passengers.map(p => (
                        <span key={p.id} className="text-xs text-slate-400">
                          {p.passengerName} (Seat <span className="font-bold text-accent-400">{p.seatNumber}</span>)
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-white">${booking.totalFare.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      booking.bookingStatus === 'CONFIRMED'
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                        : 'bg-rose-950/40 text-rose-450 border border-rose-900/30'
                    }`}>
                      {booking.bookingStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
