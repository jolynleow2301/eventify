import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generateRecommendation(prompt: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  return response.text;
}

export async function generateVenueAnalysis(venue: any, preferences: any) {
  try {
    console.log("🤖 AI Analysis Starting for venue:", venue.name);
    console.log("📊 User preferences:", JSON.stringify(preferences, null, 2));

    const reviewTexts =
      venue.reviews?.map((review: any) => review.text).join("\n") || "";

    console.log("📝 Review count:", venue.reviews?.length || 0);
    console.log("📝 Review text length:", reviewTexts.length);

    const prompt = `
Analyze this venue for personalized recommendations:

VENUE INFORMATION:
- Name: ${venue.name}
- Rating: ${venue.rating}/5
- Price Level: ${
      venue.price_level ? "$".repeat(venue.price_level) : "Not specified"
    }
- Types: ${venue.types?.join(", ") || "Not specified"}

USER PREFERENCES:
- Budget: ${preferences.budget}
- Desired Vibes: ${preferences.vibes?.join(", ") || "Any"}
- Preferred Atmosphere: ${preferences.atmosphere?.join(", ") || "Any"}
${
  preferences.cuisine
    ? `- Cuisine Preferences: ${preferences.cuisine.join(", ")}`
    : ""
}
${
  preferences.activityType
    ? `- Activity Preferences: ${preferences.activityType.join(", ")}`
    : ""
}

RECENT GOOGLE REVIEWS:
${reviewTexts.substring(0, 3000)} // Limit to avoid token limits

Please analyze and provide a JSON response with:
{
  "sentiment_score": [0-10 score based on review sentiment],
  "vibe_match_score": [0-10 how well venue matches desired vibes],
  "budget_match_score": [0-10 how well price level matches budget preference],
  "atmosphere_match_score": [0-10 how well atmosphere matches preferences],
  "summary": "[2-3 sentence summary of why this venue fits or doesn't fit user preferences]",
  "key_highlights": ["highlight 1", "highlight 2", "highlight 3"],
  "potential_concerns": ["concern 1", "concern 2"] (if any)
}

Focus on:
1. Analyzing review sentiment and extracting atmosphere/vibe keywords
2. Matching price level to budget preference
3. Identifying specific mentions of atmosphere, service quality, ambiance
4. Highlighting unique features mentioned in reviews
5. Noting any red flags or concerns from reviews

Provide specific, actionable insights based on the actual review content.
`;

    console.log("🚀 Sending request to AI...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = response.text;
    console.log("🤖 AI Raw Response:", responseText);

    if (!responseText) {
      throw new Error("No response text received from AI");
    }

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedResult = JSON.parse(jsonMatch[0]);
      console.log(
        "✅ AI Parsed Result:",
        JSON.stringify(parsedResult, null, 2)
      );
      return parsedResult;
    }

    // Fallback if JSON parsing fails
    return {
      sentiment_score: 5,
      vibe_match_score: 5,
      budget_match_score: 5,
      atmosphere_match_score: 5,
      summary: "Analysis unavailable",
      key_highlights: [],
      potential_concerns: [],
    };
  } catch (error) {
    console.error("Error in AI venue analysis:", error);
    return null;
  }
}
