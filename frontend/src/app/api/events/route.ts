import { NextRequest, NextResponse } from "next/server";
import { createEvent } from "../../../../../backend/api/events/create";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createEvent(body);

    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
