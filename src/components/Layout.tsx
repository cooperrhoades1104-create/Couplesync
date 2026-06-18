import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useClerk } from '@clerk/clerk-react';
import { api } from '../lib/api';
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
  const { user, partner } = useAuth();
  const { signOut } = useClerk();
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
    <div className="min-h-screen bg-cream">
      {/* Top Navigation */}
      <header className="bg-white/90 backdrop-blur-md border-b border-rose-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="gradient-heading text-xl font-bold">
              CoupleSync
            </Link>
            <nav className="hidden sm:flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-button text-sm font-medium transition ${
                    location.pathname === item.path
                      ? 'bg-rose-50 text-rose'
                      : 'text-muted hover:text-charcoal hover:bg-gray-100'
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
                className="text-xs bg-gradient-to-r from-rose to-gold text-white px-3 py-1.5 rounded-full font-medium hover:opacity-90 transition"
              >
                Upgrade
              </Link>
            ) : (
              <span className="text-xs bg-gold-100 text-gold-700 px-3 py-1.5 rounded-full font-medium">
                Premium
              </span>
            )}

            <div className="flex items-center gap-2 text-sm text-muted">
              <span className="hidden sm:inline">{user?.name}</span>
              {partner && (
                <span className="hidden sm:inline text-muted">+ {partner.name}</span>
              )}
            </div>

            <button
              onClick={() => signOut()}
              className="text-sm text-muted hover:text-rose transition px-2"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <nav className="sm:hidden flex border-t border-rose-100 bg-white">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 py-3 text-center text-sm font-medium transition ${
                location.pathname === item.path
                  ? 'text-rose'
                  : 'text-muted'
              }`}
            >
              <div className="text-lg">{item.icon}</div>
              <div className={location.pathname === item.path ? 'text-rose' : 'text-muted'}>{item.label}</div>
            </Link>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-5 py-6 pb-24 sm:pb-6">
        <Outlet />
      </main>
    </div>
  );
}