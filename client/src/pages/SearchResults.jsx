import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectSchedule } from '../features/bookingSlice.js';
import { setSearchResults } from '../features/searchSlice.js';
import api from '../services/api.js';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, ArrowUpDown, Clock, Filter, Sparkles, AlertCircle, ShieldAlert, Heart
} from 'lucide-react';

export default function SearchResults() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { sourceCity, destinationCity, travelDate, results } = useSelector((state) => state.search);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [sortBy, setSortBy] = useState('departureTime');
  const [busTypeFilter, setBusTypeFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  // Check if this route is favorited by user
  React.useEffect(() => {
    if (isAuthenticated) {
      api.get('/users/favorites').then(res => {
        const routeMatch = res.data.find(
          f => f.sourceCity === sourceCity && f.destinationCity === destinationCity
        );
        setIsFavorite(!!routeMatch);
      }).catch(() => {});
    }
  }, [sourceCity, destinationCity, isAuthenticated]);

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to save favorite routes.');
      return;
    }

    try {
      if (isFavorite) {
        // Find route ID first (can get from first result)
        const firstResult = results[0];
        if (firstResult) {
          await api.delete(`/users/favorites/${firstResult.routeId}`);
          setIsFavorite(false);
          toast.success('Route removed from favorites.');
        }
      } else {
        const firstResult = results[0];
        if (firstResult) {
          await api.post('/users/favorites', { routeId: firstResult.routeId });
          setIsFavorite(true);
          toast.success('Route added to favorites.');
        } else {
          toast.error('Cannot save route with no active schedules.');
        }
      }
    } catch (error) {
      toast.error('Error modifying favorites.');
    }
  };

  const handleSortChange = async (sortVal) => {
    setSortBy(sortVal);
    try {
      const response = await api.get('/schedules', {
        params: {
          sourceCity,
          destinationCity,
          travelDate,
          sortBy: sortVal,
          busType: busTypeFilter,
          departureTimeRange: timeFilter
        }
      });
      dispatch(setSearchResults(response.data));
    } catch (error) {
      toast.error('Error sorting results.');
    }
  };

  const handleFilterChange = async (filterType, val) => {
    let newBusType = busTypeFilter;
    let newTime = timeFilter;

    if (filterType === 'busType') {
      setBusTypeFilter(val);
      newBusType = val;
    } else if (filterType === 'time') {
      setTimeFilter(val);
      newTime = val;
    }

    try {
      const response = await api.get('/schedules', {
        params: {
          sourceCity,
          destinationCity,
          travelDate,
          sortBy,
          busType: newBusType,
          departureTimeRange: newTime
        }
      });
      dispatch(setSearchResults(response.data));
    } catch (error) {
      toast.error('Error applying filters.');
    }
  };

  const handleSelectBus = (schedule) => {
    // Track viewed bus in user history
    if (isAuthenticated) {
      api.post('/users/recently-viewed', { busId: schedule.busId }).catch(() => {});
    }

    dispatch(selectSchedule(schedule));
    if (!isAuthenticated) {
      toast.success('Please sign in to proceed with booking.');
      navigate('/login');
    } else {
      navigate('/seat-selection');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span>{sourceCity} ➔ {destinationCity}</span>
              <button 
                onClick={handleFavoriteToggle}
                className="focus:outline-none cursor-pointer"
                title={isFavorite ? 'Remove Favorite' : 'Save Favorite'}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'text-rose-500 fill-rose-500' : 'text-slate-400 hover:text-rose-500'}`} />
              </button>
            </h2>
            <p className="text-sm text-slate-500">
              Travel Date: <span className="font-semibold">{new Date(travelDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </p>
          </div>
        </div>

        {/* Sorting selection */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-fit">
          <span className="text-xs text-slate-500 font-semibold px-2 flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3" /> Sort By:
          </span>
          {[
            { label: 'Departure', value: 'departureTime' },
            { label: 'Arrival', value: 'arrivalTime' },
            { label: 'Price Low-High', value: 'priceLowHigh' },
            { label: 'Price High-Low', value: 'priceHighLow' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => handleSortChange(opt.value)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                sortBy === opt.value
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main grids */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left side filters panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-850 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Filter className="h-4 w-4 text-brand-600" /> Filter Options
            </h3>
            
            {/* Bus Type */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Bus Type</h4>
              <div className="space-y-2">
                {[
                  { label: 'All Types', value: '' },
                  { label: 'AC Sleeper', value: 'AC Sleeper' },
                  { label: 'Non AC', value: 'Non AC' },
                  { label: 'Volvo', value: 'Volvo' },
                  { label: 'Semi Sleeper', value: 'Semi Sleeper' },
                ].map(type => (
                  <label key={type.value} className="flex items-center gap-2.5 text-sm text-slate-650 cursor-pointer">
                    <input
                      type="radio"
                      name="busType"
                      checked={busTypeFilter === type.value}
                      onChange={() => handleFilterChange('busType', type.value)}
                      className="text-brand-600 focus:ring-brand-500 h-4 w-4 border-slate-300"
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Time Filter */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Departure Time</h4>
              <div className="space-y-2">
                {[
                  { label: 'Any Time', value: '' },
                  { label: 'Morning (06:00 - 12:00)', value: 'morning' },
                  { label: 'Afternoon (12:00 - 17:00)', value: 'afternoon' },
                  { label: 'Evening (17:00 - 21:00)', value: 'evening' },
                  { label: 'Night (21:00 - 06:00)', value: 'night' },
                ].map(time => (
                  <label key={time.value} className="flex items-center gap-2.5 text-sm text-slate-650 cursor-pointer">
                    <input
                      type="radio"
                      name="departureTime"
                      checked={timeFilter === time.value}
                      onChange={() => handleFilterChange('time', time.value)}
                      className="text-brand-600 focus:ring-brand-500 h-4 w-4 border-slate-300"
                    />
                    <span>{time.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right side results list */}
        <div className="lg:col-span-3 space-y-4">
          {results.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 shadow-sm text-center">
              <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-bold text-xl text-slate-800 mb-1">No Buses Available</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                We couldn't find any buses running between these cities for the selected date. Try choosing another travel date or adjusting filters.
              </p>
            </div>
          ) : (
            results.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-white rounded-3xl border border-slate-200 hover:border-brand-300 p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-6"
              >
                {/* Operator and Bus info */}
                <div className="flex-grow space-y-3">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 mb-1">
                      {schedule.bus.busType}
                    </span>
                    <h3 className="font-bold text-lg text-slate-850">{schedule.bus.busName}</h3>
                    <p className="text-xs text-slate-400 font-semibold">{schedule.bus.operatorName} | {schedule.bus.busNumber}</p>
                  </div>
                  
                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1.5">
                    {schedule.bus.amenities.split(',').map((am, idx) => (
                      <span key={idx} className="text-[10px] font-medium bg-slate-100 text-slate-650 px-2 py-0.5 rounded-md">
                        {am.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Journey timelines */}
                <div className="flex items-center justify-between gap-8 md:px-8 border-t md:border-t-0 md:border-x border-slate-100 pt-4 md:pt-0">
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-800">{schedule.departureTime}</p>
                    <p className="text-xs text-slate-400 font-semibold uppercase">{schedule.route.sourceCity}</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{schedule.route.duration}</span>
                    <div className="w-16 h-[2px] bg-slate-200 relative">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent-500"></div>
                    </div>
                    <span className="text-[10px] text-slate-300 font-semibold">{schedule.route.distance} km</span>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-800">{schedule.arrivalTime}</p>
                    <p className="text-xs text-slate-400 font-semibold uppercase">{schedule.route.destinationCity}</p>
                  </div>
                </div>

                {/* Price and booking */}
                <div className="flex flex-row md:flex-col justify-between items-center md:justify-center md:items-end gap-3 min-w-[120px]">
                  <div className="text-left md:text-right">
                    <p className="text-slate-400 text-xs font-semibold">Fare starts at</p>
                    <p className="text-2xl font-black text-brand-600">${schedule.fare.toFixed(2)}</p>
                    <p className="text-xs font-semibold text-emerald-600">{schedule.availableSeats} seats left</p>
                  </div>
                  <button
                    onClick={() => handleSelectBus(schedule)}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm shadow-brand-200"
                  >
                    Select Seats
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
