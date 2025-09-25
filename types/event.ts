export interface Event {
  id: string;
  title: string;
  description?: string;
  creator_email?: string;
  creator_name?: string;
  share_token: string;
  status: "active" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  id: string;
  event_id: string;
  date_time: string;
  created_at: string;
}

export interface Venue {
  id: string;
  event_id: string;
  name: string;
  address?: string;
  description?: string;
  created_at: string;
}

export interface Participant {
  id: string;
  event_id: string;
  name: string;
  email?: string;
  session_id?: string;
  created_at: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  creator_name?: string;
  creator_email?: string;
  time_slots: string[]; // ISO date strings
  venues: {
    name: string;
    address?: string;
    description?: string;
  }[];
}

export interface VoteRequest {
  participant_name: string;
  participant_email?: string;
  time_slot_ids: string[];
  venue_ids: string[];
}

export interface EventWithDetails extends Event {
  time_slots: TimeSlot[];
  venues: Venue[];
  participants: (Participant & {
    time_slot_votes: { time_slot_id: string }[];
    venue_votes: { venue_id: string }[];
  })[];
}
