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

const dateIdeas = [
  { id: 1, title: 'Cozy Movie Night', category: 'cozy', description: 'Pick a film neither of you has seen, make popcorn, and turn off your phones.', emoji: '🎬', timeOfDay: 'evening', budget: 'budget' },
  { id: 2, title: 'Sunset Picnic', category: 'romantic', description: 'Pack simple snacks, a blanket, and find a spot to watch the sunset together.', emoji: '🌅', timeOfDay: 'evening', budget: 'budget' },
  { id: 3, title: 'Cooking Challenge', category: 'adventurous', description: "Pick a cuisine you've never tried cooking. Bonus points for not burning anything!", emoji: '🍳', timeOfDay: 'any', budget: 'moderate' },
  { id: 4, title: 'Board Game Night', category: 'cozy', description: 'Dust off the board games or try a new two-player game. Winner picks next date.', emoji: '🎲', timeOfDay: 'evening', budget: 'free' },
  { id: 5, title: 'Stargazing Date', category: 'romantic', description: 'Head out to a dark spot, bring hot cocoa, and use a stargazing app.', emoji: '✨', timeOfDay: 'evening', budget: 'free' },
  { id: 6, title: 'DIY Spa Night', category: 'cozy', description: 'Face masks, candles, soft music, and taking turns giving foot rubs.', emoji: '🛁', timeOfDay: 'evening', budget: 'budget' },
  { id: 7, title: 'Farmers Market Stroll', category: 'foodie', description: 'Walk the stalls, share a pastry, and pick ingredients to cook together later.', emoji: '🥖', timeOfDay: 'morning', budget: 'moderate' },
  { id: 8, title: 'Karaoke Night', category: 'adventurous', description: 'YouTube karaoke in the living room. No judging, just laughing.', emoji: '🎤', timeOfDay: 'evening', budget: 'free' },
  { id: 9, title: 'Art Gallery Walk', category: 'cultural', description: 'Visit a local gallery or museum. Discuss which piece spoke to each of you.', emoji: '🎨', timeOfDay: 'afternoon', budget: 'moderate' },
  { id: 10, title: 'Hike & Picnic', category: 'adventurous', description: 'Find a local trail, pack sandwiches, and enjoy the view at the top.', emoji: '🥾', timeOfDay: 'morning', budget: 'free' },
  { id: 11, title: 'Bookstore Date', category: 'cozy', description: 'Pick a book for each other in 10 minutes. Read a chapter aloud over coffee.', emoji: '📚', timeOfDay: 'afternoon', budget: 'budget' },
  { id: 12, title: 'Dance Lesson', category: 'adventurous', description: 'YouTube dance tutorial. Learn a simple routine together (salsa, swing, or silly).', emoji: '💃', timeOfDay: 'evening', budget: 'free' },
  { id: 13, title: 'Wine & Paint Night', category: 'foodie', description: "Grab a bottle and canvases. Paint something abstract or each other's portrait.", emoji: '🍷', timeOfDay: 'evening', budget: 'moderate' },
  { id: 14, title: 'Bike Ride Adventure', category: 'adventurous', description: 'Explore a new neighborhood or bike trail. Stop for coffee halfway.', emoji: '🚲', timeOfDay: 'morning', budget: 'free' },
  { id: 15, title: 'Staycation', category: 'romantic', description: "Pretend you're tourists in your own city. Visit a landmark you've never seen.", emoji: '🏙️', timeOfDay: 'any', budget: 'moderate' },
];

export default function Dashboard() {
  const { user, partner } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [conflicts, setConflicts] = useState<ConflictAlert[]>([]);
  const [dismissedConflicts, setDismissedConflicts] = useState<Set<string>>(new Set());
  const [tier, setTier] = useState('free');
  const [mood, setMood] = useState('');
  const [moodNote, setMoodNote] = useState('');
  const [recentMoods, setRecentMoods] = useState<MoodCheckin[]>([]);
  const [moodSubmitted, setMoodSubmitted] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [surpriseIdea, setSurpriseIdea] = useState<typeof dateIdeas[0] | null>(null);

  useEffect(() => { loadData(); }, []);

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

  function dismissConflict(key: string) {
    setDismissedConflicts(prev => new Set(prev).add(key));
  }

  function getOverlapDuration(c: ConflictAlert): string {
    const s1 = new Date(c.event1_start).getTime();
    const e1 = new Date(c.event1_end).getTime();
    const s2 = new Date(c.event2_start).getTime();
    const e2 = new Date(c.event2_end).getTime();
    const overlapStart = Math.max(s1, s2);
    const overlapEnd = Math.min(e1, e2);
    const mins = Math.round((overlapEnd - overlapStart) / 60000);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const todayEvents = events.filter((e) => {
    const today = new Date().toISOString().split('T')[0];
    return e.start_time.startsWith(today);
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const filteredIdeas = dateFilter === 'all'
    ? dateIdeas
    : dateIdeas.filter(d => d.category === dateFilter || d.timeOfDay === dateFilter);

  function surpriseMe() {
    const pick = dateIdeas[Math.floor(Math.random() * dateIdeas.length)];
    setSurpriseIdea(pick);
  }

  async function addIdeaToCalendar(idea: typeof dateIdeas[0]) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startStr = tomorrow.toISOString().split('T')[0] + 'T19:00:00.000Z';
    const endStr = tomorrow.toISOString().split('T')[0] + 'T21:00:00.000Z';
    try {
      await api.createEvent({
        title: `Date Night: ${idea.title}`,
        description: idea.description,
        startTime: startStr,
        endTime: endStr,
      });
      alert(`"${idea.title}" added to your calendar for tomorrow evening!`);
      loadData();
    } catch (err: any) {
      alert('Failed to add to calendar: ' + err.message);
    }
  }

  const activeConflicts = conflicts.filter(c =>
    !dismissedConflicts.has(`${c.event1_id}-${c.event2_id}`)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <img src="/logo-v2.png" alt="CoupleSync" className="w-12 h-12 rounded-xl" />
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Hello, {user?.name}!</h1>
          <p className="text-muted text-sm">{dateStr}</p>
          {partner ? (
            <p className="text-muted text-xs mt-0.5">Synced with <span className="font-medium text-charcoal">{partner.name}</span></p>
          ) : (
            <p className="text-gold-600 text-xs mt-0.5 font-medium">Waiting for your partner. Share your couple code!</p>
          )}
        </div>
      </div>

      {/* Conflict Alerts — Premium */}
      {tier === 'premium' && activeConflicts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <h2 className="font-semibold text-charcoal">{activeConflicts.length} scheduling conflict{activeConflicts.length > 1 ? 's' : ''}</h2>
          </div>
          {activeConflicts.map((c) => {
            const key = `${c.event1_id}-${c.event2_id}`;
            return (
              <div key={key} className="bg-rose-50 border border-rose-200 rounded-card p-4 relative">
                <button onClick={() => dismissConflict(key)} className="absolute top-3 right-3 text-rose-400 hover:text-rose-600 transition text-lg leading-none" title="Dismiss">&times;</button>
                <div className="space-y-3">
                  <p className="text-sm text-rose-800 font-medium">Overlap: <strong>{getOverlapDuration(c)}</strong></p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/70 rounded-lg p-3 border border-rose-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose" />
                        <span className="font-medium text-sm text-charcoal">{c.event1_user}</span>
                      </div>
                      <p className="text-sm font-medium text-charcoal">{c.event1_title}</p>
                      <p className="text-xs text-muted mt-0.5">{formatTime(c.event1_start)} — {formatTime(c.event1_end)}</p>
                    </div>
                    <div className="bg-white/70 rounded-lg p-3 border border-rose-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-gold" />
                        <span className="font-medium text-sm text-charcoal">{c.event2_user}</span>
                      </div>
                      <p className="text-sm font-medium text-charcoal">{c.event2_title}</p>
                      <p className="text-xs text-muted mt-0.5">{formatTime(c.event2_start)} — {formatTime(c.event2_end)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/calendar" className="px-3 py-1.5 bg-rose text-white text-xs font-medium rounded-button hover:opacity-90 transition">Reschedule</Link>
                    <button onClick={() => dismissConflict(key)} className="px-3 py-1.5 border border-rose-200 text-rose-700 text-xs font-medium rounded-button hover:bg-rose-50 transition">Dismiss</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Conflict Alerts — Free tier teaser */}
      {tier !== 'premium' && conflicts.length > 0 && (
        <div className="bg-rose-50/50 border border-rose-200 border-dashed rounded-card p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">⚡</span>
            <div className="flex-1">
              <h3 className="font-semibold text-rose-800">{conflicts.length} scheduling conflict{conflicts.length > 1 ? 's' : ''} detected</h3>
              <p className="text-sm text-rose-600 mt-1">Upgrade to Premium to see conflict details, overlap times, and reschedule options.</p>
              <Link to="/subscription" className="mt-3 inline-block px-4 py-2 bg-gradient-to-r from-rose to-gold text-white text-xs font-medium rounded-button hover:opacity-90 transition">Upgrade — $4.99/mo</Link>
            </div>
          </div>
        </div>
      )}

      {/* Today's Events Card */}
      <div className="bg-white rounded-card shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-charcoal">Today's Events</h2>
          <Link to="/calendar" className="text-sm text-rose hover:underline font-medium">View all</Link>
        </div>
        {todayEvents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted text-sm">Nothing scheduled today</p>
            <Link to="/calendar" className="mt-2 inline-block text-rose text-sm font-medium hover:underline">Add an event</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {todayEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-3 p-3 bg-cream rounded-lg">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${event.user_id === user?.id ? 'bg-rose' : 'bg-gold'}`} />
                <div className="flex-1">
                  <p className="font-medium text-sm text-charcoal">{event.title}</p>
                  <p className="text-xs text-muted">{new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{event.user_name && <span> • {event.user_name}</span>}{event.is_busy === 1 && <span className="ml-2 text-rose"> Busy</span>}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/calendar" className="bg-white rounded-card shadow-card p-5 hover:border-rose/30 hover:shadow-md transition-all text-center border border-transparent">
          <div className="text-3xl mb-2">📅</div>
          <p className="font-medium text-charcoal text-sm">Add Event</p>
        </Link>
        <Link to={tier === 'premium' ? '#date-ideas' : '/subscription'} className={`bg-white rounded-card shadow-card p-5 text-center border border-transparent ${tier !== 'premium' ? 'opacity-60' : 'hover:border-gold/30 hover:shadow-md transition-all'}`}>
          <div className="text-3xl mb-2">💡</div>
          <p className="font-medium text-charcoal text-sm">Date Ideas</p>
          {tier !== 'premium' && <span className="text-xs text-gold-600 font-medium mt-1 inline-block">Premium</span>}
        </Link>
      </div>

      {/* Date Night Suggestions — Premium */}
      {tier === 'premium' && (
        <div id="date-ideas" className="bg-white rounded-card shadow-card p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-semibold text-charcoal">Date Night Ideas</h2>
            <button onClick={surpriseMe} className="px-3 py-1.5 bg-gradient-to-r from-rose to-gold text-white text-xs font-medium rounded-button hover:opacity-90 transition"> Surprise Me!</button>
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {['all', 'cozy', 'romantic', 'adventurous', 'foodie', 'cultural'].map((cat) => (
              <button key={cat} onClick={() => setDateFilter(cat)} className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition ${dateFilter === cat ? 'bg-rose text-white' : 'bg-gray-100 text-muted hover:bg-gray-200'}`}>{cat === 'all' ? 'All' : cat}</button>
            ))}
          </div>
          {surpriseIdea && (
            <div className="bg-gradient-to-r from-rose-50 to-gold-50 rounded-card p-4 mb-4 border border-rose-100">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{surpriseIdea.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-charcoal">{surpriseIdea.title}</h3>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full text-muted capitalize">{surpriseIdea.category}</span>
                  </div>
                  <p className="text-sm text-muted mt-1">{surpriseIdea.description}</p>
                  <button onClick={() => addIdeaToCalendar(surpriseIdea)} className="mt-2 px-3 py-1.5 bg-rose text-white text-xs font-medium rounded-button hover:opacity-90 transition"> Add to Calendar</button>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredIdeas.map((idea) => (
              <div key={idea.id} className="bg-cream rounded-lg p-3 border border-gray-100 hover:border-rose/30 hover:shadow-sm transition-all cursor-pointer" onClick={() => setSurpriseIdea(idea)}>
                <div className="text-2xl mb-1">{idea.emoji}</div>
                <h3 className="font-semibold text-charcoal text-sm">{idea.title}</h3>
                <p className="text-xs text-muted mt-1 line-clamp-2">{idea.description}</p>
                <div className="flex gap-1 mt-2">
                  <span className="text-[10px] bg-white px-1.5 py-0.5 rounded text-muted capitalize">{idea.category}</span>
                  <span className="text-[10px] bg-white px-1.5 py-0.5 rounded text-muted capitalize">{idea.budget}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mood Check-in (Premium) */}
      {tier === 'premium' && (
        <div className="bg-white rounded-card shadow-card p-5">
          <h2 className="text-lg font-semibold text-charcoal mb-3">Mood Check-in</h2>
          {moodSubmitted ? (
            <div className="bg-rose-50 text-rose-700 p-4 rounded-card text-sm text-center font-medium">Checked in for today! </div>
          ) : (
            <form onSubmit={handleMoodSubmit} className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                {moods.map((m) => (
                  <button key={m.emoji} type="button" onClick={() => setMood(m.emoji)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg transition min-w-[52px] ${mood === m.emoji ? 'bg-rose-50 scale-110 shadow-sm' : 'hover:bg-gray-50'}`} title={m.label}>
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-[10px] text-muted">{m.label}</span>
                  </button>
                ))}
              </div>
              <input type="text" value={moodNote} onChange={(e) => setMoodNote(e.target.value)}
                placeholder="Add a note (optional)"
                className="w-full px-4 py-3 border border-gray-200 rounded-input text-sm focus:ring-2 focus:ring-rose/40 focus:border-rose outline-none" />
              <button type="submit" disabled={!mood}
                className="w-full py-3 bg-rose text-white font-medium rounded-button text-sm hover:opacity-90 transition disabled:opacity-50 min-h-[44px]">Check in</button>
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
              <p className="text-sm text-muted mt-1">Mood check-ins, date ideas, conflict alerts & more.</p>
            </div>
            <Link to="/subscription" className="px-5 py-2.5 bg-gradient-to-r from-rose to-gold text-white font-medium rounded-button text-sm hover:opacity-90 transition whitespace-nowrap">$4.99/mo</Link>
          </div>
        </div>
      )}
    </div>
  );
}
