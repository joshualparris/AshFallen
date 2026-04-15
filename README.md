# ASHFALLER: The Veil Between

A Stage 1 vertical slice of a text-led sci-fantasy extraction RPG set beneath Dubbo, NSW. You begin in the Ashfall Archive, cross the Threshold Gate, and push into one unstable zone of the Red Waste to recover relics before the Veil, your wounds, or your failing lantern end the run.

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand persistence via `localStorage`
- Framer Motion for subtle UI feedback

## Run

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Publish to a website

This app is a static Vite build and can be hosted on Netlify, Vercel, or any static web host.

### Netlify

1. Sign in to Netlify and create a new site.
2. Connect the project repo or drag-and-drop the `dist/` folder.
3. Set the build command to `npm run build` and the publish directory to `dist`.
4. The included `netlify.toml` file will handle the build settings.

### Vercel

1. Sign in to Vercel and import the project.
2. Vercel will detect the static site.
3. If prompted, set the build command to `npm run build` and the output directory to `dist`.
4. The included `vercel.json` file provides SPA routing.

### ChatGPT testing note

Once your site is live, share the public URL with the ChatGPT browsing/assistant setup you want to use. A public URL lets an agent load the game, simulate clicks, and give feedback based on the running app.

### Local deploy preview

```bash
npm install
npm run build
npm run preview
```

## What to test

- Start in the Ashfall Archive and move through the Threshold Gate into the Red Waste.
- Use different action mixes: `travel`, `search`, `listen`, `study`, `rest`, and `extract`.
- Confirm XP ticks up frequently and that level-ups refill part of your resources.
- Recover enough items to fill the 6-slot inventory and verify pickup denial when full.
- Extract successfully and confirm relics move into the recovered archive.
- Fail runs by draining Vitality, draining Lantern Charge, or triggering a Veil loss.
- Refresh the browser and confirm state persists, including current scene, stats, log, inventory, and archive progress.

## Stage 2 recommendations

- Add relic rarity presentation as collectible cards with attunement progress and passive bonuses.
- Introduce stronger extraction pressure through escalating instability and scene-specific consequence flags.
- Add a second destination code and a lightweight codex layer for discovered Names, factions, and recovered histories.
- Expand the Veil system so `listen` and `study` can reveal alternate outcomes, temptations, and hidden scene variants.

## Changelog (tension and replayability pass)

- Added and surfaced a persistent `Veil Pressure` run clock that rises across expedition decisions and feeds extraction danger calculations.
- Hardened anti-farming by enforcing per-run choice depletion and repeat penalties on safe archive/rest/extraction actions.
- Extended item interactions with clickable consumables in-run, passive effect hooks in action resolution, and clear type badges.
- Added run consequences with per-run flags that gate options and alter extraction risk (for example obelisk disturbance and Veil attention).
- Added a dedicated run-end panel flow before returning to the Archive so outcomes, XP gain, recoveries, and objective completions are explicit.
- Expanded and rotated Archive contracts/objectives to keep each run purposeful, with XP payouts tracked on successful returns.
- Improved event readability with auto-scrolling logs, event-type icons, clearer disabled-choice reasons, and toast feedback hooks.
- Added accessibility controls for larger type and optional dyslexic-friendly font stack toggle.

## Changelog (playtest follow-up)

- **Comfort XP cap:** Only the first Archive ledger, brazier rest, or gate “Recenter” per run awards XP; further comfort actions yield narrative only (no XP) and the ledger is limited to one read per run.
- **Pressure tiers:** At 25%+ / 50%+ / 75%+ Veil Pressure, search/study can suffer random strain, extraction failure chance increases, and at 75%+ there is a small chance per action of an immediate Veil breach.
- **Consumables:** `Veil Salt` lowers pressure by 10; `Ashwater Flask` restores vitality and a little focus; consumables can be used in the Archive or in the field; non-consumables show a clear message if clicked.
- **Run summary:** End-of-run panel shows result label, XP gained, pack contents, pressure and stats at resolution, and completed contracts.
- **Contracts:** Archive hub shows a compact contract board above scene choices when you are at home.
- **Log:** Chronicle panel uses a dedicated scroll region; auto-scroll follows new entries unless you scroll away from the bottom.
- **Requirements:** Action cards show required items by name (e.g. Brass Locator); disabled buttons expose the reason via tooltip and on-card text.
- **Balance:** Vitality and focus costs increased on travel, search, study, and extraction; rest actions restore less.

## Manual test checklist

- [ ] Start a run, take 4-6 actions, and confirm `Veil Pressure` rises and stays meaningfully elevated unless reduced by specific effects.
- [ ] Reuse safe actions (`archive_review_ledger`, `threshold_recenter`, shelter actions) and verify reduced rewards or depletion messaging appears.
- [ ] Obtain and use a consumable item during expedition; verify stat/pressure effect applies and the item is removed from inventory.
- [ ] Carry passive items (e.g., `brass_locator`, `whisper_thread`) and verify they modify search/listen outcomes and risk profile.
- [ ] Trigger a branching flag path (e.g., disturb obelisk), then extract and verify return risk feels higher and logs reflect consequence.
- [ ] Complete both a successful extraction and a failed run; verify the run-end panel appears with cause, XP gain, relic results, and discoveries.
- [ ] Return to Archive and confirm objectives/contracts update and rotate over cycles while still rewarding completed goals.
- [ ] Confirm Recent Events auto-scrolls to newest entries and displays event-type icons/tags clearly.
- [ ] Check disabled choices for explicit reasons (insufficient stats, full inventory, missing flags/items, depleted choice).
- [ ] Refresh the page and verify persistence still holds key progression/state data.
- [ ] Confirm only the first comfort action (ledger, brazier, recenter) grants XP before the gate; repeat attempts show the “no fresh insight” line and no XP.
- [ ] At high pressure, observe search/study strain messages, extraction tension text, and possible breach at 75%+.
- [ ] Use Veil Salt and Ashwater from inventory in the Archive or expedition and verify stat/pressure changes.
