import { createSlice } from '@reduxjs/toolkit';

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    selectedSchedule: null,
    selectedSeats: [],
    passengers: [],
    totalFare: 0,
    bookingReference: null
  },
  reducers: {
    selectSchedule(state, action) {
      state.selectedSchedule = action.payload;
      state.selectedSeats = [];
      state.passengers = [];
      state.totalFare = 0;
    },
    toggleSeat(state, action) {
      const seat = action.payload;
      const idx = state.selectedSeats.indexOf(seat);
      if (idx > -1) {
        state.selectedSeats.splice(idx, 1);
      } else {
        state.selectedSeats.push(seat);
      }
      state.totalFare = state.selectedSeats.length * (state.selectedSchedule?.fare || 0);
    },
    clearSeats(state) {
      state.selectedSeats = [];
      state.totalFare = 0;
    },
    setPassengers(state, action) {
      state.passengers = action.payload;
    },
    setBookingConfirmation(state, action) {
      state.bookingReference = action.payload.bookingReference;
      state.totalFare = action.payload.totalFare;
      state.passengers = action.payload.passengers;
    },
    resetBookingFlow(state) {
      state.selectedSchedule = null;
      state.selectedSeats = [];
      state.passengers = [];
      state.totalFare = 0;
      state.bookingReference = null;
    }
  }
});

export const { selectSchedule, toggleSeat, clearSeats, setPassengers, setBookingConfirmation, resetBookingFlow } = bookingSlice.actions;
export default bookingSlice.reducer;
