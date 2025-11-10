import { Client } from "@googlemaps/google-maps-services-js";
import { generateVenueAnalysis } from "./aiClient";

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
  reviews?: Array<{
    text: string;
    rating: number;
    time: number;
  }>;
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
      photos: place.photos?.slice(0, 5).map((photo) => ({
        photo_reference: photo.photo_reference,
        height: photo.height,
        width: photo.width,
      })),
      opening_hours: place.opening_hours,
    }));
  } catch (error) {
    console.error("Error getting place recommendations:", error);
    return [];
  }
}

export async function getPlaceDetailsWithReviews(placeId: string) {
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
          "types",
          "photos",
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

export async function getAIPoweredRecommendations(
  location: { lat: number; lng: number },
  type: "food" | "entertainment",
  preferences: any,
  radius: number = 5000
) {
  try {
    // Get initial recommendations
    const places = await getPlaceRecommendations(location, type, radius);

    // Get detailed reviews for top places
    const enhancedPlaces = await Promise.all(
      places.slice(0, 15).map(async (place) => {
        const details = await getPlaceDetailsWithReviews(place.place_id);

        if (details && details.reviews) {
          // Analyze with AI
          const aiAnalysis = await generateVenueAnalysis(
            {
              name: place.name,
              rating: place.rating,
              price_level: place.price_level,
              types: place.types,
              reviews: details.reviews.slice(0, 10), // Analyze top 10 reviews
            },
            preferences
          );

          return {
            ...place,
            reviews: details.reviews,
            ai_analysis: aiAnalysis,
          };
        }

        return place;
      })
    );

    // Sort by AI recommendation score
    return enhancedPlaces
      .filter((place) => place.ai_analysis)
      .sort((a, b) => {
        const scoreA =
          (a.ai_analysis?.vibe_match_score || 0) +
          (a.ai_analysis?.budget_match_score || 0) +
          (a.ai_analysis?.atmosphere_match_score || 0);
        const scoreB =
          (b.ai_analysis?.vibe_match_score || 0) +
          (b.ai_analysis?.budget_match_score || 0) +
          (b.ai_analysis?.atmosphere_match_score || 0);
        return scoreB - scoreA;
      });
  } catch (error) {
    console.error("Error getting AI-powered recommendations:", error);
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
