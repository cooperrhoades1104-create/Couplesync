import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { CalendarEvent } from '../types';
import { useAuth } from '../hooks/useAuth';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const data = await api.getEvents();
      setEvents(data.events);
    } catch (err) {
      console.error('Failed to load events', err);
    }
  }

  function resetForm() {
    setTitle('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    setIsBusy(false);
    setEditingEvent(null);
    setShowForm(false);
    setSelectedDate(null);
  }

  function openNewEvent(date?: Date) {
    resetForm();
    if (date) {
      const ymd = date.toISOString().split('T')[0];
      setStartTime(`${ymd}T09:00`);
      setEndTime(`${ymd}T10:00`);
      setSelectedDate(date);
    }
    setShowForm(true);
  }

  function editEvent(event: CalendarEvent) {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description || '');
    setStartTime(event.start_time.slice(0, 16));
    setEndTime(event.end_time.slice(0, 16));
    setIsBusy(event.is_busy === 1);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const start = new Date(startTime).toISOString();
      const end = new Date(endTime).toISOString();

      if (editingEvent) {
        await api.updateEvent(editingEvent.id, { title, description, startTime: start, endTime: end, isBusy });
      } else {
        await api.createEvent({ title, description, startTime: start, endTime: end, isBusy });
      }
      resetForm();
      await loadEvents();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteEvent(id: string) {
    if (!confirm('Delete this event?')) return;
    try {
      await api.deleteEvent(id);
      await loadEvents();
    } catch (err: any) {
      alert(err.message);
    }
  }

  // Calendar helpers
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startPad = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  function getEventsForDate(dateStr: string) {
    return events.filter((e) => e.start_time.startsWith(dateStr));
  }

  function prevMonth() { setCurrentMonth(new Date(year, month - 1)); }
  function nextMonth() { setCurrentMonth(new Date(year, month + 1)); }

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  function getWeekDates(): Date[] {
    const start = new Date(currentMonth);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Shared Calendar</h1>
          <p className="text-muted text-sm">View and manage events with your partner</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-white rounded-button shadow-sm border border-gray-100 p-0.5">
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-1.5 rounded-button text-xs font-medium transition ${
                viewMode === 'month' ? 'bg-rose text-white shadow-sm' : 'text-muted hover:text-charcoal'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-1.5 rounded-button text-xs font-medium transition ${
                viewMode === 'week' ? 'bg-rose text-white shadow-sm' : 'text-muted hover:text-charcoal'
              }`}
            >
              Week
            </button>
          </div>
          <button
            onClick={() => openNewEvent(new Date())}
            className="px-4 py-2 bg-rose text-white font-medium rounded-button text-sm hover:opacity-90 transition"
          >
            + New
          </button>
        </div>
      </div>

      {/* Event Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-card shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-charcoal">
                {editingEvent ? 'Edit Event' : 'New Event'}
              </h3>
              <button onClick={resetForm} className="text-muted hover:text-charcoal text-xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-input focus:ring-2 focus:ring-rose/40 focus:border-rose outline-none"
                  placeholder="What's happening?" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-input focus:ring-2 focus:ring-rose/40 focus:border-rose outline-none resize-none"
                  rows={2} placeholder="Add details (optional)" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Start</label>
                  <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-input focus:ring-2 focus:ring-rose/40 focus:border-rose outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">End</label>
                  <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-input focus:ring-2 focus:ring-rose/40 focus:border-rose outline-none" required />
                </div>
              </div>
              <label className="flex items-center gap-3 py-2">
                <input type="checkbox" checked={isBusy} onChange={(e) => setIsBusy(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-rose focus:ring-rose/40" />
                <span className="text-sm text-charcoal">Mark as busy (unavailable)</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 bg-rose text-white font-medium rounded-button text-sm hover:opacity-90 transition disabled:opacity-50 min-h-[44px]">
                  {loading ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
                </button>
                {editingEvent && (
                  <button type="button" onClick={resetForm}
                    className="px-6 py-3 border border-gray-200 text-charcoal font-medium rounded-button text-sm hover:bg-gray-50 min-h-[44px]">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between bg-white rounded-card shadow-card p-4">
        <button onClick={prevMonth} className="w-10 h-10 flex items-center justify-center text-muted hover:text-rose hover:bg-rose-50 rounded-lg transition">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h2 className="text-lg font-semibold text-charcoal">{monthLabel}</h2>
        <button onClick={nextMonth} className="w-10 h-10 flex items-center justify-center text-muted hover:text-rose hover:bg-rose-50 rounded-lg transition">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-3 text-center text-xs font-medium text-muted uppercase tracking-wide">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[80px] sm:min-h-[100px] p-1.5 border-b border-r border-gray-50 bg-cream/50" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = getEventsForDate(dateStr);
              const isToday = dateStr === todayStr;
              return (
                <div key={day} className={`min-h-[80px] sm:min-h-[100px] p-1.5 border-b border-r border-gray-50 cursor-pointer hover:bg-cream/80 transition group ${isToday ? 'bg-rose-50/30' : ''}`}
                  onClick={() => openNewEvent(new Date(year, month, day))}>
                  <div className={`flex items-center justify-center w-7 h-7 text-sm mb-1 ${
                    isToday ? 'bg-rose text-white rounded-full font-semibold' : 'text-charcoal'
                  }`}>{day}</div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div key={event.id} onClick={(e) => { e.stopPropagation(); editEvent(event); }}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${
                          event.user_id === user?.id ? 'bg-rose-100 text-rose-800' : 'bg-gold-100 text-gold-800'
                        }`}>
                        {formatTime(event.start_time)} {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && <div className="text-[10px] text-muted px-1">+{dayEvents.length - 3} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {getWeekDates().map((date, i) => {
              const dateStr = date.toISOString().split('T')[0];
              const isToday = dateStr === todayStr;
              return (
                <div key={i} className="py-3 text-center">
                  <div className="text-xs text-muted">{WEEKDAYS[date.getDay()]}</div>
                  <div className={`text-sm mt-0.5 w-8 h-8 flex items-center justify-center mx-auto ${
                    isToday ? 'bg-rose text-white rounded-full font-semibold' : 'text-charcoal'
                  }`}>{date.getDate()}</div>
                </div>
              );
            })}
          </div>
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 12 }).map((_, hour) => (
              <div key={hour} className="grid grid-cols-7 min-h-[60px]">
                {getWeekDates().map((date, di) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const hourEvents = events.filter((e) => {
                    const eDate = e.start_time.split('T')[0];
                    const eHour = parseInt(e.start_time.split('T')[1]?.split(':')[0] || '0');
                    return eDate === dateStr && eHour === hour;
                  });
                  return (
                    <div key={di} className="border-r border-gray-50 p-1 relative group cursor-pointer hover:bg-cream/50"
                      onClick={() => { const d = new Date(date); d.setHours(hour, 0, 0, 0); openNewEvent(d); }}>
                      {hourEvents.map((event) => (
                        <div key={event.id} onClick={(e) => { e.stopPropagation(); editEvent(event); }}
                          className={`text-[10px] p-1 rounded mb-0.5 truncate font-medium ${
                            event.user_id === user?.id ? 'bg-rose-100 text-rose-800' : 'bg-gold-100 text-gold-800'
                          }`}>{event.title}</div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-5 text-sm text-muted bg-white rounded-card shadow-card p-4">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose" /><span>You</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gold" /><span>Partner</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-400" /><span>Busy</span></div>
        <div className="flex-1" />
        <button onClick={() => {
          api.getConflicts().then(d => {
            if (d.conflicts.length === 0) alert('No conflicts found!');
            else alert(`${d.conflicts.length} conflict(s) detected — check Dashboard`);
          }).catch(() => alert('Error checking conflicts'));
        }} className="text-rose text-sm font-medium hover:underline">Check conflicts</button>
      </div>
    </div>
  );
}