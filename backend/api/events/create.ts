import { supabase } from "../../helpers/supabaseClient";
import { CreateEventRequest } from "../../../types/event";
import { v4 as uuidv4 } from "uuid";

export async function createEvent(request: CreateEventRequest) {
  try {
    const shareToken = uuidv4().replace(/-/g, "").substring(0, 16);

    // Create the event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        title: request.title,
        description: request.description,
        creator_name: request.creator_name,
        creator_email: request.creator_email,
        share_token: shareToken,
      })
      .select()
      .single(); // returns back the event as event id is needed for time slots and venues

    if (eventError) throw eventError;

    // Create time slots
    const timeSlots = request.time_slots.map((dateTime) => ({
      event_id: event.id,
      date_time: dateTime,
    }));

    const { error: timeSlotsError } = await supabase
      .from("event_time_slots")
      .insert(timeSlots);

    if (timeSlotsError) throw timeSlotsError;

    // Create venues
    const venues = request.venues.map((venue) => ({
      event_id: event.id,
      name: venue.name,
      address: venue.address,
      description: venue.description,
    }));

    const { error: venuesError } = await supabase
      .from("event_venues")
      .insert(venues);

    if (venuesError) throw venuesError;

    return {
      success: true,
      event,
      shareUrl: `${process.env.FRONTEND_URL}/event/${shareToken}`,
    };
  } catch (error) {
    console.error("Error creating event:", error);
    return {
      success: false,
      error: "Failed to create event",
    };
  }
}
