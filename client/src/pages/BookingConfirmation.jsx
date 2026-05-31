import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { resetBookingFlow } from '../features/bookingSlice.js';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api.js';
import toast from 'react-hot-toast';
import { CheckCircle, Download, ArrowRight, Home } from 'lucide-react';

export default function BookingConfirmation() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { bookingReference, selectedSchedule, passengers, totalFare } = useSelector((state) => state.booking);
  
  // Also get the full booking object if saved
  // If no booking Reference, redirect
  useEffect(() => {
    if (!bookingReference) {
      navigate('/');
    }
  }, [bookingReference, navigate]);

  if (!bookingReference || !selectedSchedule) return null;

  const handleDownloadPDF = async () => {
    try {
      // Find booking ID first from my upcoming bookings list or fetch by reference
      const resUpcoming = await api.get('/users/bookings');
      const bookingObj = resUpcoming.data.find(b => b.bookingReference === bookingReference);

      if (!bookingObj) {
        toast.error('Could not locate booking records. Try downloading from My Bookings.');
        return;
      }

      toast.loading('Generating ticket PDF...', { id: 'pdf' });
      const response = await api.get(`/bookings/${bookingObj.id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket-${bookingReference}.pdf`);
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

  const handleDone = () => {
    dispatch(resetBookingFlow());
    navigate('/');
  };

  // Compile QR Code data
  const qrData = JSON.stringify({
    ref: bookingReference,
    route: `${selectedSchedule.route.sourceCity} ➔ ${selectedSchedule.route.destinationCity}`,
    date: new Date(selectedSchedule.departureDate).toLocaleDateString(),
    time: selectedSchedule.departureTime,
    seats: passengers.map(p => p.seatNumber).join(', ')
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-6">
        
        {/* Animated Check badge */}
        <div className="inline-flex items-center justify-center p-3 bg-emerald-50 text-emerald-600 rounded-full">
          <CheckCircle className="h-12 w-12 animate-pulse" />
        </div>

        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">Booking Confirmed!</h2>
          <p className="text-sm text-slate-500 mt-1">
            Your payment was processed successfully. Here is your digital boarding ticket.
          </p>
        </div>

        {/* Ticket Box */}
        <div className="border border-slate-200 rounded-3xl p-6 bg-slate-50 text-left grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Main Info */}
          <div className="md:col-span-2 space-y-3.5">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Booking ID</span>
              <p className="text-lg font-black text-slate-800">{bookingReference}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Route Details</span>
              <p className="font-bold text-slate-700">{selectedSchedule.route.sourceCity} ➔ {selectedSchedule.route.destinationCity}</p>
              <p className="text-xs text-slate-500">{new Date(selectedSchedule.departureDate).toLocaleDateString()} at {selectedSchedule.departureTime}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Seats Booked</span>
                <p className="text-sm font-bold text-slate-700">{passengers.map(p => p.seatNumber).join(', ')}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Amount Paid</span>
                <p className="text-sm font-bold text-brand-650">${totalFare.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <QRCodeSVG value={qrData} size={110} />
            <span className="text-[9px] font-bold text-slate-400 mt-2.5 uppercase tracking-widest">Boarding Pass</span>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleDownloadPDF}
            className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 py-2.5 px-5"
          >
            <Download className="h-4 w-4" /> Download PDF Ticket
          </button>
          
          <button
            onClick={handleDone}
            className="w-full sm:w-auto btn-secondary flex items-center justify-center gap-2 py-2.5 px-5"
          >
            <Home className="h-4 w-4" /> Go to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
