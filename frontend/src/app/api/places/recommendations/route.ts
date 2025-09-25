import { NextRequest, NextResponse } from "next/server";
import { getPlaceRecommendations } from "../../../../../../backend/helpers/googleMapsClient";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, type, radius } = body;

    if (!location || !location.lat || !location.lng || !type) {
      return NextResponse.json(
        { success: false, error: "Location and type are required" },
        { status: 400 }
      );
    }

    const recommendations = await getPlaceRecommendations(
      location,
      type,
      radius
    );

    return NextResponse.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    console.error("Recommendations error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
