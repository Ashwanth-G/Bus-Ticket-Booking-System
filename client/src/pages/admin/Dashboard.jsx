import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { 
  Users, Bus, Map, Ticket, DollarSign, Loader2, ArrowUpRight 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => {
        setData(res.data);
      })
      .catch(() => {
        // Handle silently or print
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const stats = data?.stats || { totalUsers: 0, totalBuses: 0, totalRoutes: 0, totalBookings: 0, revenue: 0 };
  const charts = data?.charts || { monthlyRevenue: [], dailyBookings: [], topRoutes: [], busOccupancy: [] };

  const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-white">Dashboard Analytics</h2>
        <p className="text-xs text-slate-400">Real-time platform summaries, aggregates, and ticket operations.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        
        {/* Total Users */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Total Users</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{stats.totalUsers}</h3>
          </div>
          <div className="p-3 bg-brand-500/10 text-brand-400 rounded-2xl">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Total Buses */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Total Buses</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{stats.totalBuses}</h3>
          </div>
          <div className="p-3 bg-accent-500/10 text-accent-400 rounded-2xl">
            <Bus className="h-6 w-6" />
          </div>
        </div>

        {/* Total Routes */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Total Routes</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{stats.totalRoutes}</h3>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl">
            <Map className="h-6 w-6" />
          </div>
        </div>

        {/* Total Bookings */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Total Bookings</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{stats.totalBookings}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
            <Ticket className="h-6 w-6" />
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Total Revenue</p>
            <h3 className="text-2xl font-extrabold text-emerald-450 mt-1">${stats.revenue.toFixed(2)}</h3>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Monthly Revenue Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-6">Monthly Revenue ($)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyRevenue}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Bookings Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-6">Daily Bookings Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.dailyBookings}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                <Area type="monotone" dataKey="bookings" stroke="#06b6d4" fillOpacity={0.2} fill="url(#colorBookings)" />
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Routes Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-6">Top Routes by bookings</h3>
          <div className="h-72">
            {charts.topRoutes.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-550 font-bold">No route booking data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.topRoutes} layout="vertical">
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis type="category" dataKey="routeName" stroke="#94a3b8" fontSize={11} tickLine={false} width={120} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                  <Bar dataKey="bookings" fill="#10b981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bus Occupancy Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-6">Active Bus Occupancy (%)</h3>
          <div className="h-72">
            {charts.busOccupancy.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-550 font-bold">No active schedule occupancy data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.busOccupancy}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="occupancy"
                    nameKey="busName"
                    label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {charts.busOccupancy.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
