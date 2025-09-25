import { supabase } from "../../helpers/supabaseClient";
import { VoteRequest } from "../../../types/event";

export async function submitVote(
  shareToken: string,
  voteData: VoteRequest,
  sessionId?: string
) {
  try {
    // Get event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("share_token", shareToken)
      .single();

    if (eventError) throw eventError;

    // Check if participant already exists (by email or session)
    let participant;
    const participantQuery = supabase
      .from("participants")
      .select("*")
      .eq("event_id", event.id);

    if (voteData.participant_email) {
      participantQuery.eq("email", voteData.participant_email);
    } else if (sessionId) {
      participantQuery.eq("session_id", sessionId);
    }

    const { data: existingParticipant } = await participantQuery.single();

    if (existingParticipant) {
      participant = existingParticipant;

      // Delete existing votes
      await supabase
        .from("time_slot_votes")
        .delete()
        .eq("participant_id", participant.id);

      await supabase
        .from("venue_votes")
        .delete()
        .eq("participant_id", participant.id);
    } else {
      // Create new participant
      const { data: newParticipant, error: participantError } = await supabase
        .from("participants")
        .insert({
          event_id: event.id,
          name: voteData.participant_name,
          email: voteData.participant_email,
          session_id: sessionId,
        })
        .select()
        .single();

      if (participantError) throw participantError;
      participant = newParticipant;
    }

    // Insert time slot votes
    if (voteData.time_slot_ids.length > 0) {
      const timeSlotVotes = voteData.time_slot_ids.map((timeSlotId) => ({
        participant_id: participant.id,
        time_slot_id: timeSlotId,
      }));

      const { error: timeVotesError } = await supabase
        .from("time_slot_votes")
        .insert(timeSlotVotes);

      if (timeVotesError) throw timeVotesError;
    }

    // Insert venue votes
    if (voteData.venue_ids.length > 0) {
      const venueVotes = voteData.venue_ids.map((venueId) => ({
        participant_id: participant.id,
        venue_id: venueId,
      }));

      const { error: venueVotesError } = await supabase
        .from("venue_votes")
        .insert(venueVotes);

      if (venueVotesError) throw venueVotesError;
    }

    return {
      success: true,
      participant,
    };
  } catch (error) {
    console.error("Error submitting vote:", error);
    return {
      success: false,
      error: "Failed to submit vote",
    };
  }
}
