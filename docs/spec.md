# Product Specification --- Kalameh Bazi

## 1. Product overview

**Product name:** Kalameh Bazi (کلمه‌بازی)

**Product type:** Mobile-first, local party game for multiple teams
sharing one device.

**Primary language:** Persian (Farsi), right-to-left.

**Primary device:** iPhone and Android phones. Tablet and desktop
layouts are also supported.

**Core concept:** Teams compete to guess words, meaningful phrases, and
(in later rounds only) Persian proverbs. The game has three rounds with
different communication methods, time limits, and point values.

The MVP is a responsive Progressive Web App (PWA), not a native mobile
application. It must run in mobile Safari and Chrome and be installable
to the iPhone Home Screen using Safari's Add to Home Screen feature.

## 2. Goals

-   Make it easy to start a party game with multiple teams.
-   Let a host operate the game on one shared phone.
-   Keep turns, timers, prompts, and scoring easy to understand.
-   Ensure fairness: teams in the same round face equivalent prompt
    types and difficulty.
-   Keep all game data local in the MVP.
-   Work reliably on mobile screens, including iPhone Safari.

## 3. Non-goals for MVP

-   Online multiplayer.
-   Multiple devices participating in one game.
-   User registration or login.
-   Cloud synchronization.
-   Monetization.
-   AI prompt generation during play.
-   Native App Store / Play Store distribution.

## 4. Game setup

### 4.1 Teams

-   The host can add at least two teams.
-   Each team has a name and a score initialized to zero.
-   The host can rename, add, remove, and reorder teams before starting.
-   Team names must be non-empty after trimming whitespace.
-   The game cannot start with fewer than two teams.
-   Once the game starts, team configuration is locked for the current
    game, except through an explicit restart/setup action.

### 4.2 Game review

Before starting, show: - Team names and order. - The three rounds,
durations, and points. - A short explanation of each round. - A warning
if the prompt bank cannot create a fair plan for all teams.

The host starts the game from this screen.

## 5. Round definitions

Each team plays one turn in every round. Team order remains the same in
all rounds.

  ------------------------------------------------------------------------
  Round        Activity        Turn duration       Points per Difficulty
                                    per team   correct prompt 
  ------------ ------------ ---------------- ---------------- ------------
  1            Describe in         5 minutes               +1 Easy
               exactly one                                    
               sentence                                       

  2            Charades /         12 minutes               +3 Medium
               acting                                         

  3            Drawing            20 minutes               +5 Hard
  ------------------------------------------------------------------------

### 5.1 Round 1 --- One-sentence description

The active player sees a secret word or phrase and describes it to their
teammates using exactly one sentence.

Rules: - Only one sentence may be spoken for each prompt. - The sentence
must not contain the target word or an obvious direct form of it. - The
app does not need speech recognition in the MVP. The host/team enforces
the one-sentence rule. - Prompt type may be `WORD` or `PHRASE`. -
`PROVERB` is not allowed in this round.

### 5.2 Round 2 --- Charades

The active player acts out the secret prompt without speaking or writing
words.

Rules: - Prompt type may be `WORD`, `PHRASE`, or `PROVERB`. - No spoken
clues or writing letters/numbers. - The host/team enforces the physical
charades rules.

### 5.3 Round 3 --- Drawing

The active player draws the secret prompt while teammates guess.

Rules: - Prompt type may be `WORD`, `PHRASE`, or `PROVERB`. - No writing
the target word, letters, or numbers as a shortcut. - The MVP does not
require an in-app drawing canvas. The team may use paper/whiteboard, or
the host may optionally enable a simple on-screen canvas in a later
milestone. - The host/team enforces the drawing rules.

## 6. Prompt taxonomy and content policy

### 6.1 Allowed prompt types

-   `WORD`: a concrete object, animal, food, place category, occupation,
    action, or other directly representable concept. Avoid abstract
    concepts.
-   `PHRASE`: a meaningful, commonly understood phrase with a clear
    interpretation.
-   `PROVERB`: a recognized Persian proverb or saying. Proverbs are
    permitted only in Rounds 2 and 3.

### 6.2 Forbidden prompts

Do not include: - Abstract, imaginary, or purely conceptual terms that
cannot be represented clearly. - Nonsensical combinations of unrelated
words. - Proper nouns, including names of movies, books, fictional
characters, celebrities, athletes, vehicle models, brands, cities,
countries, or other named entities. - Obscure, disputed, offensive, or
culturally inappropriate prompts. - Ambiguous phrases with multiple
unrelated interpretations.

### 6.3 Examples

Valid examples: - `آلبالو` --- `WORD` - `بخاری برقی` --- `PHRASE` or
compound lexical item, provided it is a recognized object name -
`مسواک زدن` --- `PHRASE` - A well-known Persian proverb --- `PROVERB`,
Round 2 or 3 only

Invalid examples: - A random combination such as `پنجره خندان` - An
abstract term such as `عدالت` if it cannot be fairly represented under
the game's rules - A movie title, city name, celebrity name, or car
model

A multi-word expression is not automatically invalid. It is valid only
if it has a clear, established meaning as a real object, action,
expression, or proverb. Do not create arbitrary word combinations just
to increase the prompt count.

## 7. Difficulty and fairness system

Fairness is a central game requirement.

### 7.1 Difficulty bands

-   Round 1: `EASY`
-   Round 2: `MEDIUM`
-   Round 3: `HARD`

Difficulty should reflect how challenging a prompt is to communicate
using that round's mechanic, not merely how uncommon the word is.

### 7.2 Balanced prompt plan

Before the first turn of a game, create a complete prompt plan for every
team and round.

For each round, create a sequence of prompt slots. Each slot has: - A
prompt type (`WORD`, `PHRASE`, or `PROVERB`). - A difficulty band. - A
unique prompt assignment for each team.

The same slot index must have the same type and difficulty for every
team. Example:

  -----------------------------------------------------------------------
  Slot              Team A            Team B            Team C
  ----------------- ----------------- ----------------- -----------------
  Round 2, slot 1   WORD / MEDIUM     WORD / MEDIUM     WORD / MEDIUM

  Round 2, slot 2   PHRASE / MEDIUM   PHRASE / MEDIUM   PHRASE / MEDIUM

  Round 2, slot 3   PROVERB / MEDIUM  PROVERB / MEDIUM  PROVERB / MEDIUM
  -----------------------------------------------------------------------

The exact prompt should preferably differ between teams to avoid one
team revealing an answer to another team. The prompt assignments must be
equivalent in type and difficulty.

### 7.3 Distribution

Use a configurable, balanced distribution of prompt types. Suggested
initial distribution: - Round 1: 60% WORD, 40% PHRASE, 0% PROVERB. -
Round 2: 40% WORD, 40% PHRASE, 20% PROVERB. - Round 3: 30% WORD, 40%
PHRASE, 30% PROVERB.

For every slot, all teams must receive the same type and difficulty
band. Percentages may be approximated for short plans, but slot parity
is mandatory.

### 7.4 Prompt bank insufficiency

If there are not enough valid prompts to fill all team assignments: - Do
not silently use a forbidden type or lower difficulty. - Tell the host
which round/type/difficulty is missing. - Let the host add or replace
prompts before starting. - Never start a game with an incomplete
fairness plan.

### 7.5 Prompt reveal

-   Only the host/active player should see the current prompt.
-   Keep the prompt hidden from the rest of the team where practical
    (for example, a "Tap to reveal" screen and a "Ready / hide prompt"
    action).
-   Do not show the next prompt until the host marks the current one
    Correct, Wrong/Skip, or Error.
-   The host may replace a prompt before revealing it if it is
    unsuitable. Replacement must preserve the slot's type and
    difficulty.

## 8. Turn lifecycle and controls

### 8.1 Turn start

When a team's turn begins: - Show team name, round number, round
activity, turn duration, current score, and a Start button. - Do not
start the timer until the host presses Start. - After Start, show the
secret prompt to the active player. - The timer begins at the configured
round duration.

### 8.2 Active turn controls

The active turn screen must include: - Large remaining-time display. -
Current team and round. - Current prompt, visible only after reveal. -
`درست` (Correct). - `غلط / رد کردن` (Wrong / Skip). - `خطا` (Error). -
`پایان نوبت` (End turn), with confirmation if time remains.

Actions: - **Correct:** add the round's point value, record the prompt
as correct, then show the next prompt. - **Wrong / Skip:** add zero
points, record as skipped/wrong, then show the next prompt. - **Error:**
subtract one point from the team's score, record the error, then show
the next prompt. - Every action is applied once only. Disable controls
during transitions to prevent double taps. - The prompt outcome is
immutable after it is recorded.

### 8.3 Error definition

"Error" means the active team has violated the rules or made an invalid
attempt, as judged by the host. It deducts exactly one point and
consumes the current prompt. It is different from Wrong/Skip.

### 8.4 Score floor

For MVP, scores cannot go below zero. If a team has zero points and
receives an Error, the score remains zero. Show a brief
confirmation/feedback that the penalty was applied but the score floor
prevented a negative score.

### 8.5 Timer behavior

-   Round 1: 300 seconds.
-   Round 2: 720 seconds.
-   Round 3: 1200 seconds.
-   Timer starts only when Start is pressed.
-   Timer continues while the browser/app is in the background.
-   Use a deadline timestamp, not a decrement-only interval, to
    calculate remaining time.
-   When the timer reaches zero, automatically end the turn and disable
    scoring controls.
-   The host can manually end a turn early.
-   Confirm before manually ending a turn.
-   If the app is refreshed or reopened during an active turn, restore
    the turn and calculate remaining time from the stored deadline.
-   Format time as `MM:SS`; make the final 30 seconds visually
    noticeable and the final 10 seconds prominent. Do not rely on color
    alone.

## 9. Turn order and game progression

-   Round 1: each team plays once, in configured team order.
-   Round 2: each team plays once, in the same order.
-   Round 3: each team plays once, in the same order.
-   A team's turn ends on timeout or manual end.
-   After a turn ends, show a short summary: correct count, wrong/skip
    count, error count, points earned/deducted, and updated total score.
-   The host advances to the next team.
-   After all teams finish a round, show a round scoreboard before
    starting the next round.
-   After all teams finish Round 3, show final results.

## 10. Scoring

For a given team:

`New score = max(0, current score + correctCount * roundPoints - errorCount)`

Wrong/Skip does not affect score.

Round point values: - Round 1: 1 point per correct prompt. - Round 2: 3
points per correct prompt. - Round 3: 5 points per correct prompt.

Show: - Current team score during the turn. - Score changes in the turn
summary. - All team scores on round scoreboards. - Final total score and
rank on the results screen.

Ties: - Teams with equal total scores share the same rank. - Do not
invent a tie-breaker. Clearly label tied teams.

## 11. Screens and navigation

### 11.1 Home screen

-   App title: کلمه‌بازی
-   Primary action: شروع بازی
-   Secondary action: بانک کلمات (may be basic in MVP)
-   Optional action: قوانین بازی

### 11.2 Team setup screen

-   Add/edit/remove/reorder teams.
-   Require at least two teams.
-   Continue to game review.

### 11.3 Game review screen

-   Show teams, round rules, durations, point values.
-   Validate the prompt bank and fairness plan.
-   Start game.

### 11.4 Turn ready screen

-   Show current team and round.
-   Explain the activity.
-   Show duration and points per correct answer.
-   Start button.

### 11.5 Prompt reveal / active turn screen

-   Show a reveal interaction before exposing the prompt.
-   Display timer and team.
-   Show Correct, Wrong/Skip, Error controls.
-   Show a prompt progress indicator (for example, prompt 4).
-   Do not show hidden future prompts.

### 11.6 Turn summary screen

-   Show turn statistics and updated score.
-   Continue button.

### 11.7 Round scoreboard

-   Show every team's score and round progress.
-   Continue to next round.

### 11.8 Final results screen

-   Show winner(s), ranking, and scores.
-   Handle ties.
-   Offer New Game and Return Home.

### 11.9 Rules screen

Explain the three round mechanics, timing, scoring, and Error penalty in
Persian.

## 12. Responsive design and accessibility

-   Mobile-first; prioritize portrait orientation.
-   Support widths from 320 CSS pixels upward.
-   No horizontal scrolling at common phone widths.
-   Use safe-area insets for devices with notches and home indicators.
-   Large touch targets (preferably at least 44 × 44 CSS pixels).
-   Keep important actions within thumb reach on phones.
-   Use responsive typography and spacing.
-   Support landscape/tablet/desktop gracefully.
-   RTL layout throughout.
-   Respect reduced-motion preferences.
-   Provide accessible button names and adequate contrast.
-   Timer must remain readable at a glance.
-   Confirm destructive actions such as ending a turn or restarting a
    game.

## 13. PWA and iPhone delivery

The MVP must be a PWA served over HTTPS.

Required: - Web app manifest with name, short name, icons, theme color,
and `display: standalone`. - Service worker for app-shell caching and an
offline fallback. - `apple-touch-icon` and appropriate
viewport/safe-area metadata. - No dependency on App Store
installation. - Do not promise that every browser API behaves
identically on iOS and Android. - Test install and launch behavior on a
real iPhone using Safari.

iPhone installation instructions for the README: 1. Open the deployed
HTTPS URL in Safari. 2. Tap Share. 3. Choose Add to Home Screen. 4.
Enable Open as Web App if the option is shown. 5. Tap Add. 6. Launch
کلمه‌بازی from the Home Screen icon.

Development on a local network: - Run the Vite dev server bound to
`0.0.0.0`. - Connect the iPhone and development computer to the same
Wi-Fi. - Open the computer's LAN IP and Vite port in iPhone Safari. -
Local development over plain HTTP may not provide full PWA
installation/offline behavior. Use an HTTPS preview deployment for
realistic PWA testing.

## 14. Data model (suggested)

``` ts
type PromptType = "WORD" | "PHRASE" | "PROVERB";
type Difficulty = "EASY" | "MEDIUM" | "HARD";
type RoundNumber = 1 | 2 | 3;
type PromptOutcome = "CORRECT" | "WRONG" | "ERROR";
type GameStatus =
  | "SETUP"
  | "READY"
  | "ACTIVE_TURN"
  | "TURN_SUMMARY"
  | "ROUND_SUMMARY"
  | "FINISHED";

interface Team {
  id: string;
  name: string;
  score: number;
}

interface Prompt {
  id: string;
  text: string;
  type: PromptType;
  difficulty: Difficulty;
  allowedRounds: RoundNumber[];
  tags?: string[];
}

interface PlannedPrompt {
  teamId: string;
  round: RoundNumber;
  slotIndex: number;
  promptId: string;
  type: PromptType;
  difficulty: Difficulty;
}

interface PromptAttempt {
  promptId: string;
  outcome: PromptOutcome;
  pointsDelta: number;
  occurredAt: number;
}

interface TeamTurn {
  teamId: string;
  round: RoundNumber;
  status: "NOT_STARTED" | "ACTIVE" | "COMPLETED";
  startedAt?: number;
  deadlineAt?: number;
  endedAt?: number;
  attempts: PromptAttempt[];
  currentPromptIndex: number;
}

interface Game {
  id: string;
  status: GameStatus;
  settings: {
    /** Per-team turn duration in seconds; editable only before game start. */
    roundDurationsSeconds: Record<RoundNumber, number>;
  };
  teams: Team[];
  currentRound: RoundNumber;
  currentTeamIndex: number;
  promptPlan: PlannedPrompt[];
  turns: TeamTurn[];
  createdAt: number;
  updatedAt: number;
}
```

This is a suggested starting model. The implementation may refine it,
but must preserve the behaviors and invariants described in this
specification.

## 15. Prompt bank format

Store seed prompts in JSON, separated by type or category if useful.

Example:

``` json
[
  {
    "id": "word-cherry",
    "text": "آلبالو",
    "type": "WORD",
    "difficulty": "EASY",
    "allowedRounds": [1, 2, 3],
    "tags": ["food", "fruit"]
  },
  {
    "id": "phrase-electric-heater",
    "text": "بخاری برقی",
    "type": "PHRASE",
    "difficulty": "EASY",
    "allowedRounds": [1, 2, 3],
    "tags": ["home", "object"]
  }
]
```

Seed content must be manually reviewed for: - Correct Persian
spelling. - Clear and established meaning. - No proper nouns. - No
abstract or imaginary prompts. - Correct type and difficulty. - Proverb
round restrictions.

Do not claim a large prompt bank is curated unless it has actually been
reviewed.

## 16. Validation and invariants

Implement validation for: - At least two teams. - Unique team IDs and
prompt IDs. - Non-empty team names. - Round 1 never contains
`PROVERB`. - Prompt difficulty matches its round. - Prompt type and
difficulty parity across teams for each slot. - No duplicate prompt
assignment within the same round unless explicitly allowed. - A prompt
attempt can be recorded only once. - Correct/Wrong/Error actions are
accepted only during an active turn. - No scoring after timeout or turn
completion. - Error deduction is exactly one point, with score floor
zero. - A turn cannot start twice. - A game cannot finish before all
required turns are complete.

## 17. Test scenarios

At minimum, automated tests must cover:

1.  A game cannot start with fewer than two teams.
2.  Round 1 duration is 300 seconds and correct answer adds 1.
3.  Round 2 duration is 720 seconds and correct answer adds 3.
4.  Round 3 duration is 1200 seconds and correct answer adds 5.
5.  Wrong/Skip adds zero.
6.  Error subtracts one but never makes score negative.
7.  A prompt cannot be scored twice.
8.  Actions are rejected after timeout.
9.  Remaining time is derived correctly from deadline timestamps.
10. Timer continues correctly after simulated background/foreground
    transitions.
11. Round 1 rejects proverbs.
12. Each prompt slot has identical type and difficulty across all teams.
13. Prompt planner fails clearly when the bank cannot satisfy the plan.
14. Team order is preserved across rounds.
15. Ties are displayed correctly.
16. Game state can be restored after refresh.

## 18. Definition of done

The MVP is complete when: - All screens and flows above are
implemented. - Game rules and scoring match this document. - Fair prompt
planning works and is tested. - Persian RTL UI is polished and usable on
iPhone-sized screens. - State survives refresh/reopen. - PWA can be
deployed to HTTPS and added to an iPhone Home Screen. - Tests,
type-check, lint, and production build pass. - README contains exact
local setup and iPhone usage instructions.
