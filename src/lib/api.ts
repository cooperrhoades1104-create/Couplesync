const API_BASE = import.meta.env.VITE_API_URL || '';

let tokenGetter: (() => Promise<string | null>) | null = null;

export function setTokenGetter(fn: () => Promise<string | null>) {
  tokenGetter = fn;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (tokenGetter) {
    try {
      const token = await tokenGetter();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // Token fetch failed — proceed without auth header
    }
  }

  return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const headers: Record<string, string> = {
    ...authHeaders,
    ...((options.headers as Record<string, string>) || {}),
  };

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
  setTokenGetter,

  // Auth / User
  getMe: () => request<{ user: any; partner: any }>('/api/auth/me'),
  getCoupleCode: () => request<{ coupleCode: string }>('/api/auth/couple-code'),

  // Couple management
  createCouple: () =>
    request<{ code: string; coupleId: string }>('/api/couple/create', {
      method: 'POST',
    }),

  joinCouple: (code: string) =>
    request<{ coupleId: string }>('/api/couple/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

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
  upgradeSubscription: () =>
    request<{ message: string; tier: string }>('/api/subscription/upgrade', {
      method: 'POST',
    }),
  cancelSubscription: () =>
    request<{ message: string; tier: string }>('/api/subscription/cancel', {
      method: 'POST',
    }),

  // Stripe
  createCheckoutSession: () =>
    request<{ url: string | null; priceId?: string; message?: string; tier?: string }>('/api/stripe/create-checkout', {
      method: 'POST',
    }),

  confirmPayment: () =>
    request<{ message: string; tier: string }>('/api/stripe/confirm', {
      method: 'POST',
    }),
};