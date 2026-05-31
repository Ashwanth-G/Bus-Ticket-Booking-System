import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, resetPasswordSchema } from '../validators/authValidator.js';
import api from '../services/api.js';
import toast from 'react-hot-toast';
import { Loader2, Mail, Lock, Key } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Reset Password
  const [userEmail, setUserEmail] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');

  // Form 1: Forgot password (email submission)
  const { register: registerForgot, handleSubmit: handleForgotSubmit, formState: { errors: forgotErrors } } = useForm({
    resolver: zodResolver(forgotPasswordSchema)
  });

  // Form 2: Reset password (OTP + New Password)
  const { register: registerReset, handleSubmit: handleResetSubmit, formState: { errors: resetErrors } } = useForm({
    resolver: zodResolver(resetPasswordSchema)
  });

  const onForgotSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', data);
      setUserEmail(data.email);
      setStep(2);
      toast.success(response.data.message);
      
      // Capture simulated OTP from server response for ease of evaluation
      if (response.data.simulation) {
        // Extract the code from: "OTP sent successfully. Code is XXXXXX (Simulated)."
        const match = response.data.simulation.match(/\d{6}/);
        if (match) {
          setSimulatedOtp(match[0]);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onResetSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/reset-password', data);
      toast.success('Password updated successfully! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP or password update error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-white mb-6 text-center">Reset Password</h3>

      {step === 1 ? (
        <form onSubmit={handleForgotSubmit(onForgotSubmit)} className="space-y-5">
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            Enter your registered email address and we'll simulate sending a 6-digit OTP code to verify your identity.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent rounded-xl text-sm text-white"
                placeholder="e.g. user@example.com"
                {...registerForgot('email')}
              />
            </div>
            {forgotErrors.email && <p className="text-xs text-rose-500 mt-1">{forgotErrors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-700 hover:to-accent-700 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-4">
          {simulatedOtp && (
            <div className="bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs px-3 py-2.5 rounded-xl mb-4 text-center">
              <strong>Simulated OTP delivered:</strong> Use code <code className="font-bold text-white bg-slate-900 px-1.5 py-0.5 rounded">{simulatedOtp}</code>
            </div>
          )}

          {/* Preset email field value */}
          <input type="hidden" value={userEmail} {...registerReset('email')} />

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Enter 6-Digit OTP</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Key className="h-4 w-4" />
              </span>
              <input
                type="text"
                maxLength={6}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent rounded-xl text-sm text-white tracking-widest text-center"
                placeholder="000000"
                {...registerReset('otp')}
              />
            </div>
            {resetErrors.otp && <p className="text-xs text-rose-500 mt-1">{resetErrors.otp.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent rounded-xl text-sm text-white"
                placeholder="••••••••"
                {...registerReset('newPassword')}
              />
            </div>
            {resetErrors.newPassword && <p className="text-xs text-rose-500 mt-1">{resetErrors.newPassword.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Confirm New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent rounded-xl text-sm text-white"
                placeholder="••••••••"
                {...registerReset('confirmNewPassword')}
              />
            </div>
            {resetErrors.confirmNewPassword && <p className="text-xs text-rose-500 mt-1">{resetErrors.confirmNewPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-700 hover:to-accent-700 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset Password'}
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <Link to="/login" className="text-xs font-semibold text-brand-400 hover:text-brand-300">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
