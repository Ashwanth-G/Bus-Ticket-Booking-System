import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/authSlice.js';
import { Menu, X, Bus, User, LogOut, Calendar, Clock, History, Shield, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MainLayout() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully.');
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Premium Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-900 text-white shadow-lg backdrop-blur-md bg-opacity-95 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white hover:opacity-90">
                <Bus className="h-6 w-6 text-accent-400 animate-pulse" />
                <span>SmartBus<span className="text-accent-400">Pro</span></span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-accent-400' : 'text-slate-300 hover:text-white'}`}>
                Home
              </Link>
              {isAuthenticated && (
                <>
                  <Link to="/my-bookings" className={`text-sm font-medium transition-colors ${isActive('/my-bookings') ? 'text-accent-400' : 'text-slate-300 hover:text-white'}`}>
                    My Bookings
                  </Link>
                  <Link to="/booking-history" className={`text-sm font-medium transition-colors ${isActive('/booking-history') ? 'text-accent-400' : 'text-slate-300 hover:text-white'}`}>
                    History
                  </Link>
                  <Link to="/profile" className={`text-sm font-medium transition-colors ${isActive('/profile') ? 'text-accent-400' : 'text-slate-300 hover:text-white'}`}>
                    Profile
                  </Link>
                  {user?.role === 'ADMIN' && (
                    <Link to="/admin/dashboard" className="flex items-center gap-1.5 text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors bg-brand-950/40 px-3 py-1.5 rounded-lg border border-brand-900/60">
                      <Shield className="h-4 w-4" />
                      Admin Panel
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* Desktop User Panel */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-4 border-l border-slate-800 pl-4">
                  <span className="text-sm text-slate-300">
                    Hi, <span className="font-semibold text-white">{user?.fullName.split(' ')[0]}</span>
                  </span>
                  <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm font-medium text-rose-400 hover:text-rose-300 transition-colors cursor-pointer">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-sm font-semibold text-white hover:text-slate-200 transition-colors">
                    Login
                  </Link>
                  <Link to="/register" className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all shadow-md">
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg text-slate-400 hover:text-white focus:outline-none cursor-pointer">
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 animate-fade-in">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/') ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                Home
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/my-bookings" onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/my-bookings') ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                    My Bookings
                  </Link>
                  <Link to="/booking-history" onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/booking-history') ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                    Booking History
                  </Link>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/profile') ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                    Profile
                  </Link>
                  {user?.role === 'ADMIN' && (
                    <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-brand-400 hover:bg-slate-800">
                      Admin Dashboard
                    </Link>
                  )}
                  <button onClick={handleLogout} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-rose-400 hover:bg-slate-800 cursor-pointer">
                    Logout
                  </button>
                </>
              ) : (
                <div className="pt-4 border-t border-slate-850 px-3 space-y-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center py-2 text-slate-300 hover:text-white font-medium border border-slate-700 rounded-lg">
                    Login
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-md">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Page Layout Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Premium Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xl font-bold text-white">
                <Bus className="h-6 w-6 text-accent-400" />
                <span>SmartBus<span className="text-accent-400">Pro</span></span>
              </div>
              <p className="text-sm">
                Experience premium and secure online bus ticket booking. Search schedules, choose seats in real-time, and download your ticket instantly.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="hover:text-white transition-colors">Search Buses</Link></li>
                <li><Link to="/my-bookings" className="hover:text-white transition-colors">Upcoming Bookings</Link></li>
                <li><Link to="/profile" className="hover:text-white transition-colors">Account Profile</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Features</h3>
              <ul className="space-y-2 text-sm">
                <li>Live Seat Tracker</li>
                <li>Instant PDF Tickets</li>
                <li>QR Code Scanning</li>
                <li>Refund Processing</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Predefined Admin</h3>
              <p className="text-sm leading-relaxed mb-1">Email: <code className="text-slate-200">admin@smartbus.com</code></p>
              <p className="text-sm">Password: <code className="text-slate-200">Admin@123</code></p>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-xs">
            <p>&copy; {new Date().getFullYear()} SmartBus Pro. All rights reserved. Created for Academic Final Year Project validation.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
