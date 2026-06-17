const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  return localStorage.getItem('couplesync_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

export const api = {
  // Auth
  register: (data: { email: string; name: string; password: string; coupleCode?: string }) =>
    request<{ token: string; user: any; coupleCode: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: any; coupleCode: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request<{ user: any; partner: any }>('/api/auth/me'),

  getCoupleCode: () => request<{ coupleCode: string }>('/api/auth/couple-code'),

  // Events
  getEvents: () => request<{ events: any[] }>('/api/events'),

  createEvent: (data: { title: string; description?: string; startTime: string; endTime: string; isBusy?: boolean }) =>
    request<{ event: any }>('/api/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateEvent: (id: string, data: any) =>
    request<{ event: any }>(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteEvent: (id: string) =>
    request<{ message: string }>(`/api/events/${id}`, {
      method: 'DELETE',
    }),

  getConflicts: () => request<{ conflicts: any[] }>('/api/events/conflicts'),

  // Mood
  createMoodCheckin: (data: { mood: string; note?: string }) =>
    request<{ checkin: any }>('/api/mood', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMoodCheckins: (days?: number) =>
    request<{ checkins: any[] }>(`/api/mood${days ? `?days=${days}` : ''}`),

  // Subscription
  getSubscription: () => request<{ subscription: any }>('/api/subscription'),

  upgradeSubscription: () => request<{ message: string; tier: string }>('/api/subscription/upgrade', {
    method: 'POST',
  }),

  cancelSubscription: () => request<{ message: string; tier: string }>('/api/subscription/cancel', {
    method: 'POST',
  }),
};