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
}

export default function VenueSelector({
  onVenuesSelected,
  selectedVenues,
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

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Venue Options (Powered by Google Maps + AI)
      </h3>

      {/* AI Toggle */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-medium text-gray-900">
              🤖 AI-Powered Recommendations
            </h4>
            <p className="text-sm text-gray-600">
              Get personalized suggestions based on reviews and your preferences
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>
      </div>

      {/* Venue Type Selection - MOVED TO TOP */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Choose Venue Type *
        </label>
        <div className="flex gap-4">
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
            <span className="text-lg text-gray-800">🍽️ Food Places</span>
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
            <span className="text-lg text-gray-800">🎮 Outing Places</span>
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
                  <div className="font-medium text-sm">{option.label}</div>
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
                  onClick={() => togglePreferenceItem("atmosphere", atmosphere)}
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
                    onClick={() => togglePreferenceItem("cuisine", cuisine)}
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

      {/* Location Search */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Search Location (Country, City, District) *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            className="form-input flex-1"
            placeholder="e.g., New York, Tokyo, London, Singapore..."
            onKeyPress={(e) => e.key === "Enter" && searchLocations()}
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
          <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
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
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
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
                {venueType === "food" ? "🍽️ Food Places" : "🎮 Outing Places"}
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

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
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
        <div className="space-y-3">
          <h4 className="font-medium text-gray-800">
            {useAI ? "🎯 AI-Curated " : "Top Rated "}
            {venueType === "food" ? "Restaurants" : "Entertainment Venues"}
            <span className="text-sm text-gray-500 ml-1">
              ({recommendations.length} found
              {useAI ? ", personalized for you" : ", sorted by rating"})
            </span>
          </h4>

          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
            {recommendations.map((place) => {
              const isSelected = selectedVenues.some(
                (v) => v.place_id === place.place_id
              );

              return (
                <div
                  key={place.place_id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                  onClick={() => toggleVenueSelection(place)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-semibold text-gray-900">
                          {place.name}
                        </h5>
                        <div className="flex items-center text-yellow-500">
                          <span className="text-sm font-medium">
                            ⭐ {place.rating}
                          </span>
                        </div>
                        {useAI && place.ai_analysis && (
                          <div className="flex gap-1">
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
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        {place.vicinity}
                      </p>

                      {/* AI Analysis */}
                      {useAI && place.ai_analysis && (
                        <div className="space-y-2 mb-3">
                          <p className="text-sm text-gray-700">
                            {place.ai_analysis.summary}
                          </p>

                          {place.ai_analysis.key_highlights.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-green-700 mb-1">
                                ✨ Highlights:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {place.ai_analysis.key_highlights.map(
                                  (highlight, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                                    >
                                      {highlight}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {place.ai_analysis.potential_concerns.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-amber-700 mb-1">
                                ⚠️ Consider:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {place.ai_analysis.potential_concerns.map(
                                  (concern, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded"
                                    >
                                      {concern}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
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
                              ? "🟢 Open Now"
                              : "🔴 Closed"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 border-2 rounded flex items-center justify-center ml-4 ${
                        isSelected
                          ? "border-green-500 bg-green-500"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Venues Summary */}
      {selectedVenues.length > 0 && (
        <div className="space-y-3 border-t pt-4">
          <h4 className="font-medium text-gray-800">
            Selected Venues ({selectedVenues.length})
          </h4>
          <div className="space-y-2">
            {selectedVenues.map((venue, index) => (
              <div
                key={venue.place_id || index}
                className="flex items-center justify-between bg-blue-50 p-3 rounded-lg"
              >
                <div>
                  <span className="font-medium text-gray-900">
                    {venue.name}
                  </span>
                  <p className="text-sm text-gray-600">{venue.address}</p>
                  <p className="text-xs text-gray-500">{venue.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onVenuesSelected(
                      selectedVenues.filter((_, i) => i !== index)
                    )
                  }
                  className="text-red-600 hover:text-red-800 text-sm font-medium ml-4"
                >
                  Remove
                </button>
              </div>
            ))}
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
