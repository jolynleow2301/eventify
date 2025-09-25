import { supabase } from "../../helpers/supabaseClient";

export async function getEventByToken(shareToken: string) {
  try {
    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("share_token", shareToken)
      .single();

    if (eventError) throw eventError;

    // Get time slots
    const { data: timeSlots, error: timeSlotsError } = await supabase
      .from("event_time_slots")
      .select("*")
      .eq("event_id", event.id)
      .order("date_time");

    if (timeSlotsError) throw timeSlotsError;

    // Get venues
    const { data: venues, error: venuesError } = await supabase
      .from("event_venues")
      .select("*")
      .eq("event_id", event.id)
      .order("created_at");

    if (venuesError) throw venuesError;

    // Get participants with their votes
    const { data: participants, error: participantsError } = await supabase
      .from("participants")
      .select(
        `
        *,
        time_slot_votes (time_slot_id),
        venue_votes (venue_id)
      `
      )
      .eq("event_id", event.id);

    if (participantsError) throw participantsError;

    return {
      success: true,
      event: {
        ...event,
        time_slots: timeSlots,
        venues: venues,
        participants: participants,
      },
    };
  } catch (error) {
    console.error("Error getting event:", error);
    return {
      success: false,
      error: "Event not found",
    };
  }
}
