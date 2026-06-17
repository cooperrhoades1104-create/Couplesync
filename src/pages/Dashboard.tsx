import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import type { CalendarEvent, ConflictAlert, MoodCheckin } from '../types';

const moods = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '🥰', label: 'Loved' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '😴', label: 'Tired' },
];

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
      <div className="flex items-center gap-4">
        <img src="/logo-v2.png" alt="CoupleSync" className="w-12 h-12 rounded-xl" />
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">
            Hello, {user?.name}!
          </h1>
          <p className="text-muted text-sm">{dateStr}</p>
          {partner ? (
            <p className="text-muted text-xs mt-0.5">
              Synced with <span className="font-medium text-charcoal">{partner.name}</span>
            </p>
          ) : (
            <p className="text-gold-600 text-xs mt-0.5 font-medium">
              Waiting for your partner. Share your couple code!
            </p>
          )}
        </div>
      </div>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-card p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">⚡</span>
            <div>
              <h3 className="font-semibold text-rose-800">
                {conflicts.length} scheduling conflict{conflicts.length > 1 ? 's' : ''}
              </h3>
              <ul className="mt-2 space-y-1">
                {conflicts.slice(0, 3).map((c, i) => (
                  <li key={i} className="text-sm text-rose-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose flex-shrink-0" />
                    <strong>{c.event1_user}</strong> & <strong>{c.event2_user}</strong> have overlapping events
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Today's Events Card */}
      <div className="bg-white rounded-card shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-charcoal">Today's Events</h2>
          <Link to="/calendar" className="text-sm text-rose hover:underline font-medium">
            View all
          </Link>
        </div>

        {todayEvents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted text-sm">Nothing scheduled today</p>
            <Link to="/calendar" className="mt-2 inline-block text-rose text-sm font-medium hover:underline">
              Add an event
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {todayEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-3 p-3 bg-cream rounded-lg">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  event.user_id === user?.id ? 'bg-rose' : 'bg-gold'
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-sm text-charcoal">{event.title}</p>
                  <p className="text-xs text-muted">
                    {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' — '}
                    {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {event.user_name && <span> • {event.user_name}</span>}
                    {event.is_busy === 1 && <span className="ml-2 text-rose">🔴 Busy</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          to="/calendar"
          className="bg-white rounded-card shadow-card p-5 hover:border-rose/30 hover:shadow-md transition-all text-center border border-transparent"
        >
          <div className="text-3xl mb-2">📅</div>
          <p className="font-medium text-charcoal text-sm">Add Event</p>
        </Link>

        <div className={`bg-white rounded-card shadow-card p-5 text-center border border-transparent ${
          tier !== 'premium' ? 'opacity-60' : 'hover:border-gold/30 hover:shadow-md transition-all'
        }`}>
          <div className="text-3xl mb-2">💡</div>
          <p className="font-medium text-charcoal text-sm">Date Ideas</p>
          {tier !== 'premium' && (
            <Link to="/subscription" className="text-xs text-gold-600 font-medium mt-1 inline-block">
              Premium
            </Link>
          )}
        </div>
      </div>

      {/* Mood Check-in (Premium) */}
      {tier === 'premium' && (
        <div className="bg-white rounded-card shadow-card p-5">
          <h2 className="text-lg font-semibold text-charcoal mb-3">Mood Check-in</h2>

          {moodSubmitted ? (
            <div className="bg-rose-50 text-rose-700 p-4 rounded-card text-sm text-center font-medium">
              Checked in for today! 💜
            </div>
          ) : (
            <form onSubmit={handleMoodSubmit} className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                {moods.map((m) => (
                  <button
                    key={m.emoji}
                    type="button"
                    onClick={() => setMood(m.emoji)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg transition min-w-[52px] ${
                      mood === m.emoji ? 'bg-rose-50 scale-110 shadow-sm' : 'hover:bg-gray-50'
                    }`}
                    title={m.label}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-[10px] text-muted">{m.label}</span>
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                placeholder="Add a note (optional)"
                className="w-full px-4 py-3 border border-gray-200 rounded-input text-sm focus:ring-2 focus:ring-rose/40 focus:border-rose outline-none"
              />
              <button
                type="submit"
                disabled={!mood}
                className="w-full py-3 bg-rose text-white font-medium rounded-button text-sm hover:opacity-90 transition disabled:opacity-50 min-h-[44px]"
              >
                Check in
              </button>
            </form>
          )}

          {recentMoods.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted font-medium uppercase tracking-wide">Recent check-ins</p>
              {recentMoods.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-2 bg-cream rounded-lg text-sm">
                  <span className="text-xl">{m.mood}</span>
                  <span className="text-charcoal font-medium">{m.user_name}</span>
                  <span className="text-muted">• {m.date}</span>
                  {m.note && <span className="text-muted truncate">— {m.note}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Free Tier Upgrade Prompt */}
      {tier === 'free' && (
        <div className="bg-gradient-to-r from-rose-50 to-gold-50 rounded-card p-5 border border-rose-100">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-charcoal">Go Premium</h3>
              <p className="text-sm text-muted mt-1">
                Mood check-ins, date ideas, conflict alerts & more.
              </p>
            </div>
            <Link
              to="/subscription"
              className="px-5 py-2.5 bg-gradient-to-r from-rose to-gold text-white font-medium rounded-button text-sm hover:opacity-90 transition whitespace-nowrap"
            >
              $4.99/mo
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}