import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { CalendarEvent } from '../types';
import { useAuth } from '../hooks/useAuth';

export default function Calendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
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

  // Group events by date
  const groupedEvents: Record<string, CalendarEvent[]> = {};
  events.forEach((event) => {
    const date = event.start_time.split('T')[0];
    if (!groupedEvents[date]) groupedEvents[date] = [];
    groupedEvents[date].push(event);
  });

  const sortedDates = Object.keys(groupedEvents).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Shared Calendar</h1>
          <p className="text-gray-500 text-sm">View and manage events with your partner</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg text-sm hover:opacity-90 transition"
        >
          {showForm ? 'Cancel' : '+ New Event'}
        </button>
      </div>

      {/* Event Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h3 className="font-semibold text-gray-800">
            {editingEvent ? 'Edit Event' : 'New Event'}
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none"
                required
              />
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isBusy}
              onChange={(e) => setIsBusy(e.target.checked)}
              className="rounded border-gray-300 text-pink-500 focus:ring-pink-400"
            />
            <span className="text-sm text-gray-700">Mark as busy (unavailable)</span>
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg text-sm hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingEvent ? 'Update' : 'Create'}
            </button>
            {editingEvent && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Calendar View */}
      {sortedDates.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📅</div>
          <p className="text-gray-500">No events yet</p>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="mt-4 text-pink-600 font-medium hover:underline text-sm"
          >
            Create your first event
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((date) => {
            const dateObj = new Date(date + 'T00:00:00');
            const dateLabel = dateObj.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            });
            const isToday = date === new Date().toISOString().split('T')[0];

            return (
              <div key={date} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className={`px-5 py-3 ${isToday ? 'bg-pink-50' : 'bg-gray-50'}`}>
                  <h3 className={`font-semibold ${isToday ? 'text-pink-800' : 'text-gray-800'}`}>
                    {dateLabel}
                    {isToday && <span className="ml-2 text-xs bg-pink-200 text-pink-800 px-2 py-0.5 rounded-full">Today</span>}
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {groupedEvents[date].map((event) => (
                    <div key={event.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 group">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${event.is_busy ? 'bg-red-400' : 'bg-green-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-800 truncate">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {event.user_name && <span> • {event.user_name}</span>}
                          {event.is_busy === 1 && <span className="ml-2 text-red-500">🔴 Busy</span>}
                        </p>
                      </div>
                      {event.user_id === user?.id && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => editEvent(event)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 text-xs"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 text-xs"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}