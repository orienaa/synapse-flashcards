export const config = {
    runtime: "edge",
};

export default async function handler(req: Request) {
    if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    try {
        const { text } = await req.json();

        if (!text || typeof text !== "string") {
            return new Response(
                JSON.stringify({ error: "Text is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.ANTHROPIC_API_KEY!,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: "claude-haiku-4-5-20251001",
                max_tokens: 16384,
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
            console.error("Anthropic API Error:", response.status, errorData);

            return new Response(
                JSON.stringify({ error: errorData.error?.message || `API error: ${response.status}` }),
                { status: response.status, headers: { "Content-Type": "application/json" } }
            );
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Generate API error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to generate flashcards" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
