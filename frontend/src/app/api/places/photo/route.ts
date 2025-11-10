import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const photoReference = searchParams.get("photoreference");
    const maxWidth = searchParams.get("maxwidth") || "400";

    if (!photoReference) {
      return NextResponse.json(
        { success: false, error: "Photo reference is required" },
        { status: 400 }
      );
    }

    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    // Fetch the photo
    const response = await fetch(photoUrl);

    if (!response.ok) {
      console.error("Failed to fetch photo:", response.statusText);
      return NextResponse.json(
        { success: false, error: "Failed to fetch photo" },
        { status: response.status }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Photo proxy error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get photo" },
      { status: 500 }
    );
  }
}
