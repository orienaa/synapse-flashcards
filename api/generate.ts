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
                max_tokens: 20000,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `<examples>
<example>
<example_description>
Simple Q&A format - correctly recognized and converted to flashcards.
</example_description>
<TEXT>
1. What is the capital of France?
Answer: Paris
2. What is the largest planet?
Answer: Jupiter
</TEXT>
<ideal_output>
{
    "title": "Geography & Science Quiz",
    "cards": [
        {
            "question": "What is the capital of France?",
            "answer": "Paris"
        },
        {
            "question": "What is the largest planet?",
            "answer": "Jupiter"
        }
    ]
}
</ideal_output>
</example>

<example>
<example_description>
Multiple choice format detected - preserves options and marks correct answer.
</example_description>
<TEXT>
1. Which planet is known as the Red Planet?
a) Venus
b) Mars
c) Jupiter
d) Saturn
Answer: b) Mars

2. What is H2O commonly known as?
a) Salt
b) Sugar
c) Water
d) Oxygen
Answer: c) Water
</TEXT>
<ideal_output>
{
    "title": "Science Multiple Choice",
    "cards": [
        {
            "question": "Which planet is known as the Red Planet?",
            "answer": "Mars",
            "options": ["Venus", "Mars", "Jupiter", "Saturn"],
            "correctIndex": 1
        },
        {
            "question": "What is H2O commonly known as?",
            "answer": "Water",
            "options": ["Salt", "Sugar", "Water", "Oxygen"],
            "correctIndex": 2
        }
    ]
}
</ideal_output>
</example>

<example>
<example_description>
Plain text - AI generates questions AND creates multiple choice options where appropriate.
</example_description>
<TEXT>
Photosynthesis is the process by which plants convert sunlight, water, and carbon dioxide into glucose and oxygen. This process occurs in the chloroplasts, specifically in structures containing chlorophyll.
</TEXT>
<ideal_output>
{
    "title": "Photosynthesis",
    "cards": [
        {
            "question": "What is photosynthesis?",
            "answer": "The process by which plants convert sunlight, water, and carbon dioxide into glucose and oxygen"
        },
        {
            "question": "Where does photosynthesis occur in plant cells?",
            "answer": "Chloroplasts",
            "options": ["Mitochondria", "Chloroplasts", "Nucleus", "Cell membrane"],
            "correctIndex": 1
        },
        {
            "question": "What are the inputs of photosynthesis?",
            "answer": "Sunlight, water, and carbon dioxide",
            "options": ["Glucose and oxygen", "Sunlight, water, and carbon dioxide", "ATP and NADPH", "Chlorophyll only"],
            "correctIndex": 1
        }
    ]
}
</ideal_output>
</example>
</examples>

You will be creating flashcards from text provided by the user. Here is the text to convert into flashcards:

<text>
${text}
</text>

Your task is to create flashcards that will help someone study and learn the key information from this text. Each flashcard should have a question and an answer, and optionally multiple choice options.

Format your response as a JSON object following this exact structure:

{
    "title": "Deck Title",
    "cards": [
        {
            "question": "Question here?",
            "answer": "Correct answer here",
            "options": ["Wrong option 1", "Correct answer", "Wrong option 2", "Wrong option 3"],
            "correctIndex": 1
        }
    ]
}

Guidelines for creating effective flashcards:
- Check what language is being used, and do not deviate from that language.
- If the text already has multiple choice questions, PRESERVE the options and identify the correct answer index
- If the text is Q&A format without options, you may create it as a simple flashcard OR generate plausible wrong options to make it multiple choice
- For factual questions (definitions, names, dates, places), prefer creating multiple choice with 4 options
- For conceptual/explanation questions, a simple Q&A without options is fine
- The "answer" field should always contain the correct answer text
- The "correctIndex" is the 0-based index of the correct answer in the "options" array
- Make wrong options plausible but clearly incorrect to someone who knows the material
- Keep options similar in length and style to the correct answer

Output ONLY the valid JSON object, without any additional text, explanation, or markdown code fences. Begin directly with { and end with }.`,
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
