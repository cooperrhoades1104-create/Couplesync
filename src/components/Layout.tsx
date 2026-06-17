import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
  const { user, partner, logout } = useAuth();
  const location = useLocation();
  const [tier, setTier] = useState('free');

  useEffect(() => {
    api.getSubscription().then((data) => {
      setTier(data.subscription.tier);
    }).catch(() => {});
  }, []);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/calendar', label: 'Calendar', icon: '📅' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              CoupleSync
            </Link>
            <nav className="hidden sm:flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    location.pathname === item.path
                      ? 'bg-pink-50 text-pink-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {tier === 'free' ? (
              <Link
                to="/subscription"
                className="text-xs bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1.5 rounded-full font-medium hover:opacity-90"
              >
                Upgrade
              </Link>
            ) : (
              <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-medium">
                Premium
              </span>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="hidden sm:inline">{user?.name}</span>
              {partner && (
                <span className="hidden sm:inline text-gray-400">+ {partner.name}</span>
              )}
            </div>

            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-red-600 transition px-2"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <nav className="sm:hidden flex border-t border-gray-200">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 py-3 text-center text-sm font-medium transition ${
                location.pathname === item.path
                  ? 'text-pink-700 border-t-2 border-pink-500 -mt-px'
                  : 'text-gray-500'
              }`}
            >
              <div className="text-lg">{item.icon}</div>
              <div>{item.label}</div>
            </Link>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-6">
        <Outlet />
      </main>
    </div>
  );
}