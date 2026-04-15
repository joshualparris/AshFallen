import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import { SCENES, ITEM_DEFS, type Choice, type ItemRarity, type LogType } from './gameData'
import { totalXpRequiredForLevel, useGameStore } from './store'

const statAccent: Record<'vitality' | 'focus' | 'lantern', string> = {
  vitality: 'from-red-500/75 to-red-300/50',
  focus: 'from-cyan-400/80 to-sky-200/50',
  lantern: 'from-amber-400/90 to-yellow-200/60',
}

const rarityClasses: Record<ItemRarity, string> = {
  common: 'text-stone-200',
  uncommon: 'text-emerald-300',
  rare: 'text-sky-300',
  mythic: 'text-amber-200 drop-shadow-[0_0_10px_rgba(245,158,11,0.45)]',
}

const logClasses: Record<LogType, string> = {
  narrative: 'border-stone-500/30 bg-stone-950/60 text-stone-100',
  action: 'border-cyan-500/25 bg-cyan-950/20 text-cyan-100',
  reward: 'border-amber-500/35 bg-amber-950/20 text-amber-100',
  danger: 'border-red-500/35 bg-red-950/20 text-red-100',
  system: 'border-stone-400/20 bg-stone-900/60 text-stone-300',
}

function App() {
  const {
    level,
    xp,
    vitality,
    maxVitality,
    focus,
    maxFocus,
    lantern,
    maxLantern,
    currentSceneId,
    inventory,
    archiveRelics,
    discoveredScenes,
    runFlags,
    log,
    turn,
    runStatus,
    veilPressure,
    completedRuns,
    lastLevelUpAt,
    performChoice,
    settleRun,
    resetGame,
  } = useGameStore()

  const scene = SCENES[currentSceneId]
  const reversedLog = useMemo(() => [...log].reverse(), [log])
  const previousThreshold = totalXpRequiredForLevel(level)
  const nextThreshold = totalXpRequiredForLevel(level + 1)
  const progress = Math.max(0, Math.min(100, ((xp - previousThreshold) / (nextThreshold - previousThreshold)) * 100))

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.14),_transparent_30%),radial-gradient(circle_at_20%_20%,_rgba(239,68,68,0.12),_transparent_25%),linear-gradient(180deg,_#1b1410_0%,_#09090b_52%,_#050506_100%)] text-stone-100">
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,255,255,0.035)_50%,transparent_100%)] bg-[length:100%_6px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_35%,rgba(0,0,0,0.45)_100%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-amber-500/20 bg-stone-950/70 px-5 py-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-amber-200/70">Ashfall Archive // Dubbo Red Earth</p>
            <h1 className="mt-2 font-serif text-4xl tracking-wide text-stone-50 sm:text-5xl">ASHFALLER: The Veil Between</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300 sm:text-base">
              A lone Ashfaller moves through dust, old glyphs, and failing light, stepping from the buried gate beneath Dubbo
              into a fractured waste where relics, Names, and ruin wait beneath the Veil.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <SummaryTile label="Run State" value={runStatusLabel(runStatus)} />
            <SummaryTile label="Turns" value={`${turn}`} />
            <SummaryTile label="Veil Pressure" value={`${veilPressure}%`} />
            <SummaryTile label="Recovered" value={`${archiveRelics.length}`} />
            <SummaryTile label="Runs" value={`${completedRuns}`} />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={resetGame}
              className="rounded-2xl border border-red-400/25 bg-red-950/25 px-4 py-3 text-left text-sm text-red-100 transition hover:border-red-300/45 hover:bg-red-900/30"
            >
              <div className="text-xs uppercase tracking-[0.25em] text-red-200/70">Protocol</div>
              <div className="mt-1 font-medium">Reset Chronicle</div>
            </button>
          </div>
        </header>

        <div className="grid flex-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
          <main className="flex min-h-[70vh] flex-col gap-6">
            {runStatus === 'success' || runStatus === 'failed' ? (
              <section className="ornate-panel p-5 sm:p-6 sticky top-24 z-10 bg-stone-950/95 backdrop-blur">
                <div className="flex flex-col gap-3 border-b border-amber-500/15 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">{runStatus === 'success' ? 'Return Sequence' : 'Failed Extraction'}</p>
                    <h2 className="mt-2 font-serif text-3xl text-stone-50">{runStatus === 'success' ? 'Extraction Complete' : 'Veil Breach'}</h2>
                  </div>
                </div>

                <p className="mt-5 max-w-4xl text-base leading-7 text-stone-200/95">
                  {runStatus === 'success'
                    ? 'The gate accepted your pulse. Salvage is safe in the archive and the return is written into the bunker ledger.'
                    : 'The return snapped under pressure. The Archive holds your memory of the route, but not the relics this time.'}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-stone-700/60 bg-stone-950/60 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Run Result</p>
                    <p className="mt-3 text-lg text-stone-100">{runStatusLabel(runStatus)}</p>
                  </div>
                  <div className="rounded-3xl border border-stone-700/60 bg-stone-950/60 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Pressure at Return</p>
                    <p className="mt-3 text-lg text-stone-100">{veilPressure}%</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={settleRun}
                  className="mt-6 inline-flex items-center justify-center rounded-3xl border border-amber-500/30 bg-amber-500/10 px-6 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20"
                >
                  Return to Archive
                </button>
              </section>
            ) : (
              <section className="ornate-panel p-5 sm:p-6 sticky top-20 z-10 bg-stone-950/95 backdrop-blur">
                <div className="flex flex-col gap-3 border-b border-amber-500/15 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">{scene.region}</p>
                    <h2 className="mt-2 font-serif text-3xl text-stone-50">{scene.title}</h2>
                  </div>
                  <div className="rounded-full border border-cyan-400/15 bg-cyan-950/30 px-4 py-2 text-xs uppercase tracking-[0.25em] text-cyan-100/80">
                    {scene.mood}
                  </div>
                </div>

                <p className="mt-5 max-w-4xl text-base leading-7 text-stone-200/95">{scene.description}</p>
                <p className="mt-4 border-l border-amber-500/30 pl-4 text-sm italic leading-6 text-amber-100/75">{scene.flavour}</p>

                <div className="mt-6 grid gap-3 lg:grid-cols-2">
                  {scene.choices.map((choice) => (
                    <ChoiceCard
                      key={choice.id}
                      choice={choice}
                      disabled={!canUseChoice(choice, focus, lantern, inventory.length, inventory, runFlags)}
                      onSelect={() => performChoice(choice.id)}
                    />
                  ))}
                </div>
              </section>
            )}

          </main>

          <aside className="flex flex-col gap-6">
            <section className="ornate-panel sticky top-24 z-10 max-h-[60vh] overflow-y-auto p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4 border-b border-amber-500/15 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">Chronicle</p>
                  <h3 className="mt-1 font-serif text-2xl text-stone-50">Recent Events</h3>
                </div>
                <div className="text-xs uppercase tracking-[0.25em] text-stone-400">Newest first</div>
              </div>

              <div className="mt-5 space-y-3">
                <AnimatePresence initial={false}>
                  {reversedLog.map((entry, index) => (
                    <motion.article
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, y: 14, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                      className={`rounded-2xl border px-4 py-3 ${logClasses[entry.type]} ${
                        index === 0 ? 'shadow-[0_0_35px_rgba(34,211,238,0.09)] ring-1 ring-amber-300/20' : ''
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.24em] text-stone-400">
                        <span>{entry.type}</span>
                        <span>Turn {entry.turn}</span>
                      </div>
                      <p className="text-sm leading-6 sm:text-[15px]">{entry.text}</p>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
            </section>

          <motion.section
              animate={lastLevelUpAt > 0 ? { boxShadow: ['0 0 0 rgba(251,191,36,0)', '0 0 35px rgba(251,191,36,0.28)', '0 0 0 rgba(251,191,36,0)'] } : {}}
              transition={{ duration: 1.1 }}
              className="ornate-panel p-5"
            >
              <div className="border-b border-amber-500/15 pb-4">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">Field State</p>
                <h3 className="mt-1 font-serif text-2xl text-stone-50">Ashfaller Profile</h3>
              </div>

              <div className="mt-5 space-y-4">
                <StatBar label="Vitality" value={vitality} max={maxVitality} accent={statAccent.vitality} />
                <StatBar label="Focus" value={focus} max={maxFocus} accent={statAccent.focus} />
                <StatBar label="Lantern Charge" value={lantern} max={maxLantern} accent={statAccent.lantern} />
              </div>

              <div className="mt-6 rounded-3xl border border-cyan-400/15 bg-stone-950/70 p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Level</p>
                    <div className="mt-1 text-3xl font-semibold text-stone-50">{level}</div>
                  </div>
                  <motion.div
                    key={xp}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-right"
                  >
                    <p className="text-xs uppercase tracking-[0.24em] text-stone-400">XP</p>
                    <div className="text-lg font-medium text-amber-100">{xp}</div>
                  </motion.div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-800">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-200 to-cyan-300"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                  />
                </div>
                <p className="mt-2 text-xs text-stone-400">
                  {nextThreshold - xp} XP until level {level + 1}
                </p>
              </div>
            </motion.section>

            <section className="ornate-panel p-5">
              <div className="border-b border-amber-500/15 pb-4">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">Carry Load</p>
                <h3 className="mt-1 font-serif text-2xl text-stone-50">Inventory</h3>
              </div>
              <div className="mt-5 space-y-3">
                {inventory.length === 0 ? (
                  <EmptyState text="Your satchel is empty. The next good run starts with nerve, not weight." />
                ) : (
                  inventory.map((itemId, index) => {
                    const item = ITEM_DEFS[itemId]
                    return (
                      <div key={`${itemId}-${index}`} className="rounded-2xl border border-stone-700/70 bg-stone-950/65 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className={`font-medium ${rarityClasses[item.rarity]}`}>{item.name}</h4>
                            <p className="mt-1 text-sm text-stone-300">{item.description}</p>
                          </div>
                          <span className={`text-xs uppercase tracking-[0.22em] ${rarityClasses[item.rarity]}`}>{item.rarity}</span>
                        </div>
                        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-stone-500">{item.effect}</p>
                      </div>
                    )
                  })
                )}
              </div>
              <p className="mt-4 text-xs uppercase tracking-[0.22em] text-stone-500">{inventory.length} / 6 slots used</p>
            </section>

            <section className="ornate-panel p-5">
              <div className="border-b border-amber-500/15 pb-4">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">Archive</p>
                <h3 className="mt-1 font-serif text-2xl text-stone-50">Recovered Record</h3>
              </div>
              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Recovered Relics</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {archiveRelics.length === 0 ? (
                      <EmptyState text="Nothing stable has been brought home yet." compact />
                    ) : (
                      archiveRelics.map((itemId) => {
                        const item = ITEM_DEFS[itemId]
                        return (
                          <span
                            key={itemId}
                            className={`rounded-full border border-stone-700/60 bg-stone-950/60 px-3 py-2 text-xs uppercase tracking-[0.18em] ${rarityClasses[item.rarity]}`}
                          >
                            {item.name}
                          </span>
                        )
                      })
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Discovered Zones</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {discoveredScenes.map((sceneId) => (
                      <span
                        key={sceneId}
                        className="rounded-full border border-cyan-500/20 bg-cyan-950/25 px-3 py-2 text-xs uppercase tracking-[0.18em] text-cyan-100"
                      >
                        {SCENES[sceneId].title}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-700/70 bg-stone-900/55 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.24em] text-stone-400">{label}</div>
      <div className="mt-1 text-lg font-medium text-stone-100">{value}</div>
    </div>
  )
}

function StatBar({
  label,
  value,
  max,
  accent,
}: {
  label: string
  value: number
  max: number
  accent: string
}) {
  const width = Math.max(0, Math.min(100, (value / max) * 100))

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="text-stone-200">{label}</span>
        <span className="font-medium text-stone-50">
          {value} / {max}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-stone-800">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${accent}`}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

function ChoiceCard({
  choice,
  disabled,
  onSelect,
}: {
  choice: Choice
  disabled: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className="group rounded-[1.5rem] border border-amber-500/15 bg-[linear-gradient(180deg,rgba(41,37,36,0.92),rgba(12,10,9,0.96))] p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-300/35 hover:shadow-[0_12px_30px_rgba(245,158,11,0.08)] disabled:cursor-not-allowed disabled:border-stone-700/60 disabled:bg-stone-900/65 disabled:opacity-55"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">{choice.intent}</div>
          <div className="mt-2 font-serif text-2xl text-stone-50">{choice.label}</div>
        </div>
        <div className="rounded-full border border-stone-600/60 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-stone-400">
          {formatCosts(choice)}
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-300">{choice.description}</p>
      {choice.requires && (
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-amber-100/70">
          Requires
          {choice.requires.minFocus ? ` focus ${choice.requires.minFocus}` : ''}
          {choice.requires.minLantern ? ` lantern ${choice.requires.minLantern}` : ''}
          {choice.requires.openInventorySlot ? ' one free slot' : ''}
        </p>
      )}
    </button>
  )
}

function EmptyState({ text, compact = false }: { text: string; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-dashed border-stone-700/70 bg-stone-950/40 text-stone-400 ${compact ? 'px-3 py-2 text-xs' : 'px-4 py-5 text-sm'}`}>
      {text}
    </div>
  )
}

function canUseChoice(choice: Choice, focus: number, lantern: number, inventoryCount: number, inventory: string[], runFlags: string[]) {
  if (!choice.requires) return true
  if (choice.requires.minFocus && focus < choice.requires.minFocus) return false
  if (choice.requires.minLantern && lantern < choice.requires.minLantern) return false
  if (choice.requires.openInventorySlot && inventoryCount >= 6) return false
  if (choice.requires.requiredItemIds && !choice.requires.requiredItemIds.every((itemId) => inventory.includes(itemId))) return false
  if (choice.requires.requiresFlags && !choice.requires.requiresFlags.every((flag) => runFlags.includes(flag))) return false
  if (choice.requires.forbiddenFlags && choice.requires.forbiddenFlags.some((flag) => runFlags.includes(flag))) return false
  return true
}

function formatCosts(choice: Choice) {
  const parts: string[] = []
  if (choice.cost?.vitality) parts.push(`V ${choice.cost.vitality}`)
  if (choice.cost?.focus) parts.push(`F ${choice.cost.focus}`)
  if (choice.cost?.lantern) parts.push(`L ${choice.cost.lantern}`)
  return parts.length > 0 ? parts.join(' / ') : 'steady'
}

function runStatusLabel(runStatus: string) {
  switch (runStatus) {
    case 'hub':
      return 'Archive'
    case 'expedition':
      return 'Expedition'
    case 'success':
      return 'Recovered'
    case 'failed':
      return 'Broken Return'
    default:
      return runStatus
  }
}

export default App
