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
