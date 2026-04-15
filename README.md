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
