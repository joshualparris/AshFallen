Original prompt: Improve Ashfaller tension/replayability by adding Veil Pressure pressure-clock behavior, anti-farming choice limits, item mechanics (consumable/passive/relic), branching run flags, run-end summary panel, rotating contracts/objectives, stronger log feedback and disabled-state clarity, inventory item interactions, stat rebalancing, and accessibility/polish updates without rewriting the app.

## 2026-04-15
- Reviewed `src/store.ts`, `src/gameData.ts`, and `src/App.tsx`; core systems are already mostly implemented.
- Next: close remaining UX and loop gaps (log scroll target, event icons/toasts clarity, objective rotation cadence), then validate build/lints and update README deliverables.
- Fixed `broken_obelisk` relic-pry flagging placement so `disturbed_obelisk` is set via outcomes.
- Added `RunEndPanel` component, log iconography, auto-scroll container wiring, veil pressure stat bar, rarity/item-type visual cues, and dyslexic font toggle in `App.tsx`.
- Added Archive objective rotation pass in `settleRun` so contracts refresh on archive return.
- Appended README changelog and manual test checklist deliverables.
- Validation: `npm run build` passes and lint diagnostics are clean.
- Runtime test attempt: started Vite dev server successfully, then attempted the Playwright client script but local `playwright` package is not installed (`ERR_MODULE_NOT_FOUND`), so scripted gameplay automation could not run in this environment without adding a dependency.

## 2026-04-15 (playtest follow-up)
- Implemented comfort XP cap (first ledger/brazier/recenter only), pressure tiers (25/50/75) with hazards and extraction modifiers, run-end snapshots, hub contract strip, log scroll pinning, requirement hints with item names, consumable use in hub, veil salt −10, rebalanced `gameData` costs, `type` field on items.
