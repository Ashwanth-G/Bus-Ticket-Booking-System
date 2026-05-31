import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { 
  CalendarRange, Plus, Edit2, Trash2, X, Loader2, AlertCircle, Calendar 
} from 'lucide-react';

export default function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  // Form State
  const [busId, setBusId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [fare, setFare] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch schedules
      // Note: we can query all schedules without filtering cities to list them all for admins
      // But wait! Is there a list all schedules API or does GET /api/schedules query all if parameters are omitted?
      // Yes, let's implement the backend `searchSchedules` in a way that if source/destination are empty it returns all, or we fetch them. Wait, did we write `searchSchedules` to require cities?
      // Let's check `scheduleController.js`:
      // `if (!sourceCity || !destinationCity || !travelDate) { return res.status(400)... }`
      // Ah! In `scheduleController.js`, it returns 400 if those are missing!
      // This means we need an endpoint to list all schedules for admins without filtering, or we need to update `scheduleController.js` to bypass this check for admin roles!
      // Or we can add a list schedules endpoint to `adminRoutes.js`, or support general listing in `scheduleController.js` if queries are missing.
      // Wait, let's look at `server/src/routes/adminRoutes.js`. We didn't mount a `GET /schedules` list for admins?
      // Wait! Let's check: we have `GET /admin/dashboard` which gets analytics, but we don't have a schedule list?
      // Actually, we can easily add a bypass in the public `scheduleController.js` search, OR we can add a list endpoint in `adminController.js` (or public routing).
      // Wait, let's see. In `adminRoutes.js`, we have:
      // router.post('/schedules', addSchedule);
      // router.put('/schedules/:id', editSchedule);
      // router.delete('/schedules/:id', deleteSchedule);
      // We don't have a GET route there! Let's check if we can query all schedules.
      // Let's check if we can add a simple `GET /api/schedules/all` or update `scheduleController.js` to return all if no query params are present!
      // Yes! Updating `scheduleController` or `app.js` routing to support fetching all schedules/buses/routes is the best approach.
      // Let's first make the frontend page. It will call `api.get('/schedules/admin-list')` or public `api.get('/schedules/all')`. Let's use `api.get('/schedules/all')` to fetch all schedules.
      
      const [resSchedules, resBuses, resRoutes] = await Promise.all([
        api.get('/schedules/all'),
        api.get('/buses'),
        api.get('/routes')
      ]);

      setSchedules(resSchedules.data);
      setBuses(resBuses.data);
      setRoutes(resRoutes.data);
    } catch (error) {
      toast.error('Failed to load schedule lists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    setBusId(buses[0]?.id || '');
    setRouteId(routes[0]?.id || '');
    setDepartureDate('');
    setDepartureTime('');
    setArrivalTime('');
    setFare('');
    setModalOpen(true);
  };

  const handleOpenEdit = (sched) => {
    setEditingSchedule(sched);
    setBusId(sched.busId);
    setRouteId(sched.routeId);
    setDepartureDate(sched.departureDate.split('T')[0]);
    setDepartureTime(sched.departureTime);
    setArrivalTime(sched.arrivalTime);
    setFare(sched.fare);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!busId || !routeId || !departureDate || !departureTime || !arrivalTime || !fare) {
      toast.error('Please fill in all fields.');
      return;
    }

    // Validation: Cannot create schedules in the past
    const today = new Date();
    today.setHours(0,0,0,0);
    const searchDate = new Date(departureDate);
    if (searchDate < today) {
      toast.error('Cannot create or reschedule to a past date.');
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        busId: parseInt(busId),
        routeId: parseInt(routeId),
        departureDate,
        departureTime,
        arrivalTime,
        fare: parseFloat(fare)
      };

      if (editingSchedule) {
        await api.put(`/admin/schedules/${editingSchedule.id}`, payload);
        toast.success('Schedule updated successfully.');
      } else {
        await api.post('/admin/schedules', payload);
        toast.success('Schedule added successfully.');
      }
      setModalOpen(false);
      fetchData(); // reload
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving schedule.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (schedId) => {
    if (!window.confirm('Are you sure you want to delete this schedule? This will cascade and delete all bookings for this schedule!')) {
      return;
    }

    try {
      await api.delete(`/admin/schedules/${schedId}`);
      toast.success('Schedule deleted successfully.');
      fetchData();
    } catch (error) {
      toast.error('Error deleting schedule.');
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
          <h2 className="text-2xl font-black text-white">Manage Schedules</h2>
          <p className="text-xs text-slate-400">Schedule buses onto mapped routes with specific timings and fares.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add Schedule
        </button>
      </div>

      {schedules.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <AlertCircle className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <p className="text-sm">No scheduled journeys exist.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-850 text-slate-400 text-xs uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Bus Fleet</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Timings (Dep / Arr)</th>
                <th className="px-6 py-4 text-center">Fare</th>
                <th className="px-6 py-4 text-center">Seats Left</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {schedules.map((sched) => (
                <tr key={sched.id} className="hover:bg-slate-850/30">
                  <td className="px-6 py-4 font-bold text-white">
                    {sched.bus.busName}
                    <span className="block text-xs font-semibold text-slate-450">{sched.bus.busNumber} ({sched.bus.busType})</span>
                  </td>
                  <td className="px-6 py-4 uppercase text-xs font-bold text-slate-200">
                    {sched.route.sourceCity} ➔ {sched.route.destinationCity}
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 font-semibold">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      {new Date(sched.departureDate).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    {sched.departureTime} / {sched.arrivalTime}
                  </td>
                  <td className="px-6 py-4 text-center font-extrabold text-brand-400">${sched.fare.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center font-semibold text-emerald-450">{sched.availableSeats} / {sched.bus.totalSeats}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(sched)}
                        className="p-1.5 rounded-lg bg-slate-800 text-brand-400 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                        title="Edit Schedule"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(sched.id)}
                        className="p-1.5 rounded-lg bg-rose-950/20 text-rose-400 hover:bg-rose-900 hover:text-white transition-colors cursor-pointer"
                        title="Delete Schedule"
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
              {editingSchedule ? 'Edit Journey Schedule' : 'Create Journey Schedule'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Select Bus</label>
                <select
                  value={busId}
                  onChange={(e) => setBusId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer text-white"
                >
                  {buses.map(b => (
                    <option key={b.id} value={b.id}>{b.busName} - {b.busNumber} ({b.busType})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Select Route</label>
                <select
                  value={routeId}
                  onChange={(e) => setRouteId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer text-white"
                >
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.sourceCity} ➔ {r.destinationCity} ({r.distance} km)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Departure Date</label>
                <input
                  type="date"
                  required
                  value={departureDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-white cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Dep. Time (HH:MM)</label>
                  <input
                    type="text"
                    required
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    placeholder="08:30"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Arr. Time (HH:MM)</label>
                  <input
                    type="text"
                    required
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    placeholder="14:00"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Ticket Fare ($)</label>
                <input
                  type="number"
                  required
                  value={fare}
                  onChange={(e) => setFare(e.target.value)}
                  placeholder="650"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2 mt-4"
              >
                {submitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Schedule'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
