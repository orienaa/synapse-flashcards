import type { ParsedCard } from "../types";

interface AIResponse {
    title: string;
    cards: ParsedCard[];
}

// Parse flashcards using Claude Haiku API
export async function parseFlashcardsWithAI(
    text: string,
    apiKey: string
): Promise<AIResponse> {
    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "anthropic-dangerous-direct-browser-access": "true",
            },
            body: JSON.stringify({
                model: "claude-haiku-4-5-20251001",
                max_tokens: 20000,
                messages: [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "<examples>\n<example>\n<example_description>\nIt correctly recognized the language and format of the given text, not generating own questions or text but merely copied since a specified structure was found. \n</example_description>\n<TEXT>\nI. Istoric și Concepte Fundamentale\n1.\tCare dintre următorii este considerat părintele geneticii moderne?\no\tRăspuns: Gregor Mendel \n2.\tÎn ce a constat The Human Genome Project?\no\tRăspuns: Genotiparea a peste 3 miliarde de litere ale genomului uman \n3.\tPrimul cercetător care a oferit dovezi despre faptul că genele sunt localizate pe cromozomi a fost:\no\tRăspuns: Morgan \n4.\tWatson și Crick au descoperit structura ADN-ului utilizând preponderent:\no\tRăspuns: Machete din carton \n5.\tCare dintre următorii cercetători a avut o contribuție fundamentală la descoperirea formei ADN-ului, dar nu a primit premiul Nobel?\no\tRăspuns: Rosalind Franklin \n\n</TEXT>\n<ideal_output>\nexport const Deck = {\n    \"title\": \"EXAMEN GENETICĂ COMPORTAMENTALĂ UMANĂ - BANCĂ DE ÎNTREBĂRI\",\n    \"cards\": [\n        {\n            \"question\": \"Care dintre următorii este considerat părintele geneticii moderne?\",\n            \"answer\": \"Gregor Mendel\"\n        },\n        {\n            \"question\": \"În ce a constat The Human Genome Project?\",\n            \"answer\": \"Genotiparea a peste 3 miliarde de litere ale genomului uman\"\n        },\n        {\n            \"question\": \"Primul cercetător care a oferit dovezi despre faptul că genele sunt localizate pe cromozomi a fost:\",\n            \"answer\": \"Morgan\"\n        },\n        {\n            \"question\": \"Watson și Crick au descoperit structura ADN-ului utilizând preponderent:\",\n            \"answer\": \"Machete din carton\"\n        },\n        {\n            \"question\": \"Care dintre următorii cercetători a avut o contribuție fundamentală la descoperirea formei ADN-ului, dar nu a primit premiul Nobel?\",\n            \"answer\": \"Rosalind Franklin\"\n        }\n    ]\n}\n\n</ideal_output>\n</example>\n</examples>\n\n"
                            },
                            {
                                "type": "text",
                                "text": `You will be creating flashcards from text provided by the user. Here is the text to convert into flashcards:\n\n<text>\n${text}\n</text>\n\nYour task is to create flashcards that will help someone study and learn the key information from this text. Each flashcard should have a question and an answer.\n\nFormat your response as a Javascript Object / array of data following this exact structure:\n\n\`\`\`\nexport const Deck = {\n    "title": "Deck Title",\n    "cards": [\n        {\n            "question": "Care dintre următorii este considerat părintele geneticii moderne?",\n            "answer": "Gregor Mendel"\n        },\n        {\n            "question": "În ce a constat The Human Genome Project?",\n            "answer": "Genotiparea a peste 3 miliarde de litere ale genomului uman"\n        },\n     ]\n}\n\`\`\`\n\nGuidelines for creating effective flashcards:\n- Check what language is being used, and do not deviate from that language.\n- If the text is already formatted in a Question - Answer format, do not generate any questions or answers but merely format them into the JSON array structure\n- Extract the most important concepts, facts, definitions, and relationships from the text\n- Write clear, specific questions that test understanding of one concept at a time\n- Keep answers concise but complete enough to be informative\n- Create multiple flashcards if the text covers multiple topics or concepts\n- Use question formats like "What is...", "Define...", "How does...", "Why does...", etc.\n- Avoid overly broad questions that would require very long answers\n\n\nOutput only the valid JavaScript object, without any additional text, explanation, or markdown code fences. Make sure to escape the " character wherever needed  Begin directly with the opening bracket \`const deck = {\`, your input and end with closing bracket \`}\` .`
                            }
                        ]
                    }
                ],
                temperature: 1,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("API Error:", response.status, errorData);

            if (response.status === 401) {
                throw new Error("Invalid API key. Please check your Anthropic API key.");
            } else if (response.status === 403) {
                throw new Error("API key doesn't have permission. Make sure you have API access enabled.");
            } else if (response.status === 429) {
                throw new Error("Rate limited. Please wait a moment and try again.");
            }

            throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Response:", data);

        const content = data.content[0].text;
        console.log("Raw content:", content);

        // Extract JSON object from anywhere in the response
        // Find the object that contains "title" and "cards"
        const jsonMatch = content.match(/\{[\s\S]*?"title"[\s\S]*?"cards"\s*:\s*\[[\s\S]*?\]\s*\}/);

        if (!jsonMatch) {
            console.error("Could not find JSON in response:", content);
            throw new Error("Could not find valid flashcard data in AI response. Please try again.");
        }

        let jsonStr = jsonMatch[0];
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
