"use client";

import { useState, useEffect } from "react";

interface PlaceRecommendation {
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

interface LocationSearchResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface VenuePreferences {
  budget: "budget" | "mid-range" | "upscale" | "luxury";
  vibes: string[];
  atmosphere: string[];
  cuisine?: string[];
  activityType?: string[];
}

interface VenueSelectorProps {
  onVenuesSelected: (venues: any[]) => void;
  selectedVenues: any[];
  userLocation?: {
    lat: number;
    lng: number;
  } | null;
}

export default function VenueSelector({
  onVenuesSelected,
  selectedVenues,
  userLocation,
}: VenueSelectorProps) {
  const [venueType, setVenueType] = useState<"food" | "entertainment">("food");
  const [locationQuery, setLocationQuery] = useState("");
  const [locations, setLocations] = useState<LocationSearchResult[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationSearchResult | null>(null);
  const [recommendations, setRecommendations] = useState<PlaceRecommendation[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [searchingLocations, setSearchingLocations] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<{
    [placeId: string]: number;
  }>({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);

  // AI Preferences
  const [preferences, setPreferences] = useState<VenuePreferences>({
    budget: "mid-range",
    vibes: [],
    atmosphere: [],
    cuisine: [],
    activityType: [],
  });

  // Predefined options
  const budgetOptions = [
    {
      value: "budget",
      label: "💰 Budget-friendly ($)",
      description: "Under $15 per person",
    },
    {
      value: "mid-range",
      label: "💳 Mid-range ($$)",
      description: "$15-40 per person",
    },
    {
      value: "upscale",
      label: "💎 Upscale ($$$)",
      description: "$40-80 per person",
    },
    {
      value: "luxury",
      label: "👑 Luxury ($$$$)",
      description: "$80+ per person",
    },
  ];

  const vibeOptions = [
    "romantic",
    "casual",
    "lively",
    "quiet",
    "family-friendly",
    "trendy",
    "cozy",
    "sophisticated",
    "fun",
    "relaxed",
    "energetic",
  ];

  const atmosphereOptions = [
    "intimate",
    "spacious",
    "modern",
    "traditional",
    "outdoor",
    "industrial",
    "elegant",
    "rustic",
    "minimalist",
    "vibrant",
  ];

  const cuisineOptions = [
    "Italian",
    "Chinese",
    "Japanese",
    "Thai",
    "Mexican",
    "Indian",
    "French",
    "American",
    "Mediterranean",
    "Korean",
    "Vietnamese",
    "Fusion",
  ];

  const activityOptions = [
    "movies",
    "arcade",
    "bowling",
    "karaoke",
    "shopping",
    "museum",
    "park",
    "sports",
    "nightlife",
    "live music",
    "art gallery",
    "theater",
  ];

  // Auto-select user location when available
  useEffect(() => {
    if (userLocation && !selectedLocation) {
      // Create a location object from user's coordinates
      const userLocationResult: LocationSearchResult = {
        place_id: "user_location",
        formatted_address: `Your Location (${userLocation.lat.toFixed(
          4
        )}, ${userLocation.lng.toFixed(4)})`,
        geometry: {
          location: userLocation,
        },
      };
      setSelectedLocation(userLocationResult);
      setLocationQuery(userLocationResult.formatted_address);
    }
  }, [userLocation, selectedLocation]);

  const searchLocations = async () => {
    if (!locationQuery.trim()) return;

    setSearchingLocations(true);
    try {
      console.log("Searching for location:", locationQuery);
      const response = await fetch(
        `/api/places/search-locations?query=${encodeURIComponent(
          locationQuery
        )}`
      );
      const result = await response.json();

      console.log("Location search result:", result);

      if (result.success) {
        setLocations(result.locations);
      } else {
        console.error("Location search failed:", result.error);
        alert("Failed to search locations: " + result.error);
      }
    } catch (error) {
      console.error("Error searching locations:", error);
      alert("Network error while searching locations");
    } finally {
      setSearchingLocations(false);
    }
  };

  const getRecommendations = async () => {
    if (!selectedLocation) return;

    setLoading(true);
    try {
      const endpoint = useAI
        ? "/api/places/ai-recommendations"
        : "/api/places/recommendations";

      const requestBody = useAI
        ? {
            location: selectedLocation.geometry.location,
            type: venueType,
            preferences: preferences,
            radius: 10000,
          }
        : {
            location: selectedLocation.geometry.location,
            type: venueType,
            radius: 10000,
          };

      console.log("Getting recommendations:", { endpoint, requestBody });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      console.log("Recommendations result:", result);

      if (result.success) {
        console.log("First place photos:", result.recommendations[0]?.photos);
        setRecommendations(result.recommendations);
      } else {
        console.error("Recommendations failed:", result.error);
        alert("Failed to get recommendations: " + result.error);
      }
    } catch (error) {
      console.error("Error getting recommendations:", error);
      alert("Network error while getting recommendations");
    } finally {
      setLoading(false);
    }
  };

  const toggleVenueSelection = (place: PlaceRecommendation) => {
    const venue = {
      name: place.name,
      address: place.vicinity,
      description:
        useAI && place.ai_analysis
          ? place.ai_analysis.summary
          : `Rating: ${place.rating}/5 ${
              place.price_level ? `• Price Level: ${place.price_level}/4` : ""
            }`,
      place_id: place.place_id,
      rating: place.rating,
      price_level: place.price_level,
      ai_analysis: place.ai_analysis,
    };

    const isSelected = selectedVenues.some(
      (v) => v.place_id === place.place_id
    );

    if (isSelected) {
      onVenuesSelected(
        selectedVenues.filter((v) => v.place_id !== place.place_id)
      );
    } else {
      onVenuesSelected([...selectedVenues, venue]);
    }
  };

  const getPriceLabel = (priceLevel?: number) => {
    if (!priceLevel) return "Price not available";
    return "$".repeat(priceLevel) + "○".repeat(4 - priceLevel);
  };

  const togglePreferenceItem = (
    category: keyof VenuePreferences,
    item: string
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: Array.isArray(prev[category])
        ? (prev[category] as string[]).includes(item)
          ? (prev[category] as string[]).filter((i) => i !== item)
          : [...(prev[category] as string[]), item]
        : [item],
    }));
  };

  useEffect(() => {
    if (selectedLocation) {
      getRecommendations();
    }
  }, [selectedLocation, venueType, useAI, preferences]);

  // Auto-swipe photos on hover
  useEffect(() => {
    if (!hoveredPlaceId) return;

    const place = recommendations.find((p) => p.place_id === hoveredPlaceId);
    const photos = place?.photos || [];

    console.log(
      `Hovered place: ${place?.name}, Photos count: ${photos.length}`
    );

    if (photos.length <= 1) {
      console.log("Not enough photos to auto-swipe");
      return;
    }

    // Immediately swipe to next photo when hover starts
    setCurrentPhotoIndex((prev) => {
      const currentIndex = prev[hoveredPlaceId] || 0;
      const nextIndex = (currentIndex + 1) % photos.length;
      console.log(`Auto-swipe from ${currentIndex} to ${nextIndex}`);
      return {
        ...prev,
        [hoveredPlaceId]: nextIndex,
      };
    });

    // Then continue auto-swiping every 5 seconds
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => {
        const currentIndex = prev[hoveredPlaceId] || 0;
        const nextIndex = (currentIndex + 1) % photos.length;
        console.log(`Auto-swipe interval from ${currentIndex} to ${nextIndex}`);
        return {
          ...prev,
          [hoveredPlaceId]: nextIndex,
        };
      });
    }, 5000); // Auto-swipe every 5 seconds

    return () => {
      console.log("Clearing auto-swipe interval");
      clearInterval(interval);
    };
  }, [hoveredPlaceId]);

  // Auto-collapse when recommendations are loaded
  useEffect(() => {
    if (recommendations.length > 0) {
      setIsCollapsed(true);
    }
  }, [recommendations]);

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-3">
      {/* Header with Edit Preferences button (shown when collapsed) */}
      {isCollapsed && recommendations.length > 0 && (
        <div className="flex items-center justify-between flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-900">Venue Options</h3>
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Edit Preferences
          </button>
        </div>
      )}

      {/* Header without button (shown when not collapsed) */}
      {!isCollapsed && (
        <h3 className="text-xl font-bold text-gray-900 flex-shrink-0">
          Venue Options
        </h3>
      )}

      {/* Full Form View - Only show when not collapsed */}
      {!isCollapsed && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column: Venue Type + AI Preferences */}
            <div className="space-y-3">
              {/* Venue Type Selection */}
              <div className="space-y-3">
                <label className="block text-md font-medium text-gray-700 mb-2">
                  Choose Venue Type *
                </label>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="food"
                      checked={venueType === "food"}
                      onChange={(e) =>
                        setVenueType(e.target.value as "food" | "entertainment")
                      }
                      className="mr-3 w-4 h-4 text-blue-600"
                    />
                    <span className="text-lg text-gray-800">
                      🍽️ Food Places
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="entertainment"
                      checked={venueType === "entertainment"}
                      onChange={(e) =>
                        setVenueType(e.target.value as "food" | "entertainment")
                      }
                      className="mr-3 w-4 h-4 text-blue-600"
                    />
                    <span className="text-lg text-gray-800">
                      🎮 Outing Places
                    </span>
                  </label>
                </div>
              </div>

              {/* AI Preferences */}
              {useAI && (
                <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900">
                    ✨ Tell us your preferences
                  </h4>

                  {/* Budget */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget Range
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-gray-900">
                      {budgetOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setPreferences((prev) => ({
                              ...prev,
                              budget: option.value as any,
                            }))
                          }
                          className={`p-3 text-left border rounded-lg transition-colors ${
                            preferences.budget === option.value
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <div className="font-medium text-sm">
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-600">
                            {option.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vibes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Desired Vibes (select multiple)
                    </label>
                    <div className="flex flex-wrap gap-2 text-gray-700">
                      {vibeOptions.map((vibe) => (
                        <button
                          key={vibe}
                          type="button"
                          onClick={() => togglePreferenceItem("vibes", vibe)}
                          className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                            preferences.vibes.includes(vibe)
                              ? "border-purple-500 bg-purple-100 text-purple-700"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          {vibe}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Atmosphere */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Atmosphere
                    </label>
                    <div className="flex flex-wrap gap-2 text-gray-700">
                      {atmosphereOptions.map((atmosphere) => (
                        <button
                          key={atmosphere}
                          type="button"
                          onClick={() =>
                            togglePreferenceItem("atmosphere", atmosphere)
                          }
                          className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                            preferences.atmosphere.includes(atmosphere)
                              ? "border-purple-500 bg-purple-100 text-purple-700"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          {atmosphere}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cuisine (for food) */}
                  {venueType === "food" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cuisine Preferences
                      </label>
                      <div className="flex flex-wrap gap-2 text-gray-700">
                        {cuisineOptions.map((cuisine) => (
                          <button
                            key={cuisine}
                            type="button"
                            onClick={() =>
                              togglePreferenceItem("cuisine", cuisine)
                            }
                            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                              preferences.cuisine?.includes(cuisine)
                                ? "border-purple-500 bg-purple-100 text-purple-700"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            {cuisine}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activity Type (for entertainment) */}
                  {venueType === "entertainment" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Activity Preferences
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {activityOptions.map((activity) => (
                          <button
                            key={activity}
                            type="button"
                            onClick={() =>
                              togglePreferenceItem("activityType", activity)
                            }
                            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                              preferences.activityType?.includes(activity)
                                ? "border-purple-500 bg-purple-100 text-purple-700"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            {activity}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Location Search and Selected Location */}
            <div className="lg:col-span-2 space-y-3">
              {/* Location Search */}
              <div className="space-y-3">
                <label className="block text-md font-medium text-gray-700 mb-2">
                  Search Location (Country, City, District) *
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Search Bar */}
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={locationQuery}
                        onChange={(e) => setLocationQuery(e.target.value)}
                        className="form-input flex-1"
                        placeholder="e.g., New York, Tokyo, London, Singapore..."
                        onKeyPress={(e) =>
                          e.key === "Enter" && searchLocations()
                        }
                      />
                      <button
                        type="button"
                        onClick={searchLocations}
                        disabled={searchingLocations || !locationQuery.trim()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                      >
                        {searchingLocations ? "Searching..." : "Search"}
                      </button>
                    </div>

                    {/* Location Results */}
                    {locations.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 mt-2">
                        <p className="text-sm text-gray-600 font-medium">
                          Select a location:
                        </p>
                        {locations.map((location) => (
                          <button
                            key={location.place_id}
                            type="button"
                            onClick={() => {
                              setSelectedLocation(location);
                              setLocations([]);
                            }}
                            className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors border"
                          >
                            <span className="text-sm text-gray-900">
                              {location.formatted_address}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Location Display */}
                  {selectedLocation && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg h-fit">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-sm font-medium text-green-800">
                            Selected Location:
                          </span>
                          <p className="text-sm text-green-700">
                            {selectedLocation.formatted_address}
                          </p>
                          <span className="text-sm font-medium text-green-800">
                            Venue Type:
                          </span>
                          <p className="text-sm text-green-700">
                            {venueType === "food"
                              ? "🍽️ Food Places"
                              : "🎮 Outing Places"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLocation(null);
                            setRecommendations([]);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                Edit Venue Preferences
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column: Venue Type + AI Preferences */}
                <div className="space-y-3">
                  {/* Venue Type Selection */}
                  <div className="space-y-3">
                    <label className="block text-md font-medium text-gray-700 mb-2">
                      Choose Venue Type *
                    </label>
                    <div className="flex flex-col gap-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          value="food"
                          checked={venueType === "food"}
                          onChange={(e) =>
                            setVenueType(
                              e.target.value as "food" | "entertainment"
                            )
                          }
                          className="mr-3 w-4 h-4 text-blue-600"
                        />
                        <span className="text-lg text-gray-800">
                          🍽️ Food Places
                        </span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          value="entertainment"
                          checked={venueType === "entertainment"}
                          onChange={(e) =>
                            setVenueType(
                              e.target.value as "food" | "entertainment"
                            )
                          }
                          className="mr-3 w-4 h-4 text-blue-600"
                        />
                        <span className="text-lg text-gray-800">
                          🎮 Outing Places
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* AI Preferences in Modal */}
                  {useAI && (
                    <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900">
                        ✨ Tell us your preferences
                      </h4>

                      {/* Budget */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Budget Range
                        </label>
                        <div className="grid grid-cols-2 gap-2 text-gray-900">
                          {budgetOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                setPreferences((prev) => ({
                                  ...prev,
                                  budget: option.value as any,
                                }))
                              }
                              className={`p-3 text-left border rounded-lg transition-colors ${
                                preferences.budget === option.value
                                  ? "border-purple-500 bg-purple-50"
                                  : "border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              <div className="font-medium text-sm">
                                {option.label}
                              </div>
                              <div className="text-xs text-gray-600">
                                {option.description}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Vibes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Desired Vibes (select multiple)
                        </label>
                        <div className="flex flex-wrap gap-2 text-gray-700">
                          {vibeOptions.map((vibe) => (
                            <button
                              key={vibe}
                              type="button"
                              onClick={() =>
                                togglePreferenceItem("vibes", vibe)
                              }
                              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                preferences.vibes.includes(vibe)
                                  ? "border-purple-500 bg-purple-100 text-purple-700"
                                  : "border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              {vibe}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Atmosphere */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Atmosphere
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {atmosphereOptions.map((atmosphere) => (
                            <button
                              key={atmosphere}
                              type="button"
                              onClick={() =>
                                togglePreferenceItem("atmosphere", atmosphere)
                              }
                              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                preferences.atmosphere.includes(atmosphere)
                                  ? "border-purple-500 bg-purple-100 text-purple-700"
                                  : "border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              {atmosphere}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Cuisine (for food) */}
                      {venueType === "food" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cuisine Preferences
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {cuisineOptions.map((cuisine) => (
                              <button
                                key={cuisine}
                                type="button"
                                onClick={() =>
                                  togglePreferenceItem("cuisine", cuisine)
                                }
                                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                  preferences.cuisine?.includes(cuisine)
                                    ? "border-purple-500 bg-purple-100 text-purple-700"
                                    : "border-gray-300 hover:border-gray-400"
                                }`}
                              >
                                {cuisine}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Activity Type (for entertainment) */}
                      {venueType === "entertainment" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Activity Preferences
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {activityOptions.map((activity) => (
                              <button
                                key={activity}
                                type="button"
                                onClick={() =>
                                  togglePreferenceItem("activityType", activity)
                                }
                                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                  preferences.activityType?.includes(activity)
                                    ? "border-purple-500 bg-purple-100 text-purple-700"
                                    : "border-gray-300 hover:border-gray-400"
                                }`}
                              >
                                {activity}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column: Location Search and Selected Location */}
                <div className="lg:col-span-2 space-y-3">
                  {/* Location Search */}
                  <div className="space-y-3">
                    <label className="block text-md font-medium text-gray-700 mb-2">
                      Search Location (Country, City, District) *
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Search Bar */}
                      <div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={locationQuery}
                            onChange={(e) => setLocationQuery(e.target.value)}
                            className="form-input flex-1"
                            placeholder="e.g., New York, Tokyo, London, Singapore..."
                            onKeyPress={(e) =>
                              e.key === "Enter" && searchLocations()
                            }
                          />
                          <button
                            type="button"
                            onClick={searchLocations}
                            disabled={
                              searchingLocations || !locationQuery.trim()
                            }
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                          >
                            {searchingLocations ? "Searching..." : "Search"}
                          </button>
                        </div>

                        {/* Location Results */}
                        {locations.length > 0 && (
                          <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 mt-2">
                            <p className="text-sm text-gray-600 font-medium">
                              Select a location:
                            </p>
                            {locations.map((location) => (
                              <button
                                key={location.place_id}
                                type="button"
                                onClick={() => {
                                  setSelectedLocation(location);
                                  setLocations([]);
                                }}
                                className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors border"
                              >
                                <span className="text-sm text-gray-900">
                                  {location.formatted_address}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Selected Location Display */}
                      {selectedLocation && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg h-fit">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-sm font-medium text-green-800">
                                Selected Location:
                              </span>
                              <p className="text-sm text-green-700">
                                {selectedLocation.formatted_address}
                              </p>
                              <span className="text-sm font-medium text-green-800">
                                Venue Type:
                              </span>
                              <p className="text-sm text-green-700">
                                {venueType === "food"
                                  ? "🍽️ Food Places"
                                  : "🎮 Outing Places"}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLocation(null);
                                setRecommendations([]);
                              }}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Change
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setIsCollapsed(false);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8 flex-shrink-0">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">
            {useAI
              ? "🤖 AI is analyzing reviews and finding perfect matches..."
              : "Finding the best venues..."}
          </p>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="flex flex-col flex-1 min-h-0 space-y-3">
          <h4 className="font-medium text-gray-800 flex-shrink-0">
            {useAI ? "🎯 AI-Curated " : "Top Rated "}
            {venueType === "food" ? "Restaurants" : "Entertainment Venues"}
            <span className="text-sm text-gray-500 ml-1">
              ({recommendations.length} found
              {useAI ? ", personalized for you" : ", sorted by rating"})
            </span>
          </h4>

          <div className="overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
              {recommendations.map((place) => {
                const isSelected = selectedVenues.some(
                  (v) => v.place_id === place.place_id
                );
                const currentIndex = currentPhotoIndex[place.place_id] || 0;
                const photos = place.photos || [];

                return (
                  <div
                    key={place.place_id}
                    className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all h-fit ${
                      isSelected
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                    onClick={() => toggleVenueSelection(place)}
                    onMouseEnter={() => setHoveredPlaceId(place.place_id)}
                    onMouseLeave={() => setHoveredPlaceId(null)}
                  >
                    {/* Photo Carousel */}
                    {photos.length > 0 && (
                      <div className="relative h-48 bg-gray-200">
                        <img
                          src={`/api/places/photo?photoreference=${photos[currentIndex].photo_reference}&maxwidth=400`}
                          alt={place.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error(
                              `Failed to load image for ${place.name}`
                            );
                            e.currentTarget.src =
                              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23ddd" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="%23999" font-size="16">No Image</text></svg>';
                          }}
                        />

                        {/* Carousel Controls */}
                        {photos.length > 1 && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentPhotoIndex((prev) => ({
                                  ...prev,
                                  [place.place_id]:
                                    currentIndex === 0
                                      ? photos.length - 1
                                      : currentIndex - 1,
                                }));
                              }}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 19l-7-7 7-7"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentPhotoIndex((prev) => ({
                                  ...prev,
                                  [place.place_id]:
                                    currentIndex === photos.length - 1
                                      ? 0
                                      : currentIndex + 1,
                                }));
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>

                            {/* Photo indicators */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                              {photos.map((_, idx) => (
                                <div
                                  key={idx}
                                  className={`w-2 h-2 rounded-full ${
                                    idx === currentIndex
                                      ? "bg-white"
                                      : "bg-white bg-opacity-50"
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}

                        {/* Selection checkbox overlay */}
                        <div
                          className={`absolute top-2 right-2 w-6 h-6 border-2 rounded flex items-center justify-center ${
                            isSelected
                              ? "border-green-500 bg-green-500"
                              : "border-white bg-white bg-opacity-50"
                          }`}
                        >
                          {isSelected && (
                            <span className="text-white text-xs">✓</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h5 className="font-semibold text-gray-900 text-sm line-clamp-1">
                          {place.name}
                        </h5>
                        <div className="flex items-center text-yellow-500 flex-shrink-0">
                          <span className="text-sm font-medium">
                            ⭐ {place.rating}
                          </span>
                        </div>
                      </div>

                      {useAI && place.ai_analysis && (
                        <div className="mb-2">
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                            AI Match:{" "}
                            {Math.round(
                              (place.ai_analysis.vibe_match_score +
                                place.ai_analysis.budget_match_score +
                                place.ai_analysis.atmosphere_match_score) /
                                3
                            )}
                            /10
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {place.vicinity}
                      </p>

                      {/* AI Analysis */}
                      {useAI && place.ai_analysis && (
                        <div className="space-y-2 mb-3">
                          <p className="text-xs text-gray-700 line-clamp-2">
                            {place.ai_analysis.summary}
                          </p>

                          {place.ai_analysis.key_highlights.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-green-700 mb-1">
                                ✨ Highlights:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {place.ai_analysis.key_highlights
                                  .slice(0, 2)
                                  .map((highlight, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                                    >
                                      {highlight}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="font-medium">
                          {getPriceLabel(place.price_level)}
                        </span>
                        {place.opening_hours?.open_now !== undefined && (
                          <span
                            className={`font-medium ${
                              place.opening_hours.open_now
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {place.opening_hours.open_now
                              ? "🟢 Open"
                              : "🔴 Closed"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* No results message */}
      {selectedLocation && !loading && recommendations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>
            No {venueType === "food" ? "restaurants" : "entertainment venues"}{" "}
            found in this area.
          </p>
          <p className="text-sm">
            Try searching for a different location or{" "}
            {useAI ? "adjusting your preferences" : "changing the venue type"}.
          </p>
        </div>
      )}
    </div>
  );
}
