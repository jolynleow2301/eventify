import { NextRequest, NextResponse } from "next/server";
import { getEventByToken } from "../../../../../../backend/api/events/get";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const result = await getEventByToken(params.token);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
