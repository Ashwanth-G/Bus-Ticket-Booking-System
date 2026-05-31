import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { 
  Users, UserX, UserCheck, AlertCircle, Loader2, Calendar 
} from 'lucide-react';

export default function RegisteredUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (error) {
      toast.error('Failed to load registered users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId, currentStatus) => {
    const nextStatus = !currentStatus;
    const confirmMsg = `Are you sure you want to ${
      nextStatus ? 'enable' : 'disable'
    } this user account? ${
      nextStatus ? 'The user will be able to log in and book tickets.' : 'The user will be blocked from logging in or booking.'
    }`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setActionLoading(userId);
    try {
      const response = await api.put(`/admin/users/${userId}/status`, { isActive: nextStatus });
      toast.success(response.data.message);
      fetchUsers(); // reload lists
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating user status.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white">Registered Users</h2>
        <p className="text-xs text-slate-400">Manage customer accounts, verify contact numbers, and enable or disable access portals.</p>
      </div>

      {users.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <AlertCircle className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <p className="text-sm">No registered customers found.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-850 text-slate-400 text-xs uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {users.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-850/30">
                  <td className="px-6 py-4 font-bold text-white">{customer.fullName}</td>
                  <td className="px-6 py-4">{customer.email}</td>
                  <td className="px-6 py-4 font-mono">{customer.phone}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 font-semibold text-slate-400">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      customer.isActive
                        ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/30'
                        : 'bg-rose-950/40 text-rose-455 border border-rose-900/30'
                    }`}>
                      {customer.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button
                        disabled={actionLoading === customer.id}
                        onClick={() => handleToggleStatus(customer.id, customer.isActive)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
                          customer.isActive
                            ? 'bg-rose-950/20 text-rose-400 border-rose-900/40 hover:bg-rose-900 hover:text-white'
                            : 'bg-emerald-950/20 text-emerald-450 border-emerald-900/40 hover:bg-emerald-600 hover:text-white'
                        }`}
                      >
                        {actionLoading === customer.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : customer.isActive ? (
                          <>
                            <UserX className="h-3.5 w-3.5" /> Disable
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3.5 w-3.5" /> Enable
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
