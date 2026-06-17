import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import type { CalendarEvent, ConflictAlert, MoodCheckin } from '../types';

export default function Dashboard() {
  const { user, partner } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [conflicts, setConflicts] = useState<ConflictAlert[]>([]);
  const [tier, setTier] = useState('free');
  const [mood, setMood] = useState('');
  const [moodNote, setMoodNote] = useState('');
  const [recentMoods, setRecentMoods] = useState<MoodCheckin[]>([]);
  const [moodSubmitted, setMoodSubmitted] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [eventsData, conflictsData, subData] = await Promise.all([
        api.getEvents(),
        api.getConflicts(),
        api.getSubscription(),
      ]);
      setEvents(eventsData.events);
      setConflicts(conflictsData.conflicts);
      setTier(subData.subscription.tier);

      if (subData.subscription.tier === 'premium') {
        const moodData = await api.getMoodCheckins(3);
        setRecentMoods(moodData.checkins);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  }

  async function handleMoodSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mood) return;
    try {
      await api.createMoodCheckin({ mood, note: moodNote });
      setMoodSubmitted(true);
      const moodData = await api.getMoodCheckins(3);
      setRecentMoods(moodData.checkins);
    } catch (err) {
      console.error('Failed to submit mood', err);
    }
  }

  const todayEvents = events.filter((e) => {
    const today = new Date().toISOString().split('T')[0];
    return e.start_time.startsWith(today);
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Hello, {user?.name}!
        </h1>
        <p className="text-gray-500">{dateStr}</p>
        {partner && (
          <p className="text-gray-500 text-sm mt-1">
            Synced with <span className="font-medium text-gray-700">{partner.name}</span>
          </p>
        )}
        {!partner && (
          <p className="text-amber-600 text-sm mt-1">
            Waiting for your partner to join. Share your couple code!
          </p>
        )}
      </div>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚡</span>
            <div>
              <h3 className="font-semibold text-amber-800">
                {conflicts.length} scheduling conflict{conflicts.length > 1 ? 's' : ''} detected
              </h3>
              <ul className="mt-2 space-y-1">
                {conflicts.slice(0, 3).map((c, i) => (
                  <li key={i} className="text-sm text-amber-700">
                    <strong>{c.event1_user}</strong> & <strong>{c.event2_user}</strong> have overlapping events
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Today's Events */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Today's Events</h2>
          <Link to="/calendar" className="text-sm text-pink-600 hover:underline">
            View all
          </Link>
        </div>

        {todayEvents.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">No events scheduled today</p>
        ) : (
          <div className="space-y-2">
            {todayEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${event.is_busy ? 'bg-red-400' : 'bg-green-400'}`} />
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-800">{event.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                    {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {event.user_name && ` • ${event.user_name}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions row */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          to="/calendar"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-pink-200 transition text-center"
        >
          <div className="text-3xl mb-2">📅</div>
          <p className="font-medium text-gray-800 text-sm">Add Event</p>
        </Link>

        <Link
          to={tier === 'premium' ? '#' : '/subscription'}
          onClick={(e) => { if (tier !== 'premium') return; e.preventDefault(); }}
          className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition text-center ${
            tier === 'premium' ? 'hover:border-pink-200' : 'opacity-60'
          }`}
        >
          <div className="text-3xl mb-2">💡</div>
          <p className="font-medium text-gray-800 text-sm">Date Ideas</p>
          {tier !== 'premium' && <p className="text-xs text-gray-400 mt-1">Premium</p>}
        </Link>
      </div>

      {/* Mood Check-in (Premium) */}
      {tier === 'premium' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Mood Check-in</h2>

          {moodSubmitted ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm text-center">
              Checked in for today! 💜
            </div>
          ) : (
            <form onSubmit={handleMoodSubmit} className="space-y-3">
              <div className="flex gap-2">
                {['😊', '😐', '😢', '😤', '🥰', '😴'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setMood(emoji)}
                    className={`text-2xl p-2 rounded-lg transition ${
                      mood === emoji ? 'bg-pink-100 scale-110' : 'hover:bg-gray-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                placeholder="Add a note (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none"
              />
              <button
                type="submit"
                disabled={!mood}
                className="w-full py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg text-sm hover:opacity-90 transition disabled:opacity-50"
              >
                Check in
              </button>
            </form>
          )}

          {recentMoods.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Recent check-ins</p>
              {recentMoods.map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-sm">
                  <span className="text-lg">{m.mood}</span>
                  <span className="text-gray-600">{m.user_name}</span>
                  <span className="text-gray-400">• {m.date}</span>
                  {m.note && <span className="text-gray-500 truncate">— {m.note}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tier === 'free' && (
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-5 border border-pink-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Upgrade to Premium</h3>
              <p className="text-sm text-gray-600 mt-1">
                Unlock mood check-ins, date night suggestions, and more.
              </p>
            </div>
            <Link
              to="/subscription"
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg text-sm hover:opacity-90"
            >
              $4.99/mo
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}