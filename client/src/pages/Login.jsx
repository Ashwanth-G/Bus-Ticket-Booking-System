import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../validators/authValidator.js';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../features/authSlice.js';
import api from '../services/api.js';
import toast from 'react-hot-toast';
import { Loader2, Mail, Lock } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const expired = searchParams.get('expired');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data) => {
    dispatch(loginStart());
    try {
      const response = await api.post('/auth/login', data);
      dispatch(loginSuccess(response.data));
      toast.success('Logged in successfully!');
      
      if (response.data.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check credentials.';
      dispatch(loginFailure(message));
      toast.error(message);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-white mb-6 text-center">Sign In</h3>

      {expired && (
        <div className="bg-rose-950/40 border border-rose-900/60 text-rose-200 text-xs px-3 py-2.5 rounded-xl mb-4 text-center">
          Session expired. Please log in again.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Mail className="h-4 w-4" />
            </span>
            <input
              type="email"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent rounded-xl text-sm text-white"
              placeholder="e.g. admin@smartbus.com"
              {...register('email')}
            />
          </div>
          {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
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

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs font-medium text-brand-400 hover:text-brand-300">
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-700 hover:to-accent-700 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-brand-950/40 cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Login'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
