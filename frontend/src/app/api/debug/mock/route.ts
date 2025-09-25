import { NextRequest, NextResponse } from "next/server";

// Mock AI analysis for testing when API quota is exceeded
function generateMockAnalysis(venue: any, preferences: any) {
  console.log("🎭 Using mock AI analysis for:", venue.name);

  // Simple scoring based on preferences
  const budgetScore = calculateBudgetScore(
    venue.price_level,
    preferences.budget
  );
  const vibeScore = calculateVibeScore(venue.types, preferences.vibes);
  const atmosphereScore = Math.floor(Math.random() * 3) + 7; // 7-10 range

  return {
    sentiment_score: Math.floor(Math.random() * 3) + 7, // 7-10 range
    vibe_match_score: vibeScore,
    budget_match_score: budgetScore,
    atmosphere_match_score: atmosphereScore,
    summary: generateMockSummary(venue, preferences, budgetScore, vibeScore),
    key_highlights: [
      "Great customer service",
      "Good value for money",
      "Pleasant atmosphere",
    ],
    potential_concerns:
      venue.rating < 4.0 ? ["Some mixed reviews on service"] : [],
  };
}

function calculateBudgetScore(
  priceLevel: number | undefined,
  budget: string
): number {
  if (!priceLevel) return 5;

  const budgetMap: { [key: string]: number } = {
    budget: 1,
    "mid-range": 2,
    upscale: 3,
    luxury: 4,
  };

  const expectedPrice = budgetMap[budget] || 2;
  const difference = Math.abs(priceLevel - expectedPrice);

  return Math.max(1, 10 - difference * 2);
}

function calculateVibeScore(types: string[], vibes: string[]): number {
  if (!types || !vibes || vibes.length === 0) return 5;

  // Simple keyword matching
  const venueKeywords = types.join(" ").toLowerCase();
  let matches = 0;

  vibes.forEach((vibe) => {
    if (
      venueKeywords.includes(vibe.toLowerCase()) ||
      (venueKeywords.includes("restaurant") && vibe === "casual")
    ) {
      matches++;
    }
  });

  return Math.min(10, 5 + matches * 2);
}

function generateMockSummary(
  venue: any,
  preferences: any,
  budgetScore: number,
  vibeScore: number
): string {
  const overallScore = (budgetScore + vibeScore) / 2;

  if (overallScore >= 8) {
    return `${venue.name} is an excellent match for your preferences. The ${
      preferences.budget
    } pricing aligns well with your budget, and the atmosphere matches your desired ${preferences.vibes
      ?.slice(0, 2)
      .join(" and ")} vibes.`;
  } else if (overallScore >= 6) {
    return `${
      venue.name
    } is a decent option that partially matches your preferences for ${
      preferences.vibes?.slice(0, 1)[0] || "dining"
    } experiences, though some aspects might not be perfect.`;
  } else {
    return `${venue.name} may not be the best fit for your preferences, particularly regarding budget and atmosphere expectations.`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { venue, preferences, useMock } = body;

    console.log("🧪 MOCK AI Testing...");
    console.log("📍 Venue:", venue?.name || "Test Venue");
    console.log("⚙️ Preferences:", JSON.stringify(preferences, null, 2));

    // Default test data
    const testVenue = venue || {
      name: "Marina Bay Sands Restaurant",
      rating: 4.2,
      price_level: 3,
      types: ["restaurant", "fine_dining"],
      reviews: [
        {
          text: "Amazing fine dining experience with breathtaking views. Romantic and sophisticated atmosphere.",
          rating: 5,
        },
      ],
    };

    const testPreferences = preferences || {
      budget: "upscale",
      vibes: ["romantic", "sophisticated"],
      atmosphere: ["elegant", "modern"],
      cuisine: ["fine_dining"],
    };

    // Generate mock analysis
    const mockAnalysis = generateMockAnalysis(testVenue, testPreferences);

    return NextResponse.json({
      success: true,
      message: "Mock AI analysis (for testing without API limits)",
      venue_name: testVenue.name,
      preferences_used: testPreferences,
      ai_analysis: mockAnalysis,
      debug_info: {
        is_mock: true,
        venue_provided: !!venue,
        preferences_provided: !!preferences,
        review_count: testVenue.reviews?.length || 0,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("🚨 Mock API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
