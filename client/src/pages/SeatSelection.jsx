import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleSeat, clearSeats, setPassengers, setBookingConfirmation } from '../features/bookingSlice.js';
import api from '../services/api.js';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { 
  Bus, Armchair, ArrowLeft, ArrowRight, UserCheck, CreditCard, TicketCheck, Loader2, Bed
} from 'lucide-react';

export const getSeatLabel = (seatNumber, busType) => {
  if (busType && busType.toLowerCase().includes('sleeper')) {
    if (seatNumber <= 18) {
      return `l-${seatNumber}`;
    } else {
      return `u-${seatNumber - 18}`;
    }
  }
  return seatNumber.toString();
};

export default function SeatSelection() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedSchedule, selectedSeats, totalFare } = useSelector((state) => state.booking);
  const { user } = useSelector((state) => state.auth);

  const [bookedSeats, setBookedSeats] = useState([]);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1 = Seat Map, 2 = Passenger Details, 3 = Payment
  const [passengerDetails, setPassengerDetails] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [bookingLoading, setBookingLoading] = useState(false);

  // If no schedule selected, redirect back to home
  useEffect(() => {
    if (!selectedSchedule) {
      navigate('/');
    }
  }, [selectedSchedule, navigate]);

  // Load booked seats and configure Socket.IO
  useEffect(() => {
    if (!selectedSchedule) return;

    // Fetch initial booked seats from schedule API
    api.get(`/schedules/${selectedSchedule.id}`)
      .then(res => {
        const booked = [];
        res.data.bookings.forEach(b => {
          b.passengers.forEach(p => booked.push(p.seatNumber));
        });
        setBookedSeats(booked);
      })
      .catch(() => {
        toast.error('Error loading seat occupancy status.');
      });

    // Connect to Socket.IO server
    const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
    const socket = io(socketUrl);

    socket.on('seatStatusUpdated', (data) => {
      if (data.scheduleId === selectedSchedule.id) {
        setBookedSeats(data.bookedSeats);
        // Toast warning if user has selected a seat that is now booked by someone else
        const overlap = selectedSeats.filter(seat => data.bookedSeats.includes(seat));
        if (overlap.length > 0) {
          toast.error(`Warning: Seat(s) ${overlap.join(', ')} were just booked by another user.`);
          // Clear user selection of those seats
          overlap.forEach(seat => dispatch(toggleSeat(seat)));
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedSchedule, dispatch, selectedSeats]);

  // Update passenger input forms when selected seats change
  useEffect(() => {
    setPassengerDetails(
      selectedSeats.map((seat) => ({
        seatNumber: seat,
        passengerName: '',
        passengerPhone: ''
      }))
    );
  }, [selectedSeats]);

  const handleSeatClick = (seatNumber) => {
    if (bookedSeats.includes(seatNumber)) {
      toast.error('This seat is already booked.');
      return;
    }
    dispatch(toggleSeat(seatNumber));
  };

  const handlePassengerSubmit = (e) => {
    e.preventDefault();

    // Validations
    for (const passenger of passengerDetails) {
      if (!passenger.passengerName.trim() || !passenger.passengerPhone.trim()) {
        toast.error('Please fill in Name and Phone for all selected seats.');
        return;
      }
      if (passenger.passengerPhone.length < 10) {
        toast.error('Please enter a valid 10-digit phone number.');
        return;
      }
    }

    dispatch(setPassengers(passengerDetails));
    setCheckoutStep(3); // Proceed to payment
  };

  const handlePaymentSubmit = async () => {
    setBookingLoading(true);
    try {
      const payload = {
        scheduleId: selectedSchedule.id,
        passengers: passengerDetails,
        paymentMethod
      };

      const response = await api.post('/bookings/create', payload);
      dispatch(setBookingConfirmation(response.data.booking));
      toast.success('Ticket booked successfully!');
      navigate('/booking-confirmation');
    } catch (error) {
      const msg = error.response?.data?.message || 'Error executing booking.';
      toast.error(msg);
    } finally {
      setBookingLoading(false);
    }
  };

  if (!selectedSchedule) return null;

  // Generate 40 seats layout (4 seats per row, separated by aisle)
  const totalSeatsInBus = selectedSchedule.bus.totalSeats;
  const seats = Array.from({ length: totalSeatsInBus }, (_, i) => i + 1);

  const isSleeper = selectedSchedule.bus.busType.toLowerCase().includes('sleeper');

  const renderSleeperBerth = (seatId, deck) => {
    const isBooked = bookedSeats.includes(seatId);
    const isSelected = selectedSeats.includes(seatId);
    const seatLabel = getSeatLabel(seatId, selectedSchedule.bus.busType);

    const isSeaterSleeper = selectedSchedule.bus.busType.toLowerCase().includes('seater') && selectedSchedule.bus.busType.toLowerCase().includes('sleeper');
    
    // For Seater/Sleeper buses, the lower deck contains seats (Armchair) and upper deck contains berths (Bed)
    const isSeatIcon = isSeaterSleeper ? (deck === 'lower') : false;

    return (
      <button
        disabled={isBooked}
        onClick={() => handleSeatClick(seatId)}
        className={`relative w-11 h-16 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border ${
          isBooked
            ? 'bg-rose-500 text-white cursor-not-allowed opacity-80 border-rose-600'
            : isSelected
            ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg scale-105 border-brand-700'
            : 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer border-emerald-600'
        }`}
      >
        <span className="text-[10px] font-bold">{seatLabel}</span>
        {isSeatIcon ? (
          <Armchair className="h-4.5 w-4.5" />
        ) : (
          <Bed className="h-4.5 w-4.5 rotate-90" />
        )}
      </button>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      
      {/* Step Indicators */}
      <div className="flex items-center justify-between max-w-xl mx-auto mb-10">
        {[
          { step: 1, label: 'Select Seats', icon: Armchair },
          { step: 2, label: 'Passenger Details', icon: UserCheck },
          { step: 3, label: 'Payment', icon: CreditCard },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.step} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                checkoutStep >= s.step
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {s.step}
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${
                checkoutStep >= s.step ? 'text-brand-800' : 'text-slate-400'
              }`}>
                {s.label}
              </span>
              {s.step < 3 && <div className="w-8 sm:w-16 h-[2px] bg-slate-200"></div>}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left 2 Cols: Main Steps Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEP 1: Seat Layout */}
          {checkoutStep === 1 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Select Seats</h3>
                  <p className="text-xs text-slate-500">Click on available seats to add them to your selection.</p>
                </div>
                
                {/* Status legend */}
                <div className="flex gap-4 text-xs font-bold">
                  <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-emerald-500"></span> Available</span>
                  <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-rose-500"></span> Booked</span>
                  <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-brand-600"></span> Selected</span>
                </div>
              </div>

              {/* Interactive Bus Seat Map layout */}
              {isSleeper ? (
                <div className="flex flex-col md:flex-row gap-6 justify-center items-stretch bg-slate-50 border border-slate-200 rounded-3xl p-6">
                  {/* Lower Berth Section */}
                  <div className="flex-1 bg-slate-100 rounded-[30px] p-5 border-2 border-slate-300 shadow-inner max-w-[240px] mx-auto relative">
                    <div className="absolute top-2 left-3 text-[9px] font-black text-slate-450 uppercase tracking-widest">
                      {selectedSchedule.bus.busType.toLowerCase().includes('seater') && selectedSchedule.bus.busType.toLowerCase().includes('sleeper') 
                        ? 'Lower Deck (Seater)' 
                        : 'Lower Deck (Sleeper)'}
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200 mb-4 mt-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Driver Cabin</span>
                      <div className="w-6 h-6 rounded-full bg-slate-355 border border-slate-450 flex items-center justify-center font-black text-slate-650 text-[10px]">
                        ⎔
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-x-2 gap-y-3 justify-items-center">
                      {Array.from({ length: 6 }).map((_, rowIndex) => {
                        const row = rowIndex + 1;
                        const leftSeatId = (row - 1) * 3 + 1;
                        const rightInnerSeatId = (row - 1) * 3 + 2;
                        const rightOuterSeatId = (row - 1) * 3 + 3;

                        return (
                          <React.Fragment key={row}>
                            {renderSleeperBerth(leftSeatId, 'lower')}
                            <div className="w-4"></div>
                            {renderSleeperBerth(rightInnerSeatId, 'lower')}
                            {renderSleeperBerth(rightOuterSeatId, 'lower')}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* Upper Berth Section */}
                  <div className="flex-1 bg-slate-100 rounded-[30px] p-5 border-2 border-slate-300 shadow-inner max-w-[240px] mx-auto relative">
                    <div className="absolute top-2 left-3 text-[9px] font-black text-slate-450 uppercase tracking-widest">
                      {selectedSchedule.bus.busType.toLowerCase().includes('seater') && selectedSchedule.bus.busType.toLowerCase().includes('sleeper') 
                        ? 'Upper Deck (Sleeper)' 
                        : 'Upper Deck (Sleeper)'}
                    </div>
                    <div className="flex justify-end items-center pb-2 border-b border-slate-200 mb-4 mt-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-2">Cabin Roof</span>
                    </div>
                    <div className="grid grid-cols-4 gap-x-2 gap-y-3 justify-items-center">
                      {Array.from({ length: 6 }).map((_, rowIndex) => {
                        const row = rowIndex + 1;
                        const leftSeatId = (row - 1) * 3 + 1 + 18;
                        const rightInnerSeatId = (row - 1) * 3 + 2 + 18;
                        const rightOuterSeatId = (row - 1) * 3 + 3 + 18;

                        return (
                          <React.Fragment key={row}>
                            {renderSleeperBerth(leftSeatId, 'upper')}
                            <div className="w-4"></div>
                            {renderSleeperBerth(rightInnerSeatId, 'upper')}
                            {renderSleeperBerth(rightOuterSeatId, 'upper')}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-sm mx-auto bg-slate-100 rounded-[40px] p-6 border-4 border-slate-300 relative shadow-inner">
                  {/* Driver area */}
                  <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">Driver Cabin</span>
                    <div className="w-8 h-8 rounded-full bg-slate-300 border border-slate-400 flex items-center justify-center font-black text-slate-600 text-xs">
                      ⎔
                    </div>
                  </div>

                  {/* Grid of seats: 2 + aisle + 2 */}
                  <div className="grid grid-cols-5 gap-3 justify-items-center">
                    {seats.map((seat) => {
                      const isBooked = bookedSeats.includes(seat);
                      const isSelected = selectedSeats.includes(seat);
                      
                      const showSpacer = (seat - 1) % 4 === 2;

                      return (
                        <React.Fragment key={seat}>
                          {showSpacer && <div className="col-span-1"></div>}
                          <button
                            disabled={isBooked}
                            onClick={() => handleSeatClick(seat)}
                            className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 font-bold text-[10px] transition-all border ${
                              isBooked
                                ? 'bg-rose-500 text-white cursor-not-allowed opacity-80 border-rose-600'
                                : isSelected
                                ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg scale-105 border-brand-700'
                                : 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer border-emerald-600'
                            }`}
                          >
                            <Armchair className="h-4 w-4" />
                            <span>{seat}</span>
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Proceed Action */}
              <div className="mt-8 flex justify-between items-center">
                <button
                  onClick={() => navigate(-1)}
                  className="btn-secondary flex items-center gap-2 py-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to search
                </button>
                
                <button
                  disabled={selectedSeats.length === 0}
                  onClick={() => setCheckoutStep(2)}
                  className="btn-primary flex items-center gap-2 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enter Passenger Details <ArrowRight className="h-4 w-4" />
                </button>
              </div>

            </div>
          )}

          {/* STEP 2: Passenger Details */}
          {checkoutStep === 2 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <h3 className="font-bold text-lg text-slate-800 mb-2">Passenger Information</h3>
              <p className="text-xs text-slate-500 mb-6">Please enter correct passenger identity cards matching ticket records.</p>
              
              <form onSubmit={handlePassengerSubmit} className="space-y-6">
                {passengerDetails.map((passenger, index) => (
                  <div key={passenger.seatNumber} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs">
                        {index + 1}
                      </span>
                      Passenger for Seat <span className="text-brand-600 font-extrabold">{getSeatLabel(passenger.seatNumber, selectedSchedule.bus.busType)}</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="input-label">Full Name</label>
                        <input
                          type="text"
                          required
                          value={passenger.passengerName}
                          onChange={(e) => {
                            const updated = [...passengerDetails];
                            updated[index].passengerName = e.target.value;
                            setPassengerDetails(updated);
                          }}
                          placeholder="Passenger name"
                          className="input-field py-2"
                        />
                      </div>
                      <div>
                        <label className="input-label">Phone Number</label>
                        <input
                          type="text"
                          required
                          value={passenger.passengerPhone}
                          onChange={(e) => {
                            const updated = [...passengerDetails];
                            updated[index].passengerPhone = e.target.value;
                            setPassengerDetails(updated);
                          }}
                          placeholder="10-digit number"
                          className="input-field py-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep(1)}
                    className="btn-secondary flex items-center gap-2 py-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Change seats
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex items-center gap-2 py-2"
                  >
                    Proceed to Payment <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: Payment Simulation */}
          {checkoutStep === 3 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <h3 className="font-bold text-lg text-slate-800 mb-2">Simulated Secure Payment</h3>
              <p className="text-xs text-slate-500 mb-6">Choose a method to complete the simulated checkout.</p>

              <div className="space-y-4 mb-8">
                {[
                  { value: 'UPI', label: 'UPI (Unified Payments Interface)', desc: 'Pay instantly using GooglePay, PhonePe, Paytm' },
                  { value: 'Card', label: 'Credit / Debit Card', desc: 'Secure debit visa, mastercard checkout' },
                  { value: 'NetBanking', label: 'Net Banking', desc: 'Direct transfer from major banks' },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                      paymentMethod === opt.value
                        ? 'border-brand-500 bg-brand-50/40'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === opt.value}
                      onChange={() => setPaymentMethod(opt.value)}
                      className="mt-1 text-brand-600 focus:ring-brand-500 h-4 w-4"
                    />
                    <div>
                      <span className="font-bold text-slate-700 text-sm block">{opt.label}</span>
                      <span className="text-xs text-slate-400 font-medium">{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <button
                  disabled={bookingLoading}
                  onClick={() => setCheckoutStep(2)}
                  className="btn-secondary flex items-center gap-2 py-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Edit details
                </button>
                <button
                  disabled={bookingLoading}
                  onClick={handlePaymentSubmit}
                  className="btn-primary flex items-center gap-2 py-2 disabled:opacity-50"
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      Pay & Confirm Booking (${totalFare.toFixed(2)})
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Right 1 Col: Summary Sidebar Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
            <h3 className="font-bold text-md border-b border-slate-800 pb-3 uppercase tracking-wider text-accent-400">
              Trip Summary
            </h3>
            
            <div className="py-4 space-y-3.5 text-sm">
              <div>
                <p className="text-xs text-slate-450 font-bold uppercase">Bus Operator</p>
                <p className="font-bold text-white text-md">{selectedSchedule.bus.busName}</p>
                <p className="text-xs text-slate-400 font-semibold">{selectedSchedule.bus.busType}</p>
              </div>

              <div>
                <p className="text-xs text-slate-450 font-bold uppercase">Route</p>
                <p className="font-bold text-white text-md">{selectedSchedule.route.sourceCity} ➔ {selectedSchedule.route.destinationCity}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-450 font-bold uppercase">Departure Date</p>
                  <p className="font-semibold text-white">{new Date(selectedSchedule.departureDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-450 font-bold uppercase">Departure Time</p>
                  <p className="font-semibold text-white">{selectedSchedule.departureTime}</p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <div className="flex justify-between items-center text-xs text-slate-400 font-bold mb-1.5">
                  <span>Selected Seats:</span>
                  <span className="text-white text-sm font-black">{selectedSeats.map(seat => getSeatLabel(seat, selectedSchedule.bus.busType)).join(', ') || 'None'}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
                  <span>Base Fare:</span>
                  <span className="text-white font-semibold">${selectedSchedule.fare.toFixed(2)} / seat</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
              <span className="text-xs text-slate-400 font-bold uppercase">Total Fare</span>
              <span className="text-2xl font-black text-accent-400">${totalFare.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
