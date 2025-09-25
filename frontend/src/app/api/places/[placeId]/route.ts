import { NextRequest, NextResponse } from "next/server";
import { getPlaceDetails } from "../../../../../../backend/helpers/googleMapsClient";

export async function GET(
  request: NextRequest,
  { params }: { params: { placeId: string } }
) {
  try {
    const details = await getPlaceDetails(params.placeId);

    if (!details) {
      return NextResponse.json(
        { success: false, error: "Place not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      details,
    });
  } catch (error) {
    console.error("Place details error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get place details" },
      { status: 500 }
    );
  }
}
