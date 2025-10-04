"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateEventRequest } from "../../../../types/event";
import VenueSelector from "../../components/VenueSelector";

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "details" | "timeslots" | "venues"
  >("details");
  const [formData, setFormData] = useState<CreateEventRequest>({
    title: "",
    description: "",
    time_slots: [],
    venues: [],
  });
  const [newTimeSlot, setNewTimeSlot] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [dailyTimeSlots, setDailyTimeSlots] = useState<{
    [date: string]: string[];
  }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"select" | "deselect">("select");

  // Predefined time slots (24-hour format)
  const availableTimeSlots = [
    "01:00",
    "02:00",
    "03:00",
    "04:00",
    "05:00",
    "06:00",
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
    "23:00",
    "00:00",
  ];

  // Helper function to get dates in range
  const getDatesInRange = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      console.log("Missing date range:", {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      return [];
    }

    const dates = [];
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const current = new Date(start);

    console.log("Generating dates from", start, "to", end);

    // Include both start and end dates (inclusive)
    while (current <= end) {
      const dateString = current.toISOString().split("T")[0];
      dates.push(dateString);
      current.setDate(current.getDate() + 1);
    }

    console.log("Generated dates (inclusive range):", dates);
    console.log(
      `Expected range: ${dateRange.startDate} to ${dateRange.endDate} (inclusive)`
    );
    return dates;
  };

  // Helper function to check if a time slot is selected for a specific date
  const isTimeSlotSelected = (date: string, time: string) => {
    return dailyTimeSlots[date]?.includes(time) || false;
  };

  // Helper function to check if a time slot is in the past
  const isTimeSlotInPast = (date: string, time: string) => {
    const [hours, minutes] = time.split(":");
    const dateTime = new Date(date);
    dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return dateTime <= new Date();
  };

  // Helper function to convert dailyTimeSlots to ISO time slots
  const convertDailyTimeSlotsToISO = (dailySlots: {
    [date: string]: string[];
  }) => {
    const timeSlots: string[] = [];

    Object.entries(dailySlots).forEach(([date, times]) => {
      times.forEach((time) => {
        const [hours, minutes] = time.split(":");
        const dateTime = new Date(date);
        dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Only add future time slots
        if (dateTime > new Date()) {
          timeSlots.push(dateTime.toISOString());
        }
      });
    });

    return timeSlots;
  };

  // Helper function to toggle time slot for a specific date
  const toggleTimeSlotForDate = (date: string, time: string) => {
    // Don't allow selecting past time slots
    if (isTimeSlotInPast(date, time)) {
      return;
    }

    setDailyTimeSlots((prev) => {
      const dateSlots = prev[date] || [];
      const isSelected = dateSlots.includes(time);

      const newDailySlots = isSelected
        ? {
            ...prev,
            [date]: dateSlots.filter((t) => t !== time),
          }
        : {
            ...prev,
            [date]: [...dateSlots, time],
          };

      // Automatically update formData.time_slots
      const newTimeSlots = convertDailyTimeSlotsToISO(newDailySlots);
      setFormData((prevFormData) => ({
        ...prevFormData,
        time_slots: newTimeSlots,
      }));

      return newDailySlots;
    });
  };

  // Helper function to select all time slots for a specific date
  const selectAllTimeSlotsForDate = (date: string) => {
    const futureSlots = availableTimeSlots.filter(
      (time) => !isTimeSlotInPast(date, time)
    );

    setDailyTimeSlots((prev) => {
      const newDailySlots = {
        ...prev,
        [date]: futureSlots,
      };

      // Automatically update formData.time_slots
      const newTimeSlots = convertDailyTimeSlotsToISO(newDailySlots);
      setFormData((prevFormData) => ({
        ...prevFormData,
        time_slots: newTimeSlots,
      }));

      return newDailySlots;
    });
  };

  // Helper function to clear all time slots for a specific date
  const clearAllTimeSlotsForDate = (date: string) => {
    setDailyTimeSlots((prev) => {
      const newDailySlots = {
        ...prev,
        [date]: [],
      };

      // Automatically update formData.time_slots
      const newTimeSlots = convertDailyTimeSlotsToISO(newDailySlots);
      setFormData((prevFormData) => ({
        ...prevFormData,
        time_slots: newTimeSlots,
      }));

      return newDailySlots;
    });
  };

  // Handle mouse events for drag selection
  const handleMouseDown = (date: string, time: string) => {
    if (isTimeSlotInPast(date, time)) {
      return;
    }

    setIsDragging(true);
    const isSelected = isTimeSlotSelected(date, time);
    setDragMode(isSelected ? "deselect" : "select");
    toggleTimeSlotForDate(date, time);
  };

  const handleMouseEnter = (date: string, time: string) => {
    if (!isDragging || isTimeSlotInPast(date, time)) return;

    const isSelected = isTimeSlotSelected(date, time);
    if (dragMode === "select" && !isSelected) {
      toggleTimeSlotForDate(date, time);
    } else if (dragMode === "deselect" && isSelected) {
      toggleTimeSlotForDate(date, time);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleTimeSlot = (time: string) => {
    console.log("toggleTimeSlot called with:", time);
    setSelectedTimeSlots((prev) => {
      const newSelection = prev.includes(time)
        ? prev.filter((t) => t !== time)
        : [...prev, time];
      console.log("Previous selection:", prev);
      console.log("New selection:", newSelection);
      return newSelection;
    });
  };

  const selectAllTimeSlots = () => {
    const dates = getDatesInRange();
    const newDailySlots: { [date: string]: string[] } = {};

    dates.forEach((date) => {
      const futureSlots = availableTimeSlots.filter(
        (time) => !isTimeSlotInPast(date, time)
      );
      newDailySlots[date] = futureSlots;
    });

    setDailyTimeSlots(newDailySlots);

    // Automatically update formData.time_slots
    const newTimeSlots = convertDailyTimeSlotsToISO(newDailySlots);
    setFormData((prev) => ({
      ...prev,
      time_slots: newTimeSlots,
    }));
  };

  const clearAllTimeSlots = () => {
    setDailyTimeSlots({});

    // Clear formData.time_slots as well
    setFormData((prev) => ({
      ...prev,
      time_slots: [],
    }));
  };

  const removeTimeSlot = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      time_slots: prev.time_slots.filter((_, i) => i !== index),
    }));
  };

  const handleVenuesSelected = (venues: any[]) => {
    setFormData((prev) => ({
      ...prev,
      venues: venues,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare form data with default description if empty
      const submitData = {
        ...formData,
        description: formData.description?.trim() || "NIL",
      };

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        // Show success message and redirect
        alert(
          `Event created successfully! Share this link: ${result.shareUrl}`
        );
        router.push(`/event/${result.event.share_token}`);
      } else {
        alert("Error creating event: " + result.error);
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Check if current tab is valid to proceed
  const canProceedFromTab = (tab: string) => {
    switch (tab) {
      case "details":
        return formData.title.trim() !== "";
      case "timeslots":
        return formData.time_slots.length > 0;
      case "venues":
        return formData.venues.length > 0;
      default:
        return false;
    }
  };

  // Get tab completion status
  const getTabStatus = (tab: string) => {
    return canProceedFromTab(tab) ? "completed" : "incomplete";
  };

  const nextTab = () => {
    if (activeTab === "details") {
      setActiveTab("timeslots");
    } else if (activeTab === "timeslots") {
      setActiveTab("venues");
    }
  };

  const prevTab = () => {
    if (activeTab === "venues") {
      setActiveTab("timeslots");
    } else if (activeTab === "timeslots") {
      setActiveTab("details");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="w-full max-w-[95%] mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="text-center p-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <h1 className="text-4xl font-bold mb-2">Create New Event</h1>
            <p className="text-indigo-100 text-lg">
              Plan your hangout or dining experience with friends
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b bg-gray-50">
            <div className="flex">
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors relative ${
                  activeTab === "details"
                    ? "bg-white border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      getTabStatus("details") === "completed"
                        ? "bg-green-500 text-white"
                        : activeTab === "details"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {getTabStatus("details") === "completed" ? "✓" : "1"}
                  </span>
                  <span className="text-lg">Event Details</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("timeslots")}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors relative ${
                  activeTab === "timeslots"
                    ? "bg-white border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      getTabStatus("timeslots") === "completed"
                        ? "bg-green-500 text-white"
                        : activeTab === "timeslots"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {getTabStatus("timeslots") === "completed" ? "✓" : "2"}
                  </span>
                  <span className="text-lg">Time Slots</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("venues")}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors relative ${
                  activeTab === "venues"
                    ? "bg-white border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      getTabStatus("venues") === "completed"
                        ? "bg-green-500 text-white"
                        : activeTab === "venues"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {getTabStatus("venues") === "completed" ? "✓" : "3"}
                  </span>
                  <span className="text-lg">Venue Options</span>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {/* Tab Content */}
            <div className="min-h-[500px]">
              {/* Event Details Tab */}
              {activeTab === "details" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      📝 Include Event Details
                    </h2>
                    <p className="text-gray-600">
                      Start by giving your event a name and description
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="form-input text-lg"
                        placeholder="e.g., Weekend Dinner Plans, Birthday Celebration, Team Outing..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="form-textarea"
                        rows={4}
                        placeholder="Add some details about your event... What's the occasion? Any special requirements?"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Time Slots Tab */}
              {activeTab === "timeslots" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      ⏰ When should your event happen?
                    </h2>
                    <p className="text-gray-600">
                      Select date range and times for people to vote on
                    </p>
                  </div>

                  {/* Date Range Selection */}
                  <div className="space-y-4 p-6 border border-gray-200 rounded-xl bg-blue-50">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      Step 1: Select Date Range
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={dateRange.startDate}
                          onChange={(e) => {
                            console.log("Start date changed:", e.target.value);
                            setDateRange((prev) => ({
                              ...prev,
                              startDate: e.target.value,
                            }));
                          }}
                          className="form-input"
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={dateRange.endDate}
                          onChange={(e) => {
                            console.log("End date changed:", e.target.value);
                            setDateRange((prev) => ({
                              ...prev,
                              endDate: e.target.value,
                            }));
                          }}
                          className="form-input"
                          min={
                            dateRange.startDate ||
                            new Date().toISOString().split("T")[0]
                          }
                        />
                      </div>
                    </div>
                    {dateRange.startDate && dateRange.endDate && (
                      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                        <p className="text-sm text-blue-800">
                          Selected range: {dateRange.startDate} to{" "}
                          {dateRange.endDate} ({getDatesInRange().length} days)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Time Slots Selection */}
                  {dateRange.startDate && dateRange.endDate && (
                    <div
                      className="space-y-4 p-6 border border-gray-200 rounded-xl bg-green-50"
                      onMouseUp={handleMouseUp}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">
                            Step 2: Select Time Slots for Each Day
                          </h4>
                          <p className="text-sm text-gray-600">
                            Click and drag to select multiple time slots, or
                            click individual slots. Past times are disabled.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={selectAllTimeSlots}
                            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                          >
                            Select All Future Times
                          </button>
                          <button
                            type="button"
                            onClick={clearAllTimeSlots}
                            className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {getDatesInRange().length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-gray-500">
                              Please select both start and end dates to see
                              available time slots.
                            </p>
                          </div>
                        ) : (
                          getDatesInRange().map((date) => {
                            const dateObj = new Date(date + "T12:00:00");
                            const selectedCount =
                              dailyTimeSlots[date]?.length || 0;
                            const futureSlots = availableTimeSlots.filter(
                              (time) => !isTimeSlotInPast(date, time)
                            );

                            return (
                              <div
                                key={date}
                                className="space-y-3 p-4 border border-gray-200 rounded-lg bg-white"
                              >
                                <div className="flex items-center justify-between">
                                  <h5 className="font-medium text-gray-800">
                                    {dateObj.toLocaleDateString("en-US", {
                                      weekday: "long",
                                      month: "long",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </h5>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500">
                                      {selectedCount} of {futureSlots.length}{" "}
                                      selected
                                    </span>
                                    <div className="flex gap-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          selectAllTimeSlotsForDate(date)
                                        }
                                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                        disabled={futureSlots.length === 0}
                                      >
                                        Select All
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          clearAllTimeSlotsForDate(date)
                                        }
                                        className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                      >
                                        Clear
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Time slots in vertical columns */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                                  {availableTimeSlots.map((time) => {
                                    const isSelected = isTimeSlotSelected(
                                      date,
                                      time
                                    );
                                    const isPast = isTimeSlotInPast(date, time);
                                    const [hours] = time.split(":");
                                    const displayTime = `${
                                      parseInt(hours) === 0
                                        ? 12
                                        : parseInt(hours) > 12
                                        ? parseInt(hours) - 12
                                        : hours
                                    }:00 ${
                                      parseInt(hours) >= 12 ? "PM" : "AM"
                                    }`;

                                    return (
                                      <button
                                        key={`${date}-${time}`}
                                        type="button"
                                        onMouseDown={() =>
                                          handleMouseDown(date, time)
                                        }
                                        onMouseEnter={() =>
                                          handleMouseEnter(date, time)
                                        }
                                        disabled={isPast}
                                        className={`p-2 rounded-lg text-xs font-medium transition-colors select-none ${
                                          isPast
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                                            : isSelected
                                            ? "bg-green-600 text-white shadow-md"
                                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                                        }`}
                                        title={
                                          isPast
                                            ? "This time has already passed"
                                            : ""
                                        }
                                      >
                                        <div>
                                          {displayTime}
                                          {isPast && (
                                            <div className="text-xs opacity-75">
                                              (Past)
                                            </div>
                                          )}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Venues Tab */}
              {activeTab === "venues" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      📍 Where should your event take place?
                    </h2>
                    <p className="text-gray-600">
                      Find and select venues using our AI-powered
                      recommendations
                    </p>
                  </div>

                  <VenueSelector
                    onVenuesSelected={handleVenuesSelected}
                    selectedVenues={formData.venues}
                  />
                </div>
              )}
            </div>

            {/* Navigation and Submit */}
            <div className="flex items-center justify-between pt-8 border-t">
              <button
                type="button"
                onClick={prevTab}
                disabled={activeTab === "details"}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "details"
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                }`}
              >
                Back
              </button>

              <div className="text-center">
                <span className="text-sm text-gray-600">
                  Step{" "}
                  {activeTab === "details"
                    ? 1
                    : activeTab === "timeslots"
                    ? 2
                    : 3}{" "}
                  of 3
                </span>
              </div>

              {activeTab !== "venues" ? (
                <button
                  type="button"
                  onClick={nextTab}
                  className="px-6 py-3 rounded-lg font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={
                    loading ||
                    !formData.title ||
                    formData.time_slots.length === 0 ||
                    formData.venues.length === 0
                  }
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold shadow-lg hover:shadow-xl"
                >
                  {loading ? "Creating Event..." : "Create Event & Get Link"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
