import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Bus } from 'lucide-react';

export default function AuthLayout() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  // If already authenticated, redirect to home
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12 relative overflow-hidden">
      {/* Decorative Gradient Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-700/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent-700/20 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md z-10 animate-slide-up">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-brand-950/60 rounded-2xl border border-brand-900/40 mb-3 shadow-lg">
            <Bus className="h-8 w-8 text-accent-400" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">SmartBus Pro</h2>
          <p className="mt-2 text-sm text-slate-400">Your premium journey starts here.</p>
        </div>

        {/* Auth form panel container */}
        <div className="glass-dark border-slate-800 rounded-3xl p-8 shadow-2xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
