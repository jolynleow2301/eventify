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

export interface VenuePreferences {
  budget: "budget" | "mid-range" | "upscale" | "luxury";
  vibes: string[]; // e.g., ['romantic', 'casual', 'lively', 'quiet', 'family-friendly']
  atmosphere: string[]; // e.g., ['cozy', 'modern', 'traditional', 'outdoor', 'intimate']
  cuisine?: string[]; // for food places
  activityType?: string[]; // for entertainment venues
}

export interface AIRecommendationRequest {
  location: { lat: number; lng: number };
  type: "food" | "entertainment";
  preferences: VenuePreferences;
  radius?: number;
}

export interface PlaceRecommendation {
  place_id: string;
  name: string;
  vicinity: string;
  rating: number;
  price_level?: number;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  opening_hours?: {
    open_now: boolean;
  };
  reviews?: Array<{
    text: string;
    rating: number;
    time: number;
  }>;
}

export interface LocationSearchResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface EnhancedPlaceRecommendation extends PlaceRecommendation {
  ai_analysis?: {
    sentiment_score: number;
    vibe_match_score: number;
    budget_match_score: number;
    atmosphere_match_score: number;
    summary: string;
    key_highlights: string[];
    potential_concerns: string[];
  };
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
    place_id?: string;
    rating?: number;
    price_level?: number;
    ai_analysis?: {
      sentiment_score: number;
      vibe_match_score: number;
      budget_match_score: number;
      atmosphere_match_score: number;
      summary: string;
      key_highlights: string[];
      potential_concerns: string[];
    };
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
