import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchQuery, setSearchResults } from '../features/searchSlice.js';
import api from '../services/api.js';
import toast from 'react-hot-toast';
import { 
  Search, ArrowRightLeft, Star, ShieldCheck, MapPin, Calendar, Users, Award, Heart
} from 'lucide-react';

const CITIES = ['Bangalore', 'Mumbai', 'Pune', 'Delhi', 'Jaipur', 'Chennai', 'Hyderabad', 'Goa', 'Ahmedabad', 'Kolkata'];

const POPULAR_ROUTES = [
  { source: 'Bangalore', destination: 'Goa', distance: '560 km', duration: '10h 30m', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=60' },
  { source: 'Mumbai', destination: 'Pune', distance: '150 km', duration: '03h 00m', image: 'https://images.unsplash.com/photo-1602773229774-60be7870fa3f?w=500&auto=format&fit=crop&q=60' },
  { source: 'Delhi', destination: 'Jaipur', distance: '270 km', duration: '05h 30m', image: 'https://images.unsplash.com/photo-1477584305590-38772bdbb5c0?w=500&auto=format&fit=crop&q=60' },
  { source: 'Hyderabad', destination: 'Bangalore', distance: '570 km', duration: '09h 00m', image: 'https://images.unsplash.com/photo-1596422846543-b5f64861e939?w=500&auto=format&fit=crop&q=60' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const [sourceCity, setSourceCity] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);

  const [favorites, setFavorites] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);

  // Fetch search history and favorites if logged in
  useEffect(() => {
    if (isAuthenticated) {
      api.get('/users/favorites')
        .then(res => setFavorites(res.data))
        .catch(err => console.log('Error fetching favorites:', err));
        
      api.get('/users/search-history')
        .then(res => setSearchHistory(res.data))
        .catch(err => console.log('Error fetching search history:', err));
    }
  }, [isAuthenticated]);

  const handleSwapCities = () => {
    const temp = sourceCity;
    setSourceCity(destinationCity);
    setDestinationCity(temp);
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    if (!sourceCity || !destinationCity) {
      toast.error('Please specify both source and destination cities.');
      return;
    }

    if (sourceCity === destinationCity) {
      toast.error('Source and destination cities cannot be the same.');
      return;
    }

    try {
      // Log search history in the background if authenticated
      if (isAuthenticated) {
        api.post('/users/search-history', { sourceCity, destinationCity }).catch(() => {});
      }

      dispatch(setSearchQuery({ sourceCity, destinationCity, travelDate }));
      
      const response = await api.get('/schedules', {
        params: { sourceCity, destinationCity, travelDate }
      });
      
      dispatch(setSearchResults(response.data));
      navigate('/search-results');
    } catch (error) {
      toast.error('Error fetching schedules. Please try again.');
    }
  };

  const handlePopularSearch = (source, dest) => {
    setSourceCity(source);
    setDestinationCity(dest);
    // Trigger search after state is set
    setTimeout(() => {
      // Need direct variables because state updates are batch-processed
      dispatch(setSearchQuery({ sourceCity: source, destinationCity: dest, travelDate }));
      api.get('/schedules', {
        params: { sourceCity: source, destinationCity: dest, travelDate }
      })
      .then(response => {
        dispatch(setSearchResults(response.data));
        navigate('/search-results');
      })
      .catch(() => {
        toast.error('Error performing search.');
      });
    }, 50);
  };

  return (
    <div className="flex flex-col">
      {/* 1. Hero Banner with Glassmorphism Search */}
      <section className="relative bg-slate-900 text-white py-24 px-4 overflow-hidden">
        {/* Vector Circles */}
        <div className="absolute top-[-30%] left-[-10%] w-[70%] h-[70%] bg-brand-700/20 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-[-30%] right-[-10%] w-[70%] h-[70%] bg-accent-700/20 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 font-sans">
            Search, Choose, <span className="text-accent-400">Travel Securely</span>
          </h1>
          <p className="text-slate-300 md:text-lg max-w-2xl mx-auto mb-10">
            Book premium buses on India's top routes with live seat tracking, instant digital ticket PDF, and 100% secure checkouts.
          </p>

          {/* Glassmorphic Search Widget */}
          <div className="max-w-4xl mx-auto glass-dark border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-slate-800">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
              
              {/* Source City */}
              <div className="md:col-span-2 text-left">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-accent-400" />
                  From City
                </label>
                <select
                  value={sourceCity}
                  onChange={(e) => setSourceCity(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-500 cursor-pointer"
                >
                  <option value="">Select departure</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center md:col-span-1">
                <button
                  type="button"
                  onClick={handleSwapCities}
                  className="p-2.5 rounded-full bg-slate-800 border border-slate-700 text-accent-400 hover:text-white transition-all hover:bg-slate-700 cursor-pointer shadow-md"
                >
                  <ArrowRightLeft className="h-4 w-4 md:rotate-90" />
                </button>
              </div>

              {/* Destination City */}
              <div className="md:col-span-2 text-left">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-brand-400" />
                  To City
                </label>
                <select
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-500 cursor-pointer"
                >
                  <option value="">Select destination</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Travel Date */}
              <div className="md:col-span-1 text-left">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-accent-400" />
                  Travel Date
                </label>
                <input
                  type="date"
                  value={travelDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-500 cursor-pointer"
                />
              </div>

              {/* Submit */}
              <div className="md:col-span-1 flex items-end justify-center w-full">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-700 hover:to-accent-700 text-white font-semibold rounded-xl py-3 px-4 flex items-center justify-center gap-2 transition-all hover:shadow-lg cursor-pointer"
                >
                  <Search className="h-4 w-4" />
                  <span className="md:hidden">Search</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      </section>

      {/* 2. Favorites and Search history (Isolated widget) */}
      {isAuthenticated && (favorites.length > 0 || searchHistory.length > 0) && (
        <section className="bg-slate-100 py-6 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Favorites Routes */}
            {favorites.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-rose-500 fill-rose-500" /> Saved Favorite Routes
                </h4>
                <div className="flex flex-wrap gap-2">
                  {favorites.map(fav => (
                    <button
                      key={fav.id}
                      onClick={() => handlePopularSearch(fav.sourceCity, fav.destinationCity)}
                      className="text-xs bg-white text-slate-700 border border-slate-200 hover:bg-brand-50 hover:text-brand-600 font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      {fav.sourceCity} ➔ {fav.destinationCity}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Previous Searches */}
            {searchHistory.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-accent-500" /> Recent Searches
                </h4>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map(hist => (
                    <button
                      key={hist.id}
                      onClick={() => handlePopularSearch(hist.sourceCity, hist.destinationCity)}
                      className="text-xs bg-white text-slate-600 border border-slate-200 hover:bg-accent-50 hover:text-accent-600 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      {hist.sourceCity} ➔ {hist.destinationCity}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </section>
      )}

      {/* 3. Popular Routes */}
      <section className="py-20 px-4 max-w-7xl mx-auto w-full">
        <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-2">Popular Routes</h2>
        <p className="text-slate-500 text-center max-w-md mx-auto mb-12">
          Hop on these routes with our top operators at the best price guarantees.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {POPULAR_ROUTES.map((route, i) => (
            <div
              key={i}
              onClick={() => handlePopularSearch(route.source, route.destination)}
              className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl border border-slate-100 transition-all duration-300 group cursor-pointer transform hover:-translate-y-1"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={route.image}
                  alt={`${route.source} to ${route.destination}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-bold text-lg">{route.source} ➔ {route.destination}</h3>
                  <p className="text-xs text-slate-300 font-semibold">{route.distance} | {route.duration}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Core Features Grid */}
      <section className="bg-slate-100 py-20 px-4 w-full">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-2">Why SmartBus Pro?</h2>
          <p className="text-slate-500 text-center max-w-md mx-auto mb-16">
            We provide next-generation ticketing features to ensure safety, reliability, and comfort.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm text-center">
              <div className="inline-flex items-center justify-center p-3 bg-brand-50 text-brand-600 rounded-2xl mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-2">Live Seat Tracker</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Connect directly via Socket.IO real-time channels to view seat changes instantly and secure booking statuses.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm text-center">
              <div className="inline-flex items-center justify-center p-3 bg-accent-50 text-accent-600 rounded-2xl mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-2">Role Isolation</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Experience bulletproof user isolation protecting customer profile settings, tickets, and bookings using JWT.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm text-center">
              <div className="inline-flex items-center justify-center p-3 bg-emerald-50 text-emerald-600 rounded-2xl mb-4">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-2">Instant Ticket PDF</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Download fully compiled tickets featuring booking identifiers and scan-ready QR codes immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Customer Testimonials */}
      <section className="py-20 px-4 max-w-7xl mx-auto w-full">
        <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-2">Testimonials</h2>
        <p className="text-slate-500 text-center max-w-md mx-auto mb-16">
          See what our regular commuters have to say.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-150 shadow-sm relative">
            <div className="flex items-center gap-1.5 text-amber-400 mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400" />)}
            </div>
            <p className="text-slate-600 text-sm leading-relaxed italic mb-6">
              "Booking bus tickets was never this easy. The real-time seat layout update saved me from double-booking. The download PDF option works perfectly on mobile!"
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">
                MK
              </div>
              <div>
                <h4 className="font-bold text-slate-850 text-sm">Manoj Kumar</h4>
                <p className="text-slate-400 text-xs font-semibold">Regular Commuter (Bangalore-Goa)</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-150 shadow-sm relative">
            <div className="flex items-center gap-1.5 text-amber-400 mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400" />)}
            </div>
            <p className="text-slate-600 text-sm leading-relaxed italic mb-6">
              "Highly recommend the Volvo elite sleeper buses. Simple registration, simulated OTP support helps when forgot password, and booking refund cancel system works instantly!"
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent-100 flex items-center justify-center text-accent-600 font-bold text-sm">
                SP
              </div>
              <div>
                <h4 className="font-bold text-slate-850 text-sm">Sonia Patel</h4>
                <p className="text-slate-400 text-xs font-semibold">Business Traveler (Mumbai-Pune)</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
