import { NextRequest, NextResponse } from "next/server";
import { submitVote } from "../../../../../../../backend/api/events/vote";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await request.json();

    // Get or create session ID for anonymous users
    let sessionId = request.cookies.get("session_id")?.value;
    if (!sessionId) {
      sessionId = uuidv4();
    }

    const result = await submitVote(params.token, body, sessionId);

    const response = NextResponse.json(result);

    // Set session cookie
    response.cookies.set("session_id", sessionId, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
