/**
 * Anki Package (.apkg) Parser for Browser
 * 
 * Based on Node.js parser, adapted for browser using JSZip and sql.js
 * 
 * .apkg files are ZIP archives containing:
 *   - collection.anki21 (or collection.anki2): SQLite database with cards/notes
 *   - media: JSON mapping of numeric filenames to original names
 *   - 0, 1, 2, ...: Media files (images, audio) with numeric names
 */

import JSZip from "jszip";
import initSqlJs, { Database } from "sql.js";
import type { ParsedCard } from "../types";

export interface AnkiDeck {
    name: string;
    cards: ParsedCard[];
}

export interface AnkiImportResult {
    decks: AnkiDeck[];
    totalCards: number;
    warnings: string[];
}

// Field separator used by Anki in the notes.flds column
const FIELD_SEPARATOR = "\x1f";

interface AnkiModel {
    id: string;
    name: string;
    fields: string[];
    templates: { name: string; front: string; back: string }[];
    css: string;
}

interface AnkiDeckInfo {
    id: string;
    name: string;
    description: string;
}

/**
 * Strip HTML tags and decode entities from Anki content
 */
function stripHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, "text/html");
    let text = doc.body.textContent || "";
    text = text.replace(/\s+/g, " ").trim();
    return text;
}

/**
 * Check if content contains media references that we can't import
 */
function hasMediaReferences(content: string): boolean {
    return /\[sound:|<img\s|src=["']/.test(content);
}

/**
 * Browser-compatible Anki parser using sql.js
 */
class AnkiParser {
    private db: Database | null = null;
    private zip: JSZip | null = null;

    /**
     * Open and parse an .apkg file
     */
    async open(file: File): Promise<this> {
        // Load the ZIP file
        this.zip = await JSZip.loadAsync(file);

        // Find the database file (prefer anki21 format)
        const fileNames = Object.keys(this.zip.files);

        let dbFile = this.zip.file("collection.anki21") ||
            this.zip.file("collection.anki2");

        // Try to find any database file if standard names don't exist
        if (!dbFile) {
            const dbFileName = fileNames.find(name =>
                name.endsWith(".anki2") ||
                name.endsWith(".anki21") ||
                name === "collection"
            );
            if (dbFileName) {
                dbFile = this.zip.file(dbFileName);
            }
        }

        if (!dbFile) {
            throw new Error(
                `Invalid .apkg file: Could not find Anki database. Files found: ${fileNames.join(", ")}`
            );
        }

        // Extract database as ArrayBuffer
        const dbBuffer = await dbFile.async("arraybuffer");

        // Initialize sql.js
        const SQL = await initSqlJs({
            locateFile: (filename: string) => `https://sql.js.org/dist/${filename}`,
        });

        this.db = new SQL.Database(new Uint8Array(dbBuffer));

        return this;
    }

    /**
     * Get all notes (the actual flashcard content)
     */
    getNotes(): Array<{
        id: number;
        guid: string;
        modelId: number;
        modelName: string;
        modified: Date;
        tags: string[];
        fields: Record<string, string>;
        rawFields: string[];
        sortField: string;
    }> {
        if (!this.db) throw new Error("Database not opened");

        const notesResult = this.db.exec("SELECT * FROM notes");
        if (notesResult.length === 0) return [];

        const models = this.getModels();
        const columns = notesResult[0].columns;

        return notesResult[0].values.map(row => {
            // Create object from columns and values
            const note: Record<string, unknown> = {};
            columns.forEach((col, i) => {
                note[col] = row[i];
            });

            const mid = note.mid as number;
            const model = models[String(mid)];
            const fieldNames = model?.fields || ["Front", "Back"];
            const fieldValues = (note.flds as string).split(FIELD_SEPARATOR);

            // Map field names to values
            const fields: Record<string, string> = {};
            fieldNames.forEach((name, i) => {
                fields[name] = fieldValues[i] || "";
            });

            return {
                id: note.id as number,
                guid: note.guid as string,
                modelId: mid,
                modelName: model?.name || "Unknown",
                modified: new Date((note.mod as number) * 1000),
                tags: (note.tags as string).trim().split(" ").filter(Boolean),
                fields,
                rawFields: fieldValues,
                sortField: note.sfld as string,
            };
        });
    }

    /**
     * Get all cards (scheduling/review information)
     */
    getCards(): Array<{
        id: number;
        noteId: number;
        deckId: number;
        deckName: string;
        ordinal: number;
        type: number;
        queue: number;
        due: number;
        interval: number;
        easeFactor: number;
        reviews: number;
        lapses: number;
        modified: Date;
    }> {
        if (!this.db) throw new Error("Database not opened");

        const cardsResult = this.db.exec("SELECT * FROM cards");
        if (cardsResult.length === 0) return [];

        const decks = this.getDecks();
        const columns = cardsResult[0].columns;

        return cardsResult[0].values.map(row => {
            const card: Record<string, unknown> = {};
            columns.forEach((col, i) => {
                card[col] = row[i];
            });

            const did = card.did as number;

            return {
                id: card.id as number,
                noteId: card.nid as number,
                deckId: did,
                deckName: decks[String(did)]?.name || "Default",
                ordinal: card.ord as number,
                type: card.type as number,
                queue: card.queue as number,
                due: card.due as number,
                interval: card.ivl as number,
                easeFactor: card.factor as number,
                reviews: card.reps as number,
                lapses: card.lapses as number,
                modified: new Date((card.mod as number) * 1000),
            };
        });
    }

    /**
     * Get note models (templates defining card structure)
     */
    getModels(): Record<string, AnkiModel> {
        if (!this.db) throw new Error("Database not opened");

        try {
            const colResult = this.db.exec("SELECT models FROM col");
            if (colResult.length === 0 || !colResult[0].values[0][0]) {
                return {};
            }

            const modelsJson = JSON.parse(colResult[0].values[0][0] as string);
            const result: Record<string, AnkiModel> = {};

            for (const [id, model] of Object.entries(modelsJson)) {
                const m = model as {
                    name: string;
                    flds: Array<{ name: string }>;
                    tmpls: Array<{ name: string; qfmt: string; afmt: string }>;
                    css: string;
                };
                result[id] = {
                    id,
                    name: m.name,
                    fields: m.flds.map(f => f.name),
                    templates: m.tmpls.map(t => ({
                        name: t.name,
                        front: t.qfmt,
                        back: t.afmt,
                    })),
                    css: m.css,
                };
            }
            return result;
        } catch {
            return {};
        }
    }

    /**
     * Get deck information
     */
    getDecks(): Record<string, AnkiDeckInfo> {
        if (!this.db) throw new Error("Database not opened");

        const result: Record<string, AnkiDeckInfo> = {};

        // Try col.decks first (Anki 2.0 format)
        try {
            const colResult = this.db.exec("SELECT decks FROM col");
            if (colResult.length > 0 && colResult[0].values[0][0]) {
                const decksJson = JSON.parse(colResult[0].values[0][0] as string);
                for (const [id, deck] of Object.entries(decksJson)) {
                    const d = deck as { name: string; desc?: string };
                    result[id] = {
                        id,
                        name: d.name,
                        description: d.desc || "",
                    };
                }
                if (Object.keys(result).length > 0) {
                    return result;
                }
            }
        } catch {
            // Try next method
        }

        // Try decks table (Anki 2.1.28+ format)
        try {
            const decksResult = this.db.exec("SELECT id, name FROM decks");
            if (decksResult.length > 0) {
                for (const row of decksResult[0].values) {
                    const id = String(row[0]);
                    result[id] = {
                        id,
                        name: row[1] as string,
                        description: "",
                    };
                }
            }
        } catch {
            // No decks found
        }

        return result;
    }

    /**
     * Export to a simplified flashcard format (just question/answer pairs grouped by deck)
     */
    toFlashcards(): Array<{ deck: string; front: string; back: string; tags: string[] }> {
        const notes = this.getNotes();
        const cards = this.getCards();

        return cards.map(card => {
            const note = notes.find(n => n.id === card.noteId);
            return {
                deck: card.deckName,
                front: note?.fields?.Front || note?.rawFields?.[0] || "",
                back: note?.fields?.Back || note?.rawFields?.[1] || "",
                tags: note?.tags || [],
            };
        });
    }

    /**
     * Close the database
     */
    close(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        this.zip = null;
    }
}

/**
 * Parse an Anki .apkg file (ZIP containing SQLite database)
 */
export async function parseApkgFile(file: File): Promise<AnkiImportResult> {
    const warnings: string[] = [];
    const parser = new AnkiParser();

    try {
        await parser.open(file);

        const flashcards = parser.toFlashcards();

        if (flashcards.length === 0) {
            throw new Error("No cards found in this Anki package. The database might be empty.");
        }

        // Check for media references
        let mediaWarningShown = false;

        // Group by deck
        const deckCards: Record<string, ParsedCard[]> = {};

        for (const fc of flashcards) {
            // Check for media
            if (!mediaWarningShown && (hasMediaReferences(fc.front) || hasMediaReferences(fc.back))) {
                warnings.push("Some cards contain images or audio that cannot be imported. Text content will still be imported.");
                mediaWarningShown = true;
            }

            // Strip HTML
            const question = stripHtml(fc.front);
            const answer = stripHtml(fc.back);

            // Skip empty cards
            if (!question || !answer) {
                continue;
            }

            const card: ParsedCard = { question, answer };
            const deckName = fc.deck || "Imported Deck";

            if (!deckCards[deckName]) {
                deckCards[deckName] = [];
            }
            deckCards[deckName].push(card);
        }

        // Convert to array of decks
        const decks: AnkiDeck[] = Object.entries(deckCards).map(([name, cards]) => ({
            name,
            cards,
        }));

        if (decks.length === 0) {
            throw new Error("No valid cards found in this Anki package after processing.");
        }

        const totalCards = decks.reduce((sum, d) => sum + d.cards.length, 0);

        return { decks, totalCards, warnings };
    } finally {
        parser.close();
    }
}

/**
 * Parse an Anki text export file (tab-separated values)
 */
export async function parseAnkiTextFile(file: File): Promise<AnkiImportResult> {
    const warnings: string[] = [];
    const text = await file.text();
    const lines = text.split("\n").filter(line => line.trim());

    const cards: ParsedCard[] = [];

    for (const line of lines) {
        // Skip comment lines
        if (line.startsWith("#")) {
            continue;
        }

        // Split by tab (Anki's default separator)
        const parts = line.split("\t");

        if (parts.length >= 2) {
            const question = stripHtml(parts[0].trim());
            const answer = stripHtml(parts[1].trim());

            if (question && answer) {
                cards.push({ question, answer });
            }
        }
    }

    if (cards.length === 0) {
        throw new Error(
            "No valid cards found. Make sure the file is tab-separated with question and answer columns."
        );
    }

    // Use filename (without extension) as deck name
    const deckName = file.name.replace(/\.(txt|tsv)$/i, "") || "Imported Deck";

    return {
        decks: [{ name: deckName, cards }],
        totalCards: cards.length,
        warnings,
    };
}

/**
 * Parse an Anki file (auto-detect format by extension)
 */
export async function parseAnkiFile(file: File): Promise<AnkiImportResult> {
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "apkg" || extension === "colpkg") {
        return parseApkgFile(file);
    } else if (extension === "txt" || extension === "tsv") {
        return parseAnkiTextFile(file);
    } else {
        throw new Error(
            `Unsupported file format: .${extension}. Please use .apkg, .colpkg, .txt, or .tsv files.`
        );
    }
}
