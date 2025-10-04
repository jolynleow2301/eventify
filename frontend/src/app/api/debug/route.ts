import { NextRequest, NextResponse } from "next/server";
import { generateVenueAnalysis } from "../../../../../backend/helpers/aiClient";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { venue, preferences } = body;

    console.log("🔍 DEBUG: Testing AI analysis...");
    console.log("📍 Venue:", JSON.stringify(venue, null, 2));
    console.log("⚙️ Preferences:", JSON.stringify(preferences, null, 2));

    // Mock venue data if not provided
    const testVenue = venue || {
      name: "Marina Bay Sands Restaurant",
      rating: 4.2,
      price_level: 3,
      types: ["restaurant", "fine_dining"],
      reviews: [
        {
          text: "Amazing fine dining experience with breathtaking views of Singapore skyline. The ambiance is romantic and sophisticated. Service was impeccable but quite expensive. Food quality justifies the price though.",
          rating: 5,
          time: Date.now(),
        },
        {
          text: "Beautiful modern restaurant with elegant atmosphere. Perfect for special occasions. Staff is very attentive and professional. The menu is creative but portions are small for the price.",
          rating: 4,
          time: Date.now(),
        },
        {
          text: "Upscale dining with stunning city views. Very romantic setting, great for dates. The food is exquisite but be prepared to spend a lot. Reservation definitely required.",
          rating: 4,
          time: Date.now(),
        },
      ],
    };

    // Mock preferences if not provided
    const testPreferences = preferences || {
      budget: "upscale",
      vibes: ["romantic", "sophisticated"],
      atmosphere: ["elegant", "modern"],
      cuisine: ["fine_dining"],
    };

    console.log("🧪 Using test data:", {
      venue: testVenue.name,
      reviewCount: testVenue.reviews?.length,
      preferences: testPreferences,
    });

    const aiAnalysis = await generateVenueAnalysis(testVenue, testPreferences);

    return NextResponse.json({
      success: true,
      venue_name: testVenue.name,
      preferences_used: testPreferences,
      ai_analysis: aiAnalysis,
      debug_info: {
        venue_provided: !!venue,
        preferences_provided: !!preferences,
        review_count: testVenue.reviews?.length || 0,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("🚨 DEBUG API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
