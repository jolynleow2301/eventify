import { NextRequest, NextResponse } from "next/server";
import { getAIPoweredRecommendations } from "../../../../../../backend/helpers/googleMapsClient";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, type, preferences, radius } = body;

    if (!location || !location.lat || !location.lng || !type || !preferences) {
      return NextResponse.json(
        {
          success: false,
          error: "Location, type, and preferences are required",
        },
        { status: 400 }
      );
    }

    console.log(
      "Getting AI-powered recommendations with preferences:",
      preferences
    );

    const recommendations = await getAIPoweredRecommendations(
      location,
      type,
      preferences,
      radius || 10000
    );

    return NextResponse.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    console.error("AI Recommendations error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get AI recommendations" },
      { status: 500 }
    );
  }
}
