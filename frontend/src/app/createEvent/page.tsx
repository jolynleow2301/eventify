"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateEventRequest } from "../../../../types/event";
import VenueSelector from "../../components/VenueSelector";

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateEventRequest>({
    title: "",
    description: "",
    creator_name: "",
    creator_email: "",
    time_slots: [],
    venues: [],
  });
  const [newTimeSlot, setNewTimeSlot] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);

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

  // Generate time slots based on date range and selected times
  const generateTimeSlots = () => {
    console.log("generateTimeSlots called");
    console.log("dateRange:", dateRange);
    console.log("dateRange.startDate:", dateRange.startDate);
    console.log("dateRange.endDate:", dateRange.endDate);
    console.log("selectedTimeSlots:", selectedTimeSlots);

    // Basic validation
    if (
      !dateRange.startDate ||
      !dateRange.endDate ||
      selectedTimeSlots.length === 0
    ) {
      alert("Please select a VALID date range and at least one time slot");
      return;
    }

    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    console.log("Start date:", start);
    console.log("End date:", end);
    console.log("Current time:", now);

    // Validate date parsing
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      alert("Invalid date format. Please select valid dates.");
      return;
    }

    // Check if any of the selected time slots would be in the past
    const currentDate = new Date(start);
    let hasPastTimeSlots = false;
    const pastSlots: string[] = [];

    while (currentDate <= end) {
      selectedTimeSlots.forEach((time) => {
        const [hours, minutes] = time.split(":");
        const dateTime = new Date(currentDate);
        dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        if (dateTime <= now) {
          hasPastTimeSlots = true;
          pastSlots.push(
            dateTime.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            }) +
              " at " +
              dateTime.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
          );
        }
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (hasPastTimeSlots) {
      alert(
        `Cannot create time slots in the past. The following selected times have already passed:\n\n${pastSlots
          .slice(0, 5)
          .join("\n")}${
          pastSlots.length > 5 ? "\n...and more" : ""
        }\n\nPlease choose future dates and times.`
      );
      return;
    }

    // Reset currentDate for actual generation
    currentDate.setTime(start.getTime());
    const newSlots: string[] = [];

    // Generate all combinations of dates and times
    while (currentDate <= end) {
      selectedTimeSlots.forEach((time) => {
        const [hours, minutes] = time.split(":");
        const dateTime = new Date(currentDate);
        dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        newSlots.push(dateTime.toISOString());
        console.log("Generated slot:", dateTime.toISOString());
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log("All new slots:", newSlots);

    setFormData((prev) => ({
      ...prev,
      time_slots: [...prev.time_slots, ...newSlots],
    }));

    // Reset form
    setDateRange({ startDate: "", endDate: "" });
    setSelectedTimeSlots([]);

    console.log("Time slots generated successfully");
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
    console.log("selectAllTimeSlots called");
    console.log("Available time slots:", availableTimeSlots);
    setSelectedTimeSlots(availableTimeSlots);
  };

  const clearAllTimeSlots = () => {
    setSelectedTimeSlots([]);
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
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create New Event
            </h1>
            <p className="text-gray-600">
              Plan your hangout or dining experience with friends
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="form-input"
                  placeholder="e.g., Weekend Dinner Plans"
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
                  rows={3}
                  placeholder="Add some details about your event..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={formData.creator_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        creator_name: e.target.value,
                      }))
                    }
                    className="form-input"
                    placeholder="Your name (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Email
                  </label>
                  <input
                    type="email"
                    value={formData.creator_email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        creator_email: e.target.value,
                      }))
                    }
                    className="form-input"
                    placeholder="your@email.com (optional)"
                  />
                </div>
              </div>
            </div>

            {/* Time Slots */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Available Time Slots
              </h3>

              {/* Date Range Selection */}
              <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-blue-50">
                <h4 className="font-medium text-gray-900">
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
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
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
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      className="form-input"
                      min={
                        dateRange.startDate ||
                        new Date().toISOString().split("T")[0]
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Time Slots Selection */}
              <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-green-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Step 2: Select Time Slots
                    </h4>
                    <p className="text-sm text-gray-600">
                      Choose which times should be available each day
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllTimeSlots}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Whole Day
                    </button>
                    <button
                      type="button"
                      onClick={clearAllTimeSlots}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {availableTimeSlots.map((time) => {
                    const isSelected = selectedTimeSlots.includes(time);
                    const [hours] = time.split(":");
                    const displayTime = `${
                      parseInt(hours) === 0
                        ? 12
                        : parseInt(hours) > 12
                        ? parseInt(hours) - 12
                        : hours
                    }:00 ${parseInt(hours) >= 12 ? "PM" : "AM"}`;

                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => toggleTimeSlot(time)}
                        className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? "bg-green-600 text-white"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {displayTime}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Generate Button */}
              <div className="text-center space-x-4">
                <button
                  type="button"
                  onClick={generateTimeSlots}
                  disabled={false}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Generate Time Slots ({selectedTimeSlots.length} times ×{" "}
                  {dateRange.startDate && dateRange.endDate
                    ? Math.ceil(
                        (new Date(dateRange.endDate).getTime() -
                          new Date(dateRange.startDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) + 1
                    : 0}{" "}
                  days)
                </button>
              </div>

              {/* Generated Time Slots Display */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">
                  Generated Time Slots ({formData.time_slots.length})
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {formData.time_slots.map((slot, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                    >
                      <span className="text-gray-900">
                        {new Date(slot).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        at{" "}
                        {new Date(slot).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(index)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {formData.time_slots.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No time slots generated yet. Use the form above to create
                      them.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Venues */}
            <VenueSelector
              onVenuesSelected={handleVenuesSelected}
              selectedVenues={formData.venues}
            />

            {/* Submit */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={
                  loading ||
                  !formData.title ||
                  formData.time_slots.length === 0 ||
                  formData.venues.length === 0
                }
                className="w-full px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg"
              >
                {loading
                  ? "Creating Event..."
                  : "Create Event & Get Shareable Link"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
