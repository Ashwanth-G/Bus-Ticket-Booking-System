import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';

// Layouts
import MainLayout from './layouts/MainLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';

// Public/User Pages
import LandingPage from './pages/LandingPage.jsx';
import SearchResults from './pages/SearchResults.jsx';
import SeatSelection from './pages/SeatSelection.jsx';
import BookingConfirmation from './pages/BookingConfirmation.jsx';
import MyBookings from './pages/MyBookings.jsx';
import BookingHistory from './pages/BookingHistory.jsx';
import Profile from './pages/Profile.jsx';

// Auth Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';

// Admin Pages
import Dashboard from './pages/admin/Dashboard.jsx';
import Buses from './pages/admin/Buses.jsx';
import RoutesPage from './pages/admin/Routes.jsx';
import Schedules from './pages/admin/Schedules.jsx';
import Bookings from './pages/admin/Bookings.jsx';
import RegisteredUsers from './pages/admin/Users.jsx';

// Protected Route Middleware
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Toast Notification Container */}
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'text-sm font-semibold rounded-2xl p-4 bg-slate-900 text-white border border-slate-800 shadow-xl',
          duration: 4000,
        }} 
      />

      <Routes>
        {/* User Portal Layout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="search-results" element={<SearchResults />} />
          
          {/* Protected Booking and User Routes */}
          <Route path="seat-selection" element={
            <ProtectedRoute>
              <SeatSelection />
            </ProtectedRoute>
          } />
          <Route path="booking-confirmation" element={
            <ProtectedRoute>
              <BookingConfirmation />
            </ProtectedRoute>
          } />
          <Route path="my-bookings" element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          } />
          <Route path="booking-history" element={
            <ProtectedRoute>
              <BookingHistory />
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
        </Route>

        {/* Guest Auth Layout */}
        <Route path="/" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Administrative Dashboard Layout */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="buses" element={<Buses />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="schedules" element={<Schedules />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="users" element={<RegisteredUsers />} />
        </Route>

        {/* Fallback to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
