import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../validators/authValidator.js';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../features/authSlice.js';
import api from '../services/api.js';
import toast from 'react-hot-toast';
import { Loader2, Mail, Lock, User, Phone } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', phone: '', password: '', confirmPassword: '' }
  });

  const onSubmit = async (data) => {
    dispatch(loginStart());
    try {
      const response = await api.post('/auth/register', data);
      dispatch(loginSuccess(response.data));
      toast.success('Registration successful! Welcome.');
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Try again.';
      dispatch(loginFailure(message));
      toast.error(message);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-white mb-6 text-center">Create Account</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <User className="h-4 w-4" />
            </span>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent rounded-xl text-sm text-white"
              placeholder="e.g. John Doe"
              {...register('fullName')}
            />
          </div>
          {errors.fullName && <p className="text-xs text-rose-500 mt-1">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Mail className="h-4 w-4" />
            </span>
            <input
              type="email"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent rounded-xl text-sm text-white"
              placeholder="e.g. john@example.com"
              {...register('email')}
            />
          </div>
          {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Phone className="h-4 w-4" />
            </span>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent rounded-xl text-sm text-white"
              placeholder="e.g. 9876543210"
              {...register('phone')}
            />
          </div>
          {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Lock className="h-4 w-4" />
            </span>
            <input
              type="password"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent rounded-xl text-sm text-white"
              placeholder="••••••••"
              {...register('password')}
            />
          </div>
          {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Confirm Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Lock className="h-4 w-4" />
            </span>
            <input
              type="password"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent rounded-xl text-sm text-white"
              placeholder="••••••••"
              {...register('confirmPassword')}
            />
          </div>
          {errors.confirmPassword && <p className="text-xs text-rose-500 mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-700 hover:to-accent-700 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50 mt-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
