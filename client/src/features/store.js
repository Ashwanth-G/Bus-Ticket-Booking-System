import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import searchReducer from './searchSlice.js';
import bookingReducer from './bookingSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    search: searchReducer,
    booking: bookingReducer,
  },
});
