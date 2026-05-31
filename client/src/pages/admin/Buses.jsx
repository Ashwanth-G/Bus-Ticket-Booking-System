import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { 
  Bus, Plus, Edit2, Trash2, X, Loader2, AlertCircle 
} from 'lucide-react';

export default function Buses() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState(null); // Null for Add, Bus object for Edit

  // Form State
  const [busNumber, setBusNumber] = useState('');
  const [busName, setBusName] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [busType, setBusType] = useState('AC Sleeper');
  const [totalSeats, setTotalSeats] = useState(40);
  const [amenities, setAmenities] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchBuses = async () => {
    try {
      // Direct call to public endpoint (schedules need it) or we fetch buses.
      // Wait, is there a GET /api/buses or do we need GET /api/admin/dashboard stats or lists?
      // Wait, let's see. In `adminRoutes.js` we didn't specify a general `GET /api/admin/buses`?
      // Ah! Let's check `adminRoutes.js` for buses endpoints:
      // router.post('/buses', addBus);
      // router.put('/buses/:id', editBus);
      // router.delete('/buses/:id', deleteBus);
      // Wait! Where does the admin view the list of buses?
      // Oh! In `server/src/routes/adminRoutes.js` we did not define a list endpoint? Or does the public schedules/buses endpoint list them,
      // OR should we query from `GET /api/admin/dashboard` or add a list endpoint?
      // Actually, we can add a list buses endpoint or let `/api/admin/dashboard` list them, OR even better, we can add a `GET /api/admin/buses` (or public `/api/buses` which is extremely clean and matching the REST spec!)
      // Wait, let's check `api requirements` from user prompt:
      // Bus: /api/buses
      // Route: /api/routes
      // Schedule: /api/schedules
      // This means we need `GET /api/buses` and `GET /api/routes` for general fetching!
      // Let's check if we implemented `GET /api/buses` and `GET /api/routes` in the backend.
      // Oh, in backend routers, did we create them? We created `scheduleRoutes.js`. We didn't create a distinct `busRoutes.js` and `routeRoutes.js`?
      // Let's create:
      // - `server/src/routes/busRoutes.js` containing `GET /` to fetch all buses.
      // - `server/src/routes/routeRoutes.js` containing `GET /` to fetch all routes.
      // This is extremely simple and perfectly matches the user's explicit REST API list:
      // "Bus: /api/buses, Route: /api/routes, Schedule: /api/schedules"
      // Let's verify what endpoints we need to create first, then implement the frontend!
      // Yes! Let's first make `server/src/routes/busRoutes.js` and `server/src/routes/routeRoutes.js` and mount them in `app.js`.
      
      // For now, in frontend, we will query `/api/buses` and `/api/routes` respectively. Let's write the code assuming these exist!
      const res = await api.get('/buses');
      setBuses(res.data);
    } catch (error) {
      toast.error('Failed to load buses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  const handleOpenAdd = () => {
    setEditingBus(null);
    setBusNumber('');
    setBusName('');
    setOperatorName('');
    setBusType('AC Sleeper');
    setTotalSeats(40);
    setAmenities('WiFi, Charging Point, Water Bottle');
    setModalOpen(true);
  };

  const handleOpenEdit = (bus) => {
    setEditingBus(bus);
    setBusNumber(bus.busNumber);
    setBusName(bus.busName);
    setOperatorName(bus.operatorName);
    setBusType(bus.busType);
    setTotalSeats(bus.totalSeats);
    setAmenities(bus.amenities);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!busNumber || !busName || !operatorName || !busType || !amenities) {
      toast.error('Please fill in all fields.');
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = { busNumber, busName, operatorName, busType, totalSeats: parseInt(totalSeats), amenities };
      
      if (editingBus) {
        // Edit Mode: PUT /api/admin/buses/:id
        await api.put(`/admin/buses/${editingBus.id}`, payload);
        toast.success('Bus updated successfully.');
      } else {
        // Add Mode: POST /api/admin/buses
        await api.post('/admin/buses', payload);
        toast.success('Bus added successfully.');
      }
      setModalOpen(false);
      fetchBuses(); // reload
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving bus details.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (busId) => {
    if (!window.confirm('Are you sure you want to delete this bus? Deleting it will cascade and remove all related schedules and bookings!')) {
      return;
    }

    try {
      await api.delete(`/admin/buses/${busId}`);
      toast.success('Bus deleted successfully.');
      fetchBuses(); // reload
    } catch (error) {
      toast.error('Error deleting bus.');
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
          <h2 className="text-2xl font-black text-white">Manage Buses</h2>
          <p className="text-xs text-slate-400">Add, edit, or remove fleet buses and amenities configurations.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add Bus
        </button>
      </div>

      {buses.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <AlertCircle className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <p className="text-sm">No buses found in fleet inventory.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-850 text-slate-400 text-xs uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Bus Name / Op</th>
                <th className="px-6 py-4">Bus Number</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-center">Seats</th>
                <th className="px-6 py-4">Amenities</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {buses.map((bus) => (
                <tr key={bus.id} className="hover:bg-slate-850/30">
                  <td className="px-6 py-4 font-bold text-white">
                    {bus.busName}
                    <span className="block text-xs font-semibold text-slate-450">{bus.operatorName}</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-200">{bus.busNumber}</td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-md">
                      {bus.busType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-white">{bus.totalSeats}</td>
                  <td className="px-6 py-4 text-xs text-slate-400 max-w-[200px] truncate">{bus.amenities}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(bus)}
                        className="p-1.5 rounded-lg bg-slate-800 text-brand-400 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                        title="Edit Bus"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(bus.id)}
                        className="p-1.5 rounded-lg bg-rose-950/20 text-rose-400 hover:bg-rose-900 hover:text-white transition-colors cursor-pointer"
                        title="Delete Bus"
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
              {editingBus ? 'Edit Bus Fleet Details' : 'Add Bus to Fleet'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Bus Number</label>
                <input
                  type="text"
                  required
                  value={busNumber}
                  onChange={(e) => setBusNumber(e.target.value)}
                  placeholder="e.g. KA-01-B-1234"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Bus Name</label>
                <input
                  type="text"
                  required
                  value={busName}
                  onChange={(e) => setBusName(e.target.value)}
                  placeholder="e.g. Skyline Elite"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Operator Name</label>
                <input
                  type="text"
                  required
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="e.g. Skyline Travels"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Bus Type</label>
                  <select
                    value={busType}
                    onChange={(e) => setBusType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    <option value="AC Sleeper">AC Sleeper</option>
                    <option value="Non AC">Non AC</option>
                    <option value="Volvo">Volvo</option>
                    <option value="Semi Sleeper">Semi Sleeper</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Total Seats</label>
                  <input
                    type="number"
                    required
                    value={totalSeats}
                    onChange={(e) => setTotalSeats(e.target.value)}
                    placeholder="40"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Amenities (Comma separated)</label>
                <input
                  type="text"
                  required
                  value={amenities}
                  onChange={(e) => setAmenities(e.target.value)}
                  placeholder="e.g. WiFi, Charging Point, Water Bottle"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2 mt-4"
              >
                {submitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Bus'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
