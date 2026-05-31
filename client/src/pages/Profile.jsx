import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../features/authSlice.js';
import api from '../services/api.js';
import toast from 'react-hot-toast';
import { 
  User, Phone, Mail, Lock, ShieldCheck, Loader2 
} from 'lucide-react';

export default function Profile() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Profile Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Change Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setPhone(user.phone);
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      toast.error('All profile fields are required.');
      return;
    }

    setProfileLoading(true);
    try {
      const response = await api.put('/users/profile', { fullName, phone });
      dispatch(updateUser(response.data.user));
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error('All password fields are required.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await api.patch('/users/change-password', {
        currentPassword,
        newPassword,
        confirmNewPassword
      });
      toast.success(response.data.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-extrabold text-slate-800 mb-2">My Profile & Settings</h2>
      <p className="text-sm text-slate-500 mb-8">Manage your account information, contact numbers, and security credentials.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Update Details form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-800 text-md border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="h-5 w-5 text-brand-600" /> Account Information
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="input-label">Email Address (Read-only)</label>
              <div className="relative opacity-70">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="input-label">Role Status</label>
              <div className="relative opacity-70">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  disabled
                  value={user.role}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="input-label">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field pl-10 py-2.5"
                />
              </div>
            </div>

            <div>
              <label className="input-label">Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field pl-10 py-2.5"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
            >
              {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Change Password form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-800 text-md border-b border-slate-100 pb-3 flex items-center gap-2">
            <Lock className="h-5 w-5 text-brand-600" /> Security Credentials
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="input-label">Current Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 py-2.5"
                />
              </div>
            </div>

            <div>
              <label className="input-label">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 py-2.5"
                />
              </div>
            </div>

            <div>
              <label className="input-label">Confirm New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 py-2.5"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
            >
              {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Change Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
