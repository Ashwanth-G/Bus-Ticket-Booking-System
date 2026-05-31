import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/authSlice.js';
import { 
  LayoutDashboard, Bus, Map, CalendarRange, Ticket, Users, LogOut, ShieldAlert, ArrowLeft, Menu, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLayout() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // If user is not an admin, block access
  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
        <ShieldAlert className="h-16 w-16 text-rose-500 mb-4 animate-bounce" />
        <h1 className="text-3xl font-extrabold mb-2">Access Denied</h1>
        <p className="text-slate-400 mb-6 text-center max-w-md">
          You do not have administrative privileges to access this area.
        </p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Return to Home
        </button>
      </div>
    );
  }

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully.');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const sidebarLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Manage Buses', path: '/admin/buses', icon: Bus },
    { name: 'Manage Routes', path: '/admin/routes', icon: Map },
    { name: 'Manage Schedules', path: '/admin/schedules', icon: CalendarRange },
    { name: 'All Bookings', path: '/admin/bookings', icon: Ticket },
    { name: 'Registered Users', path: '/admin/users', icon: Users },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-white">
            <ShieldAlert className="h-5 w-5 text-brand-400" />
            <span>SmartBus <span className="text-brand-400">Admin</span></span>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-grow p-4 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive(link.path)
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/30'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 w-full px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to User Portal
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="lg:hidden h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800">
          <button onClick={() => setMobileOpen(true)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
            <Menu className="h-6 w-6" />
          </button>
          <Link to="/" className="flex items-center gap-2 font-bold text-white">
            <span>SmartBus <span className="text-brand-400">Admin</span></span>
          </Link>
          <div className="w-6"></div> {/* Spacer */}
        </header>

        {/* Mobile Sidebar Modal Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}></div>
            
            <div className="relative flex flex-col w-64 max-w-xs bg-slate-900 border-r border-slate-850 h-full p-4 animate-slide-right">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <span className="font-bold text-white">Navigation</span>
                <button onClick={() => setMobileOpen(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-grow space-y-1">
                {sidebarLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive(link.path)
                          ? 'bg-brand-600 text-white'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {link.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => { navigate('/'); setMobileOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to User Portal
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/20 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Outlet */}
        <main className="flex-grow p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
