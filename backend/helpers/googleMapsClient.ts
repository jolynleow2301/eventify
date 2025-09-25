import { Client } from "@googlemaps/google-maps-services-js";

const client = new Client({});

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

export async function searchLocations(
  query: string
): Promise<LocationSearchResult[]> {
  try {
    console.log("API Key exists:", !!process.env.GOOGLE_MAPS_API_KEY);
    console.log("API Key length:", process.env.GOOGLE_MAPS_API_KEY?.length);

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error("GOOGLE_MAPS_API_KEY environment variable is not set");
    }

    const response = await client.textSearch({
      params: {
        query: query,
        key: process.env.GOOGLE_MAPS_API_KEY!,
      },
    });

    return response.data.results.map((place) => ({
      place_id: place.place_id!,
      formatted_address: place.formatted_address!,
      geometry: {
        location: {
          lat: place.geometry!.location.lat,
          lng: place.geometry!.location.lng,
        },
      },
    }));
  } catch (error) {
    console.error("Error searching locations:", error);
    return [];
  }
}

export async function getPlaceRecommendations(
  location: { lat: number; lng: number },
  type: "food" | "entertainment",
  radius: number = 5000
): Promise<PlaceRecommendation[]> {
  try {
    const placeTypes =
      type === "food"
        ? ["restaurant", "food", "meal_takeaway", "cafe"]
        : [
            "tourist_attraction",
            "amusement_park",
            "bowling_alley",
            "movie_theater",
            "shopping_mall",
          ];

    const response = await client.placesNearby({
      params: {
        location: location,
        radius: radius,
        type: placeTypes[0], // Primary type
        key: process.env.GOOGLE_MAPS_API_KEY!,
      },
    });

    // Sort by rating (highest first)
    const sortedResults = response.data.results
      .filter((place) => place.rating && place.rating > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 30); // Limit to top 30 results

    return sortedResults.map((place) => ({
      place_id: place.place_id!,
      name: place.name!,
      vicinity: place.vicinity || "",
      rating: place.rating || 0,
      price_level: place.price_level,
      types: place.types || [],
      geometry: {
        location: {
          lat: place.geometry!.location.lat,
          lng: place.geometry!.location.lng,
        },
      },
      photos: place.photos?.slice(0, 1),
      opening_hours: place.opening_hours,
    }));
  } catch (error) {
    console.error("Error getting place recommendations:", error);
    return [];
  }
}

export async function getPlaceDetails(placeId: string) {
  try {
    const response = await client.placeDetails({
      params: {
        place_id: placeId,
        fields: [
          "name",
          "formatted_address",
          "rating",
          "price_level",
          "reviews",
          "opening_hours",
          "formatted_phone_number",
          "website",
        ],
        key: process.env.GOOGLE_MAPS_API_KEY!,
      },
    });

    return response.data.result;
  } catch (error) {
    console.error("Error getting place details:", error);
    return null;
  }
}
