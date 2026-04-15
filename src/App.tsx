import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { SCENES, ITEM_DEFS, type Choice, type ItemRarity, type LogType } from './gameData'
import { getPressureTier, totalXpRequiredForLevel, useGameStore, type RunEndSnapshot } from './store'

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

const rarityBorders: Record<ItemRarity, string> = {
  common: 'border-stone-700/70',
  uncommon: 'border-emerald-500/35',
  rare: 'border-sky-500/40',
  mythic: 'border-amber-400/45',
}

const logClasses: Record<LogType, string> = {
  narrative: 'border-stone-500/30 bg-stone-950/60 text-stone-100',
  action: 'border-cyan-500/25 bg-cyan-950/20 text-cyan-100',
  reward: 'border-amber-500/35 bg-amber-950/20 text-amber-100',
  danger: 'border-red-500/35 bg-red-950/20 text-red-100',
  system: 'border-stone-400/20 bg-stone-900/60 text-stone-300',
}

const logIcons: Record<LogType, string> = {
  narrative: '✦',
  action: '➤',
  reward: '+',
  danger: '!',
  system: '•',
}

const itemTypeIcons: Record<'relic' | 'consumable' | 'passive', string> = {
  relic: '◇',
  consumable: '◉',
  passive: '◌',
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
    choiceUseCounts,
    runResultCause,
    runResultNewObjectives,
    runEndSnapshot,
    objectives,
    log,
    turn,
    runStatus,
    veilPressure,
    completedRuns,
    runStartXp,
    runStartArchiveCount,
    runStartDiscoveredCount,
    lastLevelUpAt,
    performChoice,
    useItem,
    settleRun,
    resetGame,
  } = useGameStore()

  const scene = SCENES[currentSceneId]
  const previousThreshold = totalXpRequiredForLevel(level)
  const nextThreshold = totalXpRequiredForLevel(level + 1)
  const progress = Math.max(0, Math.min(100, ((xp - previousThreshold) / (nextThreshold - previousThreshold)) * 100))
  const [fontScale, setFontScale] = useState(1)
  const [dyslexicFont, setDyslexicFont] = useState(false)
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'reward' | 'danger' | 'system' }>>([])
  const logContainerRef = useRef<HTMLDivElement | null>(null)
  const logPinnedToBottomRef = useRef(true)

  const runXpGain = Math.max(0, xp - runStartXp)
  const recoveredThisRun = Math.max(0, archiveRelics.length - runStartArchiveCount)
  const discoveredThisRun = Math.max(0, discoveredScenes.length - runStartDiscoveredCount)
  const fontSize = `${Math.max(0.9, Math.min(1.25, fontScale))}rem`

  useEffect(() => {
    const el = logContainerRef.current
    if (!el) return
    if (!logPinnedToBottomRef.current) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [log])

  const onLogScroll = () => {
    const el = logContainerRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48
    logPinnedToBottomRef.current = nearBottom
  }

  useEffect(() => {
    if (log.length === 0) return
    const lastEntry = log[log.length - 1]
    const shouldToast =
      lastEntry.type === 'reward' ||
      lastEntry.type === 'danger' ||
      (lastEntry.type === 'system' &&
        (lastEntry.text.includes('XP') ||
          lastEntry.text.includes('Recovered') ||
          lastEntry.text.includes('Veil Pressure') ||
          lastEntry.text.includes('restores') ||
          lastEntry.text.includes('eases')))
    if (shouldToast) {
      const toast: { id: string; message: string; type: 'reward' | 'danger' | 'system' } = {
        id: `${lastEntry.id}-${Date.now()}`,
        message: lastEntry.text,
        type: lastEntry.type === 'danger' ? 'danger' : lastEntry.type === 'reward' ? 'reward' : 'system',
      }
      setToasts((current) => [...current.slice(-2), toast])
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id))
      }, 2800)
    }
  }, [log])

  return (
    <div
      style={{
        fontSize,
        fontFamily: dyslexicFont ? '"OpenDyslexic", "Atkinson Hyperlegible", "Trebuchet MS", sans-serif' : undefined,
      }}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.14),_transparent_30%),radial-gradient(circle_at_20%_20%,_rgba(239,68,68,0.12),_transparent_25%),linear-gradient(180deg,_#1b1410_0%,_#09090b_52%,_#050506_100%)] text-stone-100"
    >
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
            <SummaryTile label="Veil Pressure" value={`${veilPressure}% (${pressureTierLabel(veilPressure)})`} />
            <SummaryTile label="Recovered" value={`${archiveRelics.length}`} />
            <SummaryTile label="Runs" value={`${completedRuns}`} />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFontScale((value) => Math.min(1.25, value + 0.1))}
                className="rounded-2xl border border-cyan-400/20 bg-cyan-950/20 px-4 py-3 text-sm text-cyan-100 transition hover:border-cyan-300/45 hover:bg-cyan-900/30"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setFontScale((value) => Math.max(0.9, value - 0.1))}
                className="rounded-2xl border border-cyan-400/20 bg-cyan-950/20 px-4 py-3 text-sm text-cyan-100 transition hover:border-cyan-300/45 hover:bg-cyan-900/30"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setDyslexicFont((value) => !value)}
                className={`rounded-2xl border px-4 py-3 text-sm transition ${
                  dyslexicFont
                    ? 'border-amber-300/50 bg-amber-500/20 text-amber-100'
                    : 'border-cyan-400/20 bg-cyan-950/20 text-cyan-100 hover:border-cyan-300/45 hover:bg-cyan-900/30'
                }`}
              >
                Dyslexic Font
              </button>
            </div>
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
              <RunSummary
                runStatus={runStatus}
                runResultCause={runResultCause}
                snapshot={runEndSnapshot}
                runXpGain={runXpGain}
                recoveredThisRun={recoveredThisRun}
                discoveredThisRun={discoveredThisRun}
                runResultNewObjectives={runResultNewObjectives}
                onReturnToArchive={settleRun}
              />
            ) : (
              <section className="ornate-panel p-5 sm:p-6 sticky top-20 z-10 bg-stone-950/95 backdrop-blur">
                {currentSceneId === 'ashfall_archive' && runStatus === 'hub' && (
                  <div className="mb-6 rounded-3xl border border-amber-500/25 bg-stone-950/80 p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-amber-200/80">Contract Board</p>
                    <p className="mt-2 text-sm text-stone-300">Up to three active objectives. Rewards apply on successful extraction.</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {objectives.map((objective) => (
                        <div
                          key={objective.id}
                          className={`rounded-2xl border px-3 py-3 text-sm ${objective.completed ? 'border-emerald-500/40 bg-emerald-950/25' : 'border-stone-700/60 bg-stone-900/50'}`}
                        >
                          <p className="font-medium text-stone-100">{objective.label}</p>
                          <p className="mt-1 text-xs text-stone-500">+{objective.rewardXp} XP</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                  {scene.choices.map((choice) => {
                    const availability = getChoiceAvailability(choice, focus, lantern, inventory.length, inventory, runFlags, choiceUseCounts)
                    return (
                      <ChoiceCard
                        key={choice.id}
                        choice={choice}
                        disabled={availability.disabled}
                        disabledReason={availability.reason}
                        requirementHint={formatRequirementHint(choice)}
                        onSelect={() => performChoice(choice.id)}
                      />
                    )
                  })}
                </div>
              </section>
            )}

          </main>

          <aside className="flex flex-col gap-6">
            <section className="ornate-panel sticky top-24 z-10 flex max-h-[min(70vh,560px)] flex-col p-5 sm:p-6">
              <div className="flex shrink-0 items-center justify-between gap-4 border-b border-amber-500/15 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">Chronicle</p>
                  <h3 className="mt-1 font-serif text-2xl text-stone-50">Recent Events</h3>
                </div>
                <div className="text-xs uppercase tracking-[0.25em] text-stone-400">Auto-scrolls to latest</div>
              </div>

              <div
                ref={logContainerRef}
                onScroll={onLogScroll}
                className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1"
              >
                <AnimatePresence initial={false}>
                  {log.map((entry, index) => (
                    <motion.article
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, y: 14, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                      className={`rounded-2xl border px-4 py-3 ${logClasses[entry.type]} ${
                        index === log.length - 1 ? 'shadow-[0_0_35px_rgba(34,211,238,0.09)] ring-1 ring-amber-300/20' : ''
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.24em] text-stone-400">
                        <span>
                          {logIcons[entry.type]} {entry.type}
                        </span>
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
                <StatBar label="Veil Pressure" value={veilPressure} max={100} accent="from-fuchsia-500/90 to-rose-300/60" />
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
                    const canUse = item.itemType === 'consumable' && (runStatus === 'expedition' || runStatus === 'hub')
                    return (
                      <div key={`${itemId}-${index}`} className={`rounded-2xl border bg-stone-950/65 p-4 ${rarityBorders[item.rarity]}`}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h4 className={`font-medium ${rarityClasses[item.rarity]}`}>{item.name}</h4>
                            <p className="mt-1 text-sm text-stone-300">{item.description}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-stone-600/50 bg-stone-900/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-stone-300">
                              {itemTypeIcons[item.itemType]} {item.itemType}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${rarityClasses[item.rarity]}`}>{item.rarity}</span>
                          </div>
                        </div>
                        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-stone-500">{item.effect}</p>
                        {canUse && (
                          <button
                            type="button"
                            onClick={() => useItem(itemId)}
                            className="mt-4 inline-flex items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/15"
                          >
                            Use
                          </button>
                        )}
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

            <section className="ornate-panel p-5">
              <div className="border-b border-amber-500/15 pb-4">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">Contract Board</p>
                <h3 className="mt-1 font-serif text-2xl text-stone-50">Active Objectives</h3>
              </div>
              <div className="mt-5 space-y-3">
                {objectives.map((objective) => (
                  <div
                    key={objective.id}
                    className={`rounded-2xl border px-4 py-4 ${objective.completed ? 'border-emerald-500/40 bg-emerald-950/30' : 'border-stone-700/60 bg-stone-950/60'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-medium text-stone-100">{objective.label}</h4>
                        <p className="mt-1 text-xs text-stone-400">{objective.detail}</p>
                      </div>
                      <span className={`text-xs uppercase tracking-[0.18em] ${objective.completed ? 'text-emerald-300' : 'text-stone-400'}`}>
                        {objective.completed ? 'Complete' : `${Math.min(100, Math.round((objective.progress / objective.target) * 100))}%`}
                      </span>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-stone-500">Reward: +{objective.rewardXp} XP</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className={`rounded-2xl border px-4 py-3 text-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)] ${
                toast.type === 'reward'
                  ? 'border-emerald-500/40 bg-emerald-950/85 text-emerald-100'
                  : toast.type === 'danger'
                    ? 'border-red-500/45 bg-red-950/85 text-red-100'
                    : 'border-cyan-500/40 bg-cyan-950/85 text-cyan-100'
              }`}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
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

function RunSummary({
  runStatus,
  runResultCause,
  snapshot,
  runXpGain,
  recoveredThisRun,
  discoveredThisRun,
  runResultNewObjectives,
  onReturnToArchive,
}: {
  runStatus: 'success' | 'failed'
  runResultCause: string
  snapshot: RunEndSnapshot | null
  runXpGain: number
  recoveredThisRun: number
  discoveredThisRun: number
  runResultNewObjectives: string[]
  onReturnToArchive: () => void
}) {
  const xp = snapshot?.xpGain ?? runXpGain
  const pressure = snapshot?.pressure
  const items = snapshot?.itemIds ?? []
  const vit = snapshot?.vitality
  const foc = snapshot?.focus
  const lan = snapshot?.lantern
  const label = snapshot?.resultLabel ?? (runStatus === 'success' ? 'Safe Extraction' : 'Broken Return')
  const objectivesDone = snapshot?.objectivesDone ?? runResultNewObjectives

  return (
    <section className="ornate-panel sticky top-24 z-10 bg-stone-950/95 p-5 backdrop-blur sm:p-6">
      <div className="flex flex-col gap-3 border-b border-amber-500/15 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">{runStatus === 'success' ? 'Return Sequence' : 'Failed Extraction'}</p>
          <h2 className="mt-2 font-serif text-3xl text-stone-50">{label}</h2>
        </div>
      </div>

      <p className="mt-5 max-w-4xl text-base leading-7 text-stone-200/95">
        {runStatus === 'success'
          ? 'The gate accepted your pulse. Salvage is safe in the archive and the return is written into the bunker ledger.'
          : 'The return snapped under pressure. The Archive holds your memory of the route, but not the relics this time.'}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-stone-700/60 bg-stone-950/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Outcome</p>
          <p className="mt-3 text-sm leading-6 text-stone-200">Cause: {runResultCause || (runStatus === 'success' ? 'Extraction complete.' : 'Veil collapse')}</p>
          <p className="mt-2 text-sm leading-6 text-stone-200">XP gained this run: {xp}</p>
          {pressure !== undefined && <p className="mt-2 text-sm leading-6 text-stone-200">Veil Pressure at end: {pressure}%</p>}
          {vit !== undefined && foc !== undefined && lan !== undefined && (
            <p className="mt-2 text-sm leading-6 text-stone-200">
              Stats at end: Vitality {vit} · Focus {foc} · Lantern {lan}
            </p>
          )}
        </div>
        <div className="rounded-3xl border border-stone-700/60 bg-stone-950/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Salvage &amp; discovery</p>
          <p className="mt-3 text-sm leading-6 text-stone-200">
            Items in pack: {items.length > 0 ? items.map((id) => ITEM_DEFS[id]?.name ?? id).join(', ') : '—'}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-200">Relics recovered to archive (run): {recoveredThisRun}</p>
          <p className="mt-2 text-sm leading-6 text-stone-200">New zone discoveries (run): {discoveredThisRun}</p>
        </div>
      </div>

      {objectivesDone.length > 0 && (
        <p className="mt-4 text-sm leading-6 text-emerald-300">Contracts completed: {objectivesDone.join(', ')}</p>
      )}

      <button
        type="button"
        onClick={onReturnToArchive}
        className="mt-6 inline-flex items-center justify-center rounded-3xl border border-amber-500/30 bg-amber-500/10 px-6 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20"
      >
        Return to Archive
      </button>
    </section>
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
  disabledReason,
  requirementHint,
  onSelect,
}: {
  choice: Choice
  disabled: boolean
  disabledReason?: string
  requirementHint: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={disabled ? disabledReason : undefined}
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
      {requirementHint && (
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-amber-100/80">{requirementHint}</p>
      )}
      {disabled && disabledReason && (
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-stone-400">{disabledReason}</p>
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

function pressureTierLabel(pressure: number) {
  const tier = getPressureTier(pressure)
  if (tier === 0) return 'calm'
  if (tier === 1) return 'tense'
  if (tier === 2) return 'torn'
  return 'critical'
}

function formatRequirementHint(choice: Choice) {
  const r = choice.requires
  if (!r) return ''
  const bits: string[] = []
  if (r.minFocus) bits.push(`Focus ${r.minFocus}+`)
  if (r.minLantern) bits.push(`Lantern ${r.minLantern}+`)
  if (r.openInventorySlot) bits.push('a free satchel slot')
  if (r.requiredItemIds?.length) {
    bits.push(r.requiredItemIds.map((id) => ITEM_DEFS[id]?.name ?? id).join(' + '))
  }
  if (r.requiresFlags?.length) bits.push('prior run conditions')
  if (r.forbiddenFlags?.length) bits.push('route state blocks this')
  if (bits.length === 0) return ''
  return `Requires: ${bits.join(' · ')}`
}

function getChoiceAvailability(
  choice: Choice,
  focus: number,
  lantern: number,
  inventoryCount: number,
  inventory: string[],
  runFlags: string[],
  choiceUseCounts: Record<string, number>,
) {
  const choiceCount = choiceUseCounts[choice.id] ?? 0
  if (choice.maxUses !== undefined && choiceCount >= choice.maxUses) {
    return { disabled: true, reason: 'Choice depleted this run' }
  }

  if (!choice.requires) return { disabled: false, reason: undefined }
  if (choice.requires.minFocus && focus < choice.requires.minFocus) return { disabled: true, reason: `Requires focus ${choice.requires.minFocus}` }
  if (choice.requires.minLantern && lantern < choice.requires.minLantern) return { disabled: true, reason: `Requires lantern ${choice.requires.minLantern}` }
  if (choice.requires.openInventorySlot && inventoryCount >= 6) return { disabled: true, reason: 'Requires one free slot' }
  if (choice.requires.requiredItemIds && !choice.requires.requiredItemIds.every((itemId) => inventory.includes(itemId))) {
    const missing = choice.requires.requiredItemIds.filter((id) => !inventory.includes(id))
    return { disabled: true, reason: `Missing: ${missing.map((id) => ITEM_DEFS[id]?.name ?? id).join(', ')}` }
  }
  if (choice.requires.requiresFlags && !choice.requires.requiresFlags.every((flag) => runFlags.includes(flag))) return { disabled: true, reason: 'Requires prior run condition' }
  if (choice.requires.forbiddenFlags && choice.requires.forbiddenFlags.some((flag) => runFlags.includes(flag))) return { disabled: true, reason: 'Blocked by current run state' }
  return { disabled: false, reason: undefined }
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
