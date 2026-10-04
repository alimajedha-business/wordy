# Agent Instructions --- Kalameh Bazi

## Role

You are the senior engineer responsible for implementing **Kalameh
Bazi**, a mobile-first, Persian-language party game. Follow `spec.md` as
the source of truth. Build a reliable, polished MVP before adding
optional features.

## Required workflow

1.  Inspect the existing repository before changing anything.
2.  If the repository is empty, scaffold the application using the stack
    below.
3.  Read `spec.md` completely and convert it into a concise
    implementation plan.
4.  Implement in small, verifiable milestones. Do not attempt a large
    unreviewable code dump.
5.  After each milestone, run type-checking, linting, tests, and a
    production build where applicable. Fix failures before proceeding.
6.  Keep the README updated with setup, development, build, deployment,
    and iPhone installation instructions.
7.  Do not silently change game rules. If a requirement is ambiguous,
    choose the simplest behavior consistent with the specification and
    document the decision.

## Technology decisions

-   Frontend: React + TypeScript + Vite.
-   UI: Material UI (MUI) v5, using responsive layouts and theme tokens.
-   Routing: React Router only if multiple routes are genuinely useful;
    otherwise keep the MVP simple.
-   State: use a small, well-structured React state layer (Context +
    reducer or a lightweight store). Avoid unnecessary state libraries.
-   Persistence: local-first. Use IndexedDB (for example, `idb`) for
    editable word packs and saved game history; use localStorage only
    for small preferences.
-   PWA: installable web app with a web app manifest, service worker,
    app icons, and HTTPS deployment. Verify behavior on iOS Safari.
-   Tests: Vitest + React Testing Library for unit/component tests; test
    game rules and scoring thoroughly.
-   Language: Persian (fa-IR), RTL by default. All player-facing UI must
    be Persian. Code identifiers and documentation remain English.
-   No backend is required for the MVP. Do not add authentication,
    accounts, or online multiplayer unless explicitly requested.

## Product and UX principles

-   The app is used by groups sharing one phone. Optimize for quick
    hand-offs and large touch targets.
-   Mobile portrait is the primary layout. Support small phones, large
    phones, tablets, and desktop without horizontal scrolling.
-   Use `dir="rtl"` and an RTL-aware MUI theme. Ensure numbers, timer
    display, and mixed Persian/Latin text remain readable.
-   Use clear visual separation between the hidden prompt and the
    team-facing game screen.
-   The secret word/phrase must never be exposed on the active team
    display except in an explicit reveal/confirmation flow after the
    turn.
-   Buttons must be large, easy to hit, and spaced to reduce accidental
    taps.
-   Prevent accidental navigation/reload from destroying an active turn
    where feasible. Persist the current game state locally.
-   Timer accuracy must use an absolute deadline
    (`deadline = startedAt + duration`) rather than decrementing a
    counter once per second. Recompute remaining time from the deadline
    to avoid drift.
-   Handle app backgrounding and returning to the foreground: the timer
    continues according to wall-clock time.
-   When time expires, automatically end the turn, record the result,
    and prevent further scoring actions for that turn.

## Game rules that must be implemented

-   A game has at least two teams. Team names are configurable.
-   There are three rounds, in this order:
    -   Round 1 --- describe the prompt using exactly one sentence; 5
        minutes per team; +1 point for a correct answer.
    -   Round 2 --- act the prompt using charades; 12 minutes per team;
        +3 points for a correct answer.
    -   Round 3 --- draw the prompt; 20 minutes per team; +5 points for
        a correct answer.
-   Each team gets one turn in each round. Team order is consistent
    across rounds unless the host changes it before the game starts.
-   Each turn starts only after the host presses Start.
-   During a turn, the host can mark the current prompt Correct,
    Wrong/Skip, or Error.
-   Correct adds the round's configured points and advances to the next
    prompt.
-   Wrong/Skip adds no points and advances to the next prompt.
-   Error subtracts exactly 1 point from that team and advances to the
    next prompt.
-   Scores may not fall below zero unless the product owner explicitly
    changes this rule. Clamp at zero and document this behavior.
-   A turn ends when its timer expires or the host manually ends it.
-   Teams may answer as many prompts as possible before the time
    expires.
-   Do not award points for a prompt more than once.
-   The game ends after every team has completed all three rounds. Show
    final ranking, total scores, and a tie state when applicable.

## Prompt and fairness rules

-   Prompt types:
    -   `WORD`: a concrete, guessable word.
    -   `PHRASE`: a meaningful, commonly understood phrase.
    -   `PROVERB`: a recognized Persian proverb or saying.
-   Proverb prompts are forbidden in Round 1 and allowed in Rounds 2 and
    3.
-   Proper nouns are forbidden: no movie, book, fictional character,
    celebrity, athlete, vehicle model/name, city, country, brand, or
    other named entity.
-   Abstract, imaginary, or purely conceptual prompts are forbidden.
-   Nonsensical combinations of unrelated words are forbidden.
-   Prompts must be suitable for the mechanic of their round.
-   Difficulty must rise with round point value: Round 1 easiest, Round
    2 medium, Round 3 hardest.
-   Fairness is more important than raw randomness. Every team in a
    given round must receive the same prompt-type distribution and
    equivalent difficulty.
-   Implement a **round prompt plan** before play begins. For each
    round, generate or select a balanced sequence of prompt slots shared
    across all teams. A slot defines prompt type and difficulty band.
    Example: if team A receives a proverb in slot 3 of Round 2, every
    other team must also receive a proverb in slot 3 of Round 2.
-   Do not show the same exact prompt to multiple teams in the same
    round unless the host enables a future explicit "repeat prompts"
    option. Prefer unique prompts while preserving slot type and
    difficulty.
-   Prompt selection must be deterministic from the prepared game plan
    once the round begins. Do not reshuffle the plan separately for each
    team.
-   If the prompt bank cannot satisfy a slot, do not silently substitute
    a different type or difficulty. Show a clear host warning and let
    the host replace the prompt before the round starts.
-   Provide a host-only prompt preview and an option to replace a prompt
    before it is revealed to the active team.

## Architecture and code quality

-   Separate domain/game logic from React components.
-   Suggested domain modules:
    -   `game/types.ts`
    -   `game/rules.ts`
    -   `game/scoring.ts`
    -   `game/timer.ts`
    -   `game/promptPlanner.ts`
    -   `game/gameReducer.ts`
-   Keep prompt data separate from UI code. Store seed prompts in JSON
    files and validate them at runtime or build time.
-   Include prompt metadata: stable ID, Persian text, type, difficulty,
    allowed rounds, and optional tags.
-   Avoid hardcoding prompt lists inside components.
-   Use strict TypeScript. Avoid `any`; use discriminated unions for
    prompt types and game statuses.
-   Keep components small and focused.
-   Do not add unnecessary dependencies.
-   Use accessible labels, keyboard support on desktop, and visible
    focus states.
-   Do not use color alone to communicate Correct, Wrong, or Error;
    include text/icons.

## Suggested milestones

1.  Project scaffold, RTL theme, responsive app shell, and PWA basics.
2.  Setup flow: team creation, team ordering, and game review.
3.  Prompt data model, seed bank, validation, and balanced round
    planner.
4.  Turn screen: prompt reveal, timer, Correct/Wrong/Error actions.
5.  Scoring, round transitions, game completion, and results screen.
6.  Persistence, resume behavior, and recovery from refresh/background.
7.  Tests, accessibility, responsive QA, and deployment documentation.

## Acceptance criteria

-   The app can be used on a phone in portrait orientation without
    horizontal scrolling.
-   A host can create a game with at least two teams and start it.
-   The app follows the exact round durations and point values in
    `spec.md`.
-   Timer behavior remains correct after backgrounding the app.
-   Correct, Wrong/Skip, and Error have the specified effects.
-   Round prompt plans preserve prompt type and difficulty parity across
    teams.
-   Proverbs never appear in Round 1.
-   Invalid prompt categories and proper nouns are excluded by
    validation/review.
-   Scores and active game state survive refresh/reopen.
-   Final results correctly handle ties.
-   Unit tests cover scoring, timer expiry, turn progression, and prompt
    fairness.
-   The app can be deployed over HTTPS and added to an iPhone Home
    Screen through Safari.

## Out of scope for MVP

-   Online multiplayer or remote team participation.
-   User accounts and cloud synchronization.
-   Ads, payments, subscriptions, or analytics.
-   AI-generated prompts at runtime.
-   Native iOS/Android binaries.
-   Public leaderboards.

Do not implement out-of-scope features unless asked.
