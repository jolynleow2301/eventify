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
      console.log("Getting recommendations for:", selectedLocation, venueType);
      const response = await fetch("/api/places/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location: selectedLocation.geometry.location,
          type: venueType,
          radius: 10000,
        }),
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
      description: `Rating: ${place.rating}/5 ${
        place.price_level ? `• Price Level: ${place.price_level}/4` : ""
      }`,
      place_id: place.place_id,
      rating: place.rating,
      price_level: place.price_level,
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

  useEffect(() => {
    if (selectedLocation) {
      getRecommendations();
    }
  }, [selectedLocation, venueType]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Venue Options (Powered by Google Maps)
      </h3>

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
            <span className="text-lg">🍽️ Food Places</span>
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
            <span className="text-lg">🎮 Outing Places</span>
          </label>
        </div>
      </div>

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
            Finding the best{" "}
            {venueType === "food" ? "restaurants" : "entertainment venues"} for
            you...
          </p>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-800">
            Top Rated{" "}
            {venueType === "food" ? "Restaurants" : "Entertainment Venues"}
            <span className="text-sm text-gray-500 ml-1">
              ({recommendations.length} found, sorted by rating)
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
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-gray-900">
                          {place.name}
                        </h5>
                        <div className="flex items-center text-yellow-500">
                          <span className="text-sm font-medium">
                            ⭐ {place.rating}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        {place.vicinity}
                      </p>

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
            Try searching for a different location or changing the venue type.
          </p>
        </div>
      )}
    </div>
  );
}
