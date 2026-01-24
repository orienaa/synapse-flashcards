import type { ParsedCard } from "../types";

interface AIResponse {
    title: string;
    cards: ParsedCard[];
}

// Parse flashcards using Claude Haiku API
// In development: calls Anthropic API directly (requires ANTHROPIC_API_KEY in .env)
// In production: calls /api/generate serverless function (API key stored in Vercel)
export async function parseFlashcardsWithAI(
    text: string,
    apiKey?: string
): Promise<AIResponse> {
    try {
        const isDev = import.meta.env.DEV;
        const devApiKey = apiKey || import.meta.env.ANTHROPIC_API_KEY;

        let data;

        if (isDev && devApiKey) {
            // Development: call Anthropic API directly
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": devApiKey,
                    "anthropic-version": "2023-06-01",
                    "anthropic-dangerous-direct-browser-access": "true",
                },
                body: JSON.stringify({
                    model: "claude-haiku-4-5-20251001",
                    max_tokens: 8192,
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: `Create flashcards from this text. Output valid JSON only.

<text>
${text}
</text>

JSON format:
{"title":"Title","cards":[{"question":"Q","answer":"A","options":["A","B","C","D"],"correctIndex":0}]}

Rules:
- Keep the same language as input
- If input has multiple choice (a/b/c/d), preserve options and set correctIndex (0-based)
- For factual questions, add 4 multiple choice options
- "options" and "correctIndex" are optional - omit for open-ended questions
- Output ONLY valid JSON, no markdown or explanation`,
                                },
                            ],
                        },
                    ],
                    temperature: 1,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("API Error:", response.status, errorData);

                if (response.status === 401) {
                    throw new Error(
                        "Invalid API key. Please check your Anthropic API key."
                    );
                } else if (response.status === 403) {
                    throw new Error(
                        "API key doesn't have permission. Make sure you have API access enabled."
                    );
                } else if (response.status === 429) {
                    throw new Error("Rate limited. Please wait a moment and try again.");
                }

                throw new Error(
                    errorData.error?.message || `API error: ${response.status}`
                );
            }

            data = await response.json();
        } else {
            // Production: use serverless function at /api/generate
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error || `Failed to generate flashcards: ${response.status}`
                );
            }

            data = await response.json();
        }

        console.log("API Response:", data);

        const content = data.content[0].text;
        console.log("Raw content:", content);

        // Extract JSON object from anywhere in the response
        const jsonMatch = content.match(
            /\{[\s\S]*?"title"[\s\S]*?"cards"\s*:\s*\[[\s\S]*?\]\s*\}/
        );

        if (!jsonMatch) {
            console.error("Could not find JSON in response:", content);
            throw new Error(
                "Could not find valid flashcard data in AI response. Please try again."
            );
        }

        const jsonStr = jsonMatch[0];
        console.log("Extracted JSON:", jsonStr);

        const parsed = JSON.parse(jsonStr) as AIResponse;

        if (!parsed.title || !Array.isArray(parsed.cards)) {
            throw new Error("Invalid response format from AI");
        }

        return parsed;
    } catch (error) {
        console.error("parseFlashcardsWithAI error:", error);
        throw error;
    }
}
