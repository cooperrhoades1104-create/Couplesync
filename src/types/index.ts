export interface User {
  id: string;
  email: string;
  name: string;
  coupleId: string | null;
  coupleCode?: string;
}

export interface Partner {
  id: string;
  email: string;
  name: string;
}

export interface CalendarEvent {
  id: string;
  couple_id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_busy: number;
  user_name?: string;
  created_at: string;
}

export interface MoodCheckin {
  id: string;
  user_id: string;
  couple_id: string;
  mood: string;
  note: string | null;
  date: string;
  user_name?: string;
}

export interface Subscription {
  id?: string;
  couple_id?: string;
  tier: string;
  status: string;
}

export interface ConflictAlert {
  event1_id: string;
  event1_title: string;
  event1_start: string;
  event1_end: string;
  event1_user: string;
  event2_id: string;
  event2_title: string;
  event2_start: string;
  event2_end: string;
  event2_user: string;
}