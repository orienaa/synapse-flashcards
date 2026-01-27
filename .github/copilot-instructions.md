# Synapse Flashcards - Copilot Instructions

## Architecture Overview

This is a **Tauri + React + TypeScript** flashcard app with dual deployment targets:

- **Web**: Vercel deployment with serverless API (`/api/generate.ts`)
- **Desktop**: Tauri v2 native app (Rust backend in `src-tauri/`)

**State management**: No external library—uses React hooks + localStorage for guests, Firebase Firestore for authenticated users.

## Key Data Flows

1. **Deck storage**: Guest → localStorage (`STORAGE_KEYS.DECKS/FOLDERS`), Logged-in → real-time Firestore sync via `subscribeToDecks()`
2. **AI flashcard generation**: Dev → direct Anthropic API call, Prod → `/api/generate` edge function (API key in Vercel env)
3. **Spaced repetition**: SM-2 algorithm in `src/utils/spacedRepetition.ts` — `calculateNextReview()` updates interval, easeFactor, repetitions

## Project Structure

```
src/
  components/        # Organized by feature: deck/, study/, modals/, layout/, common/
  hooks/             # useStreak, useTheme, useSettings, useStudyTimer
  utils/             # ai.ts, firebase.ts, spacedRepetition.ts, data.ts
  types/index.ts     # All interfaces: Flashcard, Deck, Folder, ParsedCard
api/generate.ts      # Vercel Edge Function for AI generation
src-tauri/           # Rust backend for desktop app
```

## Developer Commands

```bash
bun run dev        # Start Vite dev server (port 1420)
bun run build      # TypeScript check + Vite build
bun run tauri dev  # Run desktop app in dev mode (requires Rust toolchain)
vercel --prod      # Deploy to production (Vercel)
```

## Environment Variables

| Variable                 | Context    | Description                                     |
| ------------------------ | ---------- | ----------------------------------------------- |
| `VITE_ANTHROPIC_API_KEY` | Dev (.env) | Anthropic API key for local AI generation       |
| `ANTHROPIC_API_KEY`      | Vercel env | Production API key (used by `/api/generate.ts`) |

Firebase config is hardcoded in `src/utils/firebase.ts` (public project).

## Tauri Desktop Configuration

- **Config**: `src-tauri/tauri.conf.json` — app identifier: `space.oriena.flashcards`
- **Capabilities**: `src-tauri/capabilities/default.json` — permissions: `core:default`, `opener:default`
- **Build flow**: Tauri runs `bun run build` before packaging, serves from `../dist`
- **Dev**: Connects to Vite at `http://localhost:1420`
- **Window**: Default 800x600, CSP disabled for dev flexibility

## Conventions

### Component Patterns

- **Barrel exports**: Each component folder has `index.ts` re-exporting all components
- **Modal pattern**: Modals receive `onClose` + action callbacks, manage own form state
- **View state**: Single `View` type union in App.tsx controls which component renders

### Type Definitions

- All types in `src/types/index.ts` — import from `"../types"` or `"../../types"`
- `Flashcard` includes spaced repetition fields: `interval`, `easeFactor`, `repetitions`, `nextReview`
- Optional multiple choice: `options?: string[]`, `correctIndex?: number`

### Drag-and-Drop (@dnd-kit)

The app uses `@dnd-kit/core` + `@dnd-kit/sortable` for deck/folder reordering:

- **DndContext**: Wraps the entire `HomeView` with sensors for pointer, touch, and keyboard
- **DraggableItem**: Generic wrapper using `useDraggable()` — adds grip handle overlay on hover
- **SortableItem**: For reorderable lists using `useSortable()` with `SortableContext`
- **DroppableFolder**: Wraps `FolderCard`, accepts deck drops via `useDroppable({ id: "folder-{id}" })`
- **DroppableRootZone**: Drop target with id `"root-zone"` to move decks out of folders

**Pattern**: Drag handlers (`onDragStart`, `onDragEnd`) in `HomeView.tsx` call parent callbacks like `onMoveDeckToFolder(deckId, folderId | null)` and `onReorderDecks(reorderedIds, folderId)`.

### Firebase Integration

- Auth: Email/password + Google OAuth via `firebase/auth`
- Data: User-scoped collections at `users/{uid}/decks` and `users/{uid}/folders`
- Real-time: Use `subscribeToDecks()` / `subscribeToFolders()` for live sync

### Styling

- **Tailwind CSS v4** via Vite plugin — no separate config file
- Color scheme: Pink/purple aesthetic (see `border-pink-200`, `text-purple-600` patterns)
- Icons: `lucide-react` library

## AI Integration Notes

- Model: `claude-haiku-4-5-20251001`
- Dev: Direct Anthropic API call with `anthropic-dangerous-direct-browser-access` header
- Prod: Calls `/api/generate` edge function (API key in Vercel env)
- AI prompt expects JSON output only — see prompt template in `src/utils/ai.ts` lines 37-52

## Testing Considerations

- No test framework configured yet
- Manual testing: Create deck via AI, verify spaced repetition intervals update correctly
- Check both localStorage (guest) and Firebase (logged-in) paths
