import type { ParsedCard } from "../types";

interface AIResponse {
    title: string;
    cards: ParsedCard[];
}

// Parse flashcards using Claude Haiku API
// In development: calls Anthropic API directly (requires VITE_ANTHROPIC_API_KEY in .env)
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
It correctly recognized the language and format of the given text, not generating own questions or text but merely copied since a specified structure was found. 
</example_description>
<TEXT>
I. Istoric și Concepte Fundamentale
1.	Care dintre următorii este considerat părintele geneticii moderne?
o	Răspuns: Gregor Mendel 
2.	În ce a constat The Human Genome Project?
o	Răspuns: Genotiparea a peste 3 miliarde de litere ale genomului uman 
3.	Primul cercetător care a oferit dovezi despre faptul că genele sunt localizate pe cromozomi a fost:
o	Răspuns: Morgan 
4.	Watson și Crick au descoperit structura ADN-ului utilizând preponderent:
o	Răspuns: Machete din carton 
5.	Care dintre următorii cercetători a avut o contribuție fundamentală la descoperirea formei ADN-ului, dar nu a primit premiul Nobel?
o	Răspuns: Rosalind Franklin 

</TEXT>
<ideal_output>
{
    "title": "EXAMEN GENETICĂ COMPORTAMENTALĂ UMANĂ - BANCĂ DE ÎNTREBĂRI",
    "cards": [
        {
            "question": "Care dintre următorii este considerat părintele geneticii moderne?",
            "answer": "Gregor Mendel"
        },
        {
            "question": "În ce a constat The Human Genome Project?",
            "answer": "Genotiparea a peste 3 miliarde de litere ale genomului uman"
        },
        {
            "question": "Primul cercetător care a oferit dovezi despre faptul că genele sunt localizate pe cromozomi a fost:",
            "answer": "Morgan"
        },
        {
            "question": "Watson și Crick au descoperit structura ADN-ului utilizând preponderent:",
            "answer": "Machete din carton"
        },
        {
            "question": "Care dintre următorii cercetători a avut o contribuție fundamentală la descoperirea formei ADN-ului, dar nu a primit premiul Nobel?",
            "answer": "Rosalind Franklin"
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

Your task is to create flashcards that will help someone study and learn the key information from this text. Each flashcard should have a question and an answer.

Format your response as a JSON object following this exact structure:

{
    "title": "Deck Title",
    "cards": [
        {
            "question": "Question here?",
            "answer": "Answer here"
        }
    ]
}

Guidelines for creating effective flashcards:
- Check what language is being used, and do not deviate from that language.
- If the text is already formatted in a Question - Answer format, do not generate any questions or answers but merely format them into the JSON structure
- Extract the most important concepts, facts, definitions, and relationships from the text
- Write clear, specific questions that test understanding of one concept at a time
- Keep answers concise but complete enough to be informative
- Create multiple flashcards if the text covers multiple topics or concepts
- Use question formats like "What is...", "Define...", "How does...", "Why does...", etc.
- Avoid overly broad questions that would require very long answers

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
