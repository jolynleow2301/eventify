import { NextRequest, NextResponse } from "next/server";
import { searchLocations } from "../../../../../../backend/helpers/googleMapsClient";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query parameter is required" },
        { status: 400 }
      );
    }

    const locations = await searchLocations(query);

    return NextResponse.json({
      success: true,
      locations,
    });
  } catch (error) {
    console.error("Location search error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search locations" },
      { status: 500 }
    );
  }
}
