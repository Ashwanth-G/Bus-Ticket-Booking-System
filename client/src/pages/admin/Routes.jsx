import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { 
  Map, Plus, Edit2, Trash2, X, Loader2, AlertCircle 
} from 'lucide-react';

const CITIES = ['Bangalore', 'Mumbai', 'Pune', 'Delhi', 'Jaipur', 'Chennai', 'Hyderabad', 'Goa', 'Ahmedabad', 'Kolkata'];

export default function Routes() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);

  // Form State
  const [sourceCity, setSourceCity] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchRoutes = async () => {
    try {
      const res = await api.get('/routes');
      setRoutes(res.data);
    } catch (error) {
      toast.error('Failed to load routes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleOpenAdd = () => {
    setEditingRoute(null);
    setSourceCity('');
    setDestinationCity('');
    setDistance('');
    setDuration('');
    setModalOpen(true);
  };

  const handleOpenEdit = (route) => {
    setEditingRoute(route);
    setSourceCity(route.sourceCity);
    setDestinationCity(route.destinationCity);
    setDistance(route.distance);
    setDuration(route.duration);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sourceCity || !destinationCity || !distance || !duration) {
      toast.error('Please fill in all fields.');
      return;
    }

    if (sourceCity === destinationCity) {
      toast.error('Source and Destination cities cannot be the same.');
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = { sourceCity, destinationCity, distance: parseFloat(distance), duration };
      
      if (editingRoute) {
        await api.put(`/admin/routes/${editingRoute.id}`, payload);
        toast.success('Route updated successfully.');
      } else {
        await api.post('/admin/routes', payload);
        toast.success('Route added successfully.');
      }
      setModalOpen(false);
      fetchRoutes(); // reload
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving route details.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (routeId) => {
    if (!window.confirm('Are you sure you want to delete this route? Deleting it will cascade and delete all associated schedules and bookings!')) {
      return;
    }

    try {
      await api.delete(`/admin/routes/${routeId}`);
      toast.success('Route deleted successfully.');
      fetchRoutes(); // reload
    } catch (error) {
      toast.error('Error deleting route.');
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white">Manage Routes</h2>
          <p className="text-xs text-slate-400">Map and establish transport routes and operational durations.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add Route
        </button>
      </div>

      {routes.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <AlertCircle className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <p className="text-sm">No operational routes established.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-850 text-slate-400 text-xs uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Source City</th>
                <th className="px-6 py-4">Destination City</th>
                <th className="px-6 py-4">Distance (km)</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {routes.map((route) => (
                <tr key={route.id} className="hover:bg-slate-850/30">
                  <td className="px-6 py-4 font-bold text-white uppercase tracking-wide">{route.sourceCity}</td>
                  <td className="px-6 py-4 font-bold text-white uppercase tracking-wide">{route.destinationCity}</td>
                  <td className="px-6 py-4 text-slate-200">{route.distance} km</td>
                  <td className="px-6 py-4 font-mono text-slate-205">{route.duration}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(route)}
                        className="p-1.5 rounded-lg bg-slate-800 text-brand-400 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                        title="Edit Route"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(route.id)}
                        className="p-1.5 rounded-lg bg-rose-950/20 text-rose-400 hover:bg-rose-900 hover:text-white transition-colors cursor-pointer"
                        title="Delete Route"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CRUD dialog modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalOpen(false)}></div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md relative z-10 animate-slide-up text-white">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer">
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-bold text-lg text-white mb-6">
              {editingRoute ? 'Edit Route Details' : 'Add New Operational Route'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Source City</label>
                <select
                  value={sourceCity}
                  onChange={(e) => setSourceCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer text-white"
                >
                  <option value="">Select source</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Destination City</label>
                <select
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer text-white"
                >
                  <option value="">Select destination</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Distance (km)</label>
                  <input
                    type="number"
                    required
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    placeholder="e.g. 350"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Duration</label>
                  <input
                    type="text"
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 05h 30m"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2 mt-4"
              >
                {submitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Route'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
