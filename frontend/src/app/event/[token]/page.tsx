"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { EventWithDetails, VoteRequest } from "../../../../../types/event";

export default function EventVotingPage() {
  const params = useParams();
  const token = params.token as string;

  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [voteData, setVoteData] = useState<VoteRequest>({
    participant_name: "",
    participant_email: "",
    time_slot_ids: [],
    venue_ids: [],
  });

  useEffect(() => {
    fetchEvent();
  }, [token]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${token}`);
      const result = await response.json();

      if (result.success) {
        setEvent(result.event);
      } else {
        alert("Event not found");
      }
    } catch (error) {
      alert("Error loading event");
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSlotToggle = (timeSlotId: string) => {
    setVoteData((prev) => ({
      ...prev,
      time_slot_ids: prev.time_slot_ids.includes(timeSlotId)
        ? prev.time_slot_ids.filter((id) => id !== timeSlotId)
        : [...prev.time_slot_ids, timeSlotId],
    }));
  };

  const handleVenueToggle = (venueId: string) => {
    setVoteData((prev) => ({
      ...prev,
      venue_ids: prev.venue_ids.includes(venueId)
        ? prev.venue_ids.filter((id) => id !== venueId)
        : [...prev.venue_ids, venueId],
    }));
  };

  const handleSubmitVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voteData.participant_name) {
      alert("Please enter your name");
      return;
    }

    setVoting(true);
    try {
      const response = await fetch(`/api/events/${token}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(voteData),
      });

      const result = await response.json();

      if (result.success) {
        alert("Vote submitted successfully!");
        fetchEvent(); // Refresh to show updated votes
      } else {
        alert("Error submitting vote: " + result.error);
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setVoting(false);
    }
  };

  const getVoteCount = (itemId: string, type: "time_slot" | "venue") => {
    if (!event) return 0;
    return event.participants.reduce((count, participant) => {
      const votes =
        type === "time_slot"
          ? participant.time_slot_votes
          : participant.venue_votes;

      return (
        count +
        (votes.some((vote) =>
          type === "time_slot"
            ? "time_slot_id" in vote && vote.time_slot_id === itemId
            : "venue_id" in vote && vote.venue_id === itemId
        )
          ? 1
          : 0)
      );
    }, 0);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Event Not Found
          </h1>
          <p className="text-gray-600">
            The event you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {event.title}
            </h1>
            {event.description && (
              <p className="text-gray-600 mb-4">{event.description}</p>
            )}
            {event.creator_name && (
              <p className="text-sm text-gray-500">
                Created by {event.creator_name}
              </p>
            )}
            <button
              onClick={copyShareLink}
              className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              📋 Copy Share Link
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Voting Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Cast Your Vote
            </h2>

            <form onSubmit={handleSubmitVote} className="space-y-6">
              {/* Participant Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={voteData.participant_name}
                    onChange={(e) =>
                      setVoteData((prev) => ({
                        ...prev,
                        participant_name: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Email (optional)
                  </label>
                  <input
                    type="email"
                    value={voteData.participant_email}
                    onChange={(e) =>
                      setVoteData((prev) => ({
                        ...prev,
                        participant_email: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Available Times
                </h3>
                <div className="space-y-2">
                  {event.time_slots.map((slot) => {
                    const voteCount = getVoteCount(slot.id, "time_slot");
                    const isSelected = voteData.time_slot_ids.includes(slot.id);

                    return (
                      <label
                        key={slot.id}
                        className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleTimeSlotToggle(slot.id)}
                            className="sr-only"
                          />
                          <div
                            className={`w-5 h-5 border-2 rounded mr-3 flex items-center justify-center ${
                              isSelected
                                ? "border-purple-500 bg-purple-500"
                                : "border-gray-300"
                            }`}
                          >
                            {isSelected && (
                              <span className="text-white text-xs">✓</span>
                            )}
                          </div>
                          <span className="font-medium text-gray-900">
                            {new Date(slot.date_time).toLocaleDateString()} at{" "}
                            {new Date(slot.date_time).toLocaleTimeString()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {voteCount} vote{voteCount !== 1 ? "s" : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Venues */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Venue Options
                </h3>
                <div className="space-y-3">
                  {event.venues.map((venue) => {
                    const voteCount = getVoteCount(venue.id, "venue");
                    const isSelected = voteData.venue_ids.includes(venue.id);

                    return (
                      <label
                        key={venue.id}
                        className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleVenueToggle(venue.id)}
                              className="sr-only"
                            />
                            <div
                              className={`w-5 h-5 border-2 rounded mr-3 mt-1 flex items-center justify-center ${
                                isSelected
                                  ? "border-purple-500 bg-purple-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <span className="text-white text-xs">✓</span>
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {venue.name}
                              </h4>
                              {venue.address && (
                                <p className="text-sm text-gray-600">
                                  {venue.address}
                                </p>
                              )}
                              {venue.description && (
                                <p className="text-sm text-gray-700 mt-1">
                                  {venue.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {voteCount} vote{voteCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={voting || !voteData.participant_name}
                className="w-full px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg"
              >
                {voting ? "Submitting Vote..." : "Submit Vote"}
              </button>
            </form>
          </div>

          {/* Results Summary */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Current Results
            </h2>

            <div className="space-y-6">
              {/* Participants */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Participants ({event.participants.length})
                </h3>
                <div className="space-y-2">
                  {event.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="ml-3 font-medium text-gray-900">
                        {participant.name}
                      </span>
                    </div>
                  ))}
                  {event.participants.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No votes yet. Be the first to vote!
                    </p>
                  )}
                </div>
              </div>

              {/* Top Time Slots */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Most Popular Times
                </h3>
                <div className="space-y-2">
                  {event.time_slots
                    .map((slot) => ({
                      ...slot,
                      votes: getVoteCount(slot.id, "time_slot"),
                    }))
                    .sort((a, b) => b.votes - a.votes)
                    .slice(0, 3)
                    .map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-gray-900">
                          {new Date(slot.date_time).toLocaleDateString()} at{" "}
                          {new Date(slot.date_time).toLocaleTimeString()}
                        </span>
                        <span className="font-semibold text-purple-600">
                          {slot.votes} votes
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Top Venues */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Most Popular Venues
                </h3>
                <div className="space-y-2">
                  {event.venues
                    .map((venue) => ({
                      ...venue,
                      votes: getVoteCount(venue.id, "venue"),
                    }))
                    .sort((a, b) => b.votes - a.votes)
                    .slice(0, 3)
                    .map((venue) => (
                      <div
                        key={venue.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <span className="font-medium text-gray-900">
                            {venue.name}
                          </span>
                          {venue.address && (
                            <p className="text-sm text-gray-600">
                              {venue.address}
                            </p>
                          )}
                        </div>
                        <span className="font-semibold text-purple-600">
                          {venue.votes} votes
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
