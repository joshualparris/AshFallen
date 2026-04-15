import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ITEM_DEFS, SCENES, type Choice, type ChoiceOutcome, type LogType, type SceneId } from './gameData'

/** Ledger / brazier / gate recenter: only the first of these per hub visit grants XP; the rest are narrative-only. */
const COMFORT_SAFE_GRIND_IDS = new Set(['archive_review_ledger', 'archive_steady_hands', 'threshold_recenter'])

export function getPressureTier(veilPressure: number): 0 | 1 | 2 | 3 {
  if (veilPressure >= 75) return 3
  if (veilPressure >= 50) return 2
  if (veilPressure >= 25) return 1
  return 0
}

type RunStatus = 'hub' | 'expedition' | 'success' | 'failed'

export interface LogEntry {
  id: string
  text: string
  type: LogType
  turn: number
}

export type ObjectiveType = 'recoverRelics' | 'returnRareRelic' | 'surviveHighPressure' | 'discoverScene' | 'successfulRuns'

export interface ObjectiveStatus {
  id: string
  type: ObjectiveType
  label: string
  detail: string
  target: number
  sceneId?: SceneId
  rewardXp: number
  progress: number
  completed: boolean
}

interface ObjectiveDef {
  id: string
  type: ObjectiveType
  label: string
  detail: string
  target: number
  sceneId?: SceneId
  rewardXp: number
}

const OBJECTIVE_DEFS: ObjectiveDef[] = [
  {
    id: 'recover_2_relics',
    type: 'recoverRelics',
    label: 'Recover two relics',
    detail: 'Return with at least 2 relics in one extraction run.',
    target: 2,
    rewardXp: 18,
  },
  {
    id: 'return_rare_relic',
    type: 'returnRareRelic',
    label: 'Bring back a rare relic',
    detail: 'Extract successfully with a rare or mythic relic in your pack.',
    target: 1,
    rewardXp: 22,
  },
  {
    id: 'survive_high_pressure',
    type: 'surviveHighPressure',
    label: 'Survive the rising Veil',
    detail: 'Extract successfully with Veil Pressure at 60 or higher.',
    target: 60,
    rewardXp: 24,
  },
  {
    id: 'discover_obelisk',
    type: 'discoverScene',
    label: 'Discover the obelisk',
    detail: 'Find the Broken Obelisk during a run.',
    target: 1,
    sceneId: 'broken_obelisk',
    rewardXp: 18,
  },
  {
    id: 'two_extractions',
    type: 'successfulRuns',
    label: 'Two successful extractions',
    detail: 'Complete two extraction runs successfully.',
    target: 2,
    rewardXp: 20,
  },
]

function createObjective(def: ObjectiveDef): ObjectiveStatus {
  return { ...def, progress: 0, completed: false }
}

function generateInitialObjectives() {
  const shuffled = OBJECTIVE_DEFS.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3).map(createObjective)
}

interface GameState {
  level: number
  xp: number
  vitality: number
  maxVitality: number
  focus: number
  maxFocus: number
  lantern: number
  maxLantern: number
  currentSceneId: SceneId
  inventory: string[]
  archiveRelics: string[]
  discoveredScenes: SceneId[]
  runFlags: string[]
  choiceUseCounts: Record<string, number>
  veilPressure: number
  completedRuns: number
  log: LogEntry[]
  turn: number
  runStatus: RunStatus
  runStartXp: number
  runStartArchiveCount: number
  runStartDiscoveredCount: number
  runResultCause: string
  runResultNewObjectives: string[]
  /** Snapshot for run-end UI (success or failure). */
  runEndSnapshot: RunEndSnapshot | null
  /** First comfort safe action this hub visit already granted its XP; further ledger/brazier/recenter yield no XP. */
  runComfortXpConsumed: boolean
  objectives: ObjectiveStatus[]
  lastLevelUpAt: number
  performChoice: (choiceId: string) => void
  useItem: (itemId: string) => void
  settleRun: () => void
  resetGame: () => void
}

const MAX_LOG = 18
const MAX_INVENTORY = 6

export interface RunEndSnapshot {
  resultLabel: string
  xpGain: number
  itemIds: string[]
  pressure: number
  vitality: number
  focus: number
  lantern: number
  objectivesDone: string[]
}

function createInitialState(): Omit<GameState, 'performChoice' | 'useItem' | 'resetGame' | 'settleRun'> {
  return {
    level: 1,
    xp: 0,
    vitality: 24,
    maxVitality: 24,
    focus: 18,
    maxFocus: 18,
    lantern: 22,
    maxLantern: 22,
    currentSceneId: 'ashfall_archive',
    inventory: [],
    archiveRelics: [],
    discoveredScenes: ['ashfall_archive'],
    runFlags: [],
    choiceUseCounts: {},
    veilPressure: 0,
    completedRuns: 0,
    runStartXp: 0,
    runStartArchiveCount: 0,
    runStartDiscoveredCount: 1,
    runResultCause: '',
    runResultNewObjectives: [],
    runEndSnapshot: null,
    runComfortXpConsumed: false,
    objectives: generateInitialObjectives(),
    log: [
      {
        id: crypto.randomUUID(),
        turn: 0,
        type: 'system',
        text: 'Archive systems online. The Threshold Gate hums beneath Dubbo, waiting for a destination and the nerve to step through.',
      },
    ],
    turn: 0,
    runStatus: 'hub',
    lastLevelUpAt: 0,
  }
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      performChoice: (choiceId) => {
        const state = get()
        const scene = SCENES[state.currentSceneId]
        const choice = scene.choices.find((candidate) => candidate.id === choiceId)

        if (!choice) return
        if (state.runStatus === 'success' || state.runStatus === 'failed') return

        if (choice.requires?.minFocus && state.focus < choice.requires.minFocus) {
          set((current) => ({
            log: appendLog(current.log, {
              text: 'Your thoughts are too frayed for that. Recover Focus before pressing deeper into the Veil.',
              type: 'system',
              turn: current.turn,
            }),
          }))
          return
        }

        if (choice.requires?.minLantern && state.lantern < choice.requires.minLantern) {
          set((current) => ({
            log: appendLog(current.log, {
              text: 'The lantern stutters at the threshold. It would be reckless to attempt that without more charge.',
              type: 'system',
              turn: current.turn,
            }),
          }))
          return
        }

        if (choice.requires?.openInventorySlot && state.inventory.length >= MAX_INVENTORY) {
          set((current) => ({
            log: appendLog(current.log, {
              text: 'Your satchel is already full. Extract or lose something before trying to carry more.',
              type: 'system',
              turn: current.turn,
            }),
          }))
          return
        }

        if (choice.requires?.requiredItemIds && !choice.requires.requiredItemIds.every((itemId) => state.inventory.includes(itemId))) {
          set((current) => ({
            log: appendLog(current.log, {
              text: 'You do not yet have the item required to attempt that path.',
              type: 'system',
              turn: current.turn,
            }),
          }))
          return
        }

        if (choice.requires?.requiresFlags && !choice.requires.requiresFlags.every((flag) => state.runFlags.includes(flag))) {
          set((current) => ({
            log: appendLog(current.log, {
              text: 'The world does not yet permit that move. Something more must be set in the run first.',
              type: 'system',
              turn: current.turn,
            }),
          }))
          return
        }

        if (choice.requires?.forbiddenFlags && choice.requires.forbiddenFlags.some((flag) => state.runFlags.includes(flag))) {
          set((current) => ({
            log: appendLog(current.log, {
              text: 'This option no longer feels available in the current state of the run.',
              type: 'system',
              turn: current.turn,
            }),
          }))
          return
        }

        const choiceCount = state.choiceUseCounts[choice.id] ?? 0
        if (choice.maxUses !== undefined && choiceCount >= choice.maxUses) {
          set((current) => ({
            log: appendLog(current.log, {
              text: 'That route has been exhausted for this run. Press forward or return before the Veil tightens.',
              type: 'system',
              turn: current.turn,
            }),
          }))
          return
        }

        const nextTurn = state.turn + 1
        let vitality = clamp(state.vitality + (choice.cost?.vitality ?? 0), 0, state.maxVitality)
        let focus = clamp(state.focus + (choice.cost?.focus ?? 0), 0, state.maxFocus)
        let lantern = clamp(state.lantern + (choice.cost?.lantern ?? 0), 0, state.maxLantern)
        let xp = state.xp
        let level = state.level
        let maxVitality = state.maxVitality
        let maxFocus = state.maxFocus
        let maxLantern = state.maxLantern
        let currentSceneId = state.currentSceneId
        let inventory = [...state.inventory]
        let archiveRelics = [...state.archiveRelics]
        let discoveredScenes = [...state.discoveredScenes]
        let runFlags = [...state.runFlags]
        let veilPressure = state.veilPressure
        let choiceUseCounts = { ...state.choiceUseCounts }
        let runComfortXpConsumed = state.runComfortXpConsumed
        let xpBonusFromPassives = 0
        let runStatus: RunStatus = currentSceneId === 'ashfall_archive' ? 'hub' : 'expedition'
        let runStartXp = state.runStartXp
        let runStartArchiveCount = state.runStartArchiveCount
        let runStartDiscoveredCount = state.runStartDiscoveredCount
        let lastLevelUpAt = state.lastLevelUpAt
        let log = appendLog(state.log, {
          text: `${scene.title}: ${choice.label}.`,
          type: 'action',
          turn: nextTurn,
        })

        if (choice.pressure !== undefined) {
          veilPressure = clamp(veilPressure + choice.pressure, 0, 100)
          log = appendLog(log, {
            text: `Veil Pressure shifts by ${choice.pressure} as you commit to the move.`,
            type: choice.pressure > 0 ? 'danger' : 'system',
            turn: nextTurn,
          })
        } else if (state.currentSceneId !== 'ashfall_archive') {
          veilPressure = clamp(veilPressure + 4, 0, 100)
          log = appendLog(log, {
            text: 'The Veil tightens another notch with every choice.',
            type: 'danger',
            turn: nextTurn,
          })
        }

        if (choiceCount > 0 && choice.repeatPenalty) {
          if (choice.repeatPenalty.message) {
            log = appendLog(log, {
              text: choice.repeatPenalty.message,
              type: 'system',
              turn: nextTurn,
            })
          }
          if (choice.repeatPenalty.pressureDelta) {
            veilPressure = clamp(veilPressure + choice.repeatPenalty.pressureDelta, 0, 100)
            log = appendLog(log, {
              text: `Veil Pressure changes by ${choice.repeatPenalty.pressureDelta} for the repeated action.`,
              type: choice.repeatPenalty.pressureDelta > 0 ? 'danger' : 'system',
              turn: nextTurn,
            })
          }
        }


        if (vitality <= 0) {
          set(
            finishFailedRun(
              state,
              nextTurn,
              xp,
              level,
              maxVitality,
              maxFocus,
              maxLantern,
              discoveredScenes,
              archiveRelics,
              state.completedRuns,
              'Your strength fails before the move is even made. The waste takes the rest.',
              buildEndSnapshot(state, xp, state.inventory, veilPressure, vitality, focus, lantern, 'Broken Return', []),
            ),
          )
          return
        }

        if (focus <= 0) {
          set(
            finishFailedRun(
              state,
              nextTurn,
              xp,
              level,
              maxVitality,
              maxFocus,
              maxLantern,
              discoveredScenes,
              archiveRelics,
              state.completedRuns,
              'Your mind frays under the strain and the Veil slips its hold.',
              buildEndSnapshot(state, xp, state.inventory, veilPressure, vitality, focus, lantern, 'Broken Return', []),
            ),
          )
          return
        }

        if (lantern <= 0) {
          set(
            finishFailedRun(
              state,
              nextTurn,
              xp,
              level,
              maxVitality,
              maxFocus,
              maxLantern,
              discoveredScenes,
              archiveRelics,
              state.completedRuns,
              'Your lantern dies mid-step. Without its warding glow, the Veil closes over you.',
              buildEndSnapshot(state, xp, state.inventory, veilPressure, vitality, focus, lantern, 'Broken Return', []),
            ),
          )
          return
        }

        const outcome = pickOutcome(choice)
        if (state.currentSceneId === 'ashfall_archive' && outcome.nextSceneId && outcome.nextSceneId !== 'ashfall_archive' && state.runStatus === 'hub') {
          runStartXp = state.xp
          runStartArchiveCount = state.archiveRelics.length
          runStartDiscoveredCount = state.discoveredScenes.length
        }
        choiceUseCounts[choice.id] = choiceCount + 1
        log = appendLog(log, { text: outcome.text, type: outcome.type, turn: nextTurn })

        if (inventory.includes('brass_locator') && choice.intent === 'search') {
          xpBonusFromPassives += 3
          log = appendLog(log, {
            text: 'The Brass Locator sharpens your search, guiding small chances toward treasure.',
            type: 'reward',
            turn: nextTurn,
          })
        }

        if (inventory.includes('whisper_thread') && choice.intent === 'listen') {
          xpBonusFromPassives += 4
          veilPressure = clamp(veilPressure + 6, 0, 100)
          log = appendLog(log, {
            text: 'Whisper Thread heightens the Veil; the reward is clearer, but the pressure climbs.',
            type: 'danger',
            turn: nextTurn,
          })
        }

        if (outcome.statDelta) {
          vitality = clamp(vitality + (outcome.statDelta.vitality ?? 0), 0, maxVitality)
          focus = clamp(focus + (outcome.statDelta.focus ?? 0), 0, maxFocus)
          lantern = clamp(lantern + (outcome.statDelta.lantern ?? 0), 0, maxLantern)
        }

        if (outcome.pressureDelta) {
          veilPressure = clamp(veilPressure + outcome.pressureDelta, 0, 100)
          log = appendLog(log, {
            text: outcome.pressureDelta > 0 ? `Veil Pressure rises by ${outcome.pressureDelta}.` : `Veil Pressure eases by ${Math.abs(outcome.pressureDelta)}.`,
            type: 'danger',
            turn: nextTurn,
          })
        }

        if (state.currentSceneId !== 'ashfall_archive') {
          const tier = getPressureTier(veilPressure)
          if (tier >= 1 && (choice.intent === 'search' || choice.intent === 'study') && Math.random() < 0.18) {
            const hazardRoll = Math.random()
            if (hazardRoll < 0.34) {
              vitality = clamp(vitality - 5, 0, maxVitality)
              log = appendLog(log, {
                text: 'Pressure makes the waste breathe wrong. Your body pays for the clarity you thought you had.',
                type: 'danger',
                turn: nextTurn,
              })
            } else if (hazardRoll < 0.67) {
              focus = clamp(focus - 4, 0, maxFocus)
              log = appendLog(log, {
                text: 'A hallucination slides across your thoughts like a second pair of eyes. Focus frays.',
                type: 'danger',
                turn: nextTurn,
              })
            } else {
              veilPressure = clamp(veilPressure + 8, 0, 100)
              log = appendLog(log, {
                text: 'The Veil answers your attention with static. Pressure climbs before you can close the thought.',
                type: 'danger',
                turn: nextTurn,
              })
            }
          }
          if (tier >= 3 && Math.random() < 0.12) {
            set(
              finishFailedRun(
                { ...state, log },
                nextTurn,
                xp,
                level,
                maxVitality,
                maxFocus,
                maxLantern,
                discoveredScenes,
                archiveRelics,
                state.completedRuns + 1,
                'The Veil reaches through your own skull. You drop before the next step is real.',
                buildEndSnapshot(state, xp, inventory, veilPressure, vitality, focus, lantern, 'Veil Breach', []),
              ),
            )
            return
          }
        }

        if (outcome.setFlags) {
          runFlags = dedupe([...runFlags, ...outcome.setFlags])
        }

        if (outcome.clearFlags) {
          runFlags = runFlags.filter((flag) => !outcome.clearFlags!.includes(flag))
        }

        if (outcome.xp) {
          const baseXp = randomBetween(outcome.xp[0], outcome.xp[1])
          let factor = choiceCount > 0 && choice.repeatPenalty?.xpFactor !== undefined ? choice.repeatPenalty.xpFactor : 1
          if (COMFORT_SAFE_GRIND_IDS.has(choice.id) && runComfortXpConsumed) {
            factor = 0
          }
          const gainedXp = Math.floor(baseXp * factor)
          if (gainedXp > 0) {
            xp += gainedXp
            log = appendLog(log, {
              text: `+${gainedXp} XP`,
              type: 'reward',
              turn: nextTurn,
            })
          } else if (COMFORT_SAFE_GRIND_IDS.has(choice.id) && runComfortXpConsumed) {
            log = appendLog(log, {
              text: 'The comfort is familiar now. There is no fresh insight to reward—only habit.',
              type: 'narrative',
              turn: nextTurn,
            })
          }
        }
        if (COMFORT_SAFE_GRIND_IDS.has(choice.id)) {
          runComfortXpConsumed = true
        }

        if (xpBonusFromPassives > 0) {
          xp += xpBonusFromPassives
          log = appendLog(log, {
            text: `+${xpBonusFromPassives} XP from passive equipment.`,
            type: 'reward',
            turn: nextTurn,
          })
        }

        if (outcome.itemIds?.length) {
          const itemId = pickRandom(outcome.itemIds)
          if (inventory.length < MAX_INVENTORY) {
            inventory = [...inventory, itemId]
            log = appendLog(log, {
              text: `Recovered ${ITEM_DEFS[itemId].name}.`,
              type: ITEM_DEFS[itemId].rarity === 'rare' || ITEM_DEFS[itemId].rarity === 'mythic' ? 'reward' : 'narrative',
              turn: nextTurn,
            })
          } else {
            log = appendLog(log, {
              text: `${ITEM_DEFS[itemId].name} is left behind; your satchel has no room left.`,
              type: 'system',
              turn: nextTurn,
            })
          }
        }

        while (xp >= totalXpRequiredForLevel(level + 1)) {
          level += 1
          maxVitality += 4
          maxFocus += 2
          maxLantern += 1
          vitality = clamp(vitality + 6, 0, maxVitality)
          focus = clamp(focus + 4, 0, maxFocus)
          lantern = clamp(lantern + 3, 0, maxLantern)
          lastLevelUpAt = Date.now()
          log = appendLog(log, {
            text: `LEVEL UP. Your training hardens into instinct. Field thresholds widen and the gate-noise feels slightly less impossible.`,
            type: 'reward',
            turn: nextTurn,
          })
        }

        if (outcome.nextSceneId) {
          currentSceneId = outcome.nextSceneId
          if (!discoveredScenes.includes(outcome.nextSceneId)) {
            discoveredScenes = [...discoveredScenes, outcome.nextSceneId]
          }
        }

        if (vitality <= 0) {
          set(
            finishFailedRun(
              {
                ...state,
                log,
              },
              nextTurn,
              xp,
              level,
              maxVitality,
              maxFocus,
              maxLantern,
              discoveredScenes,
              archiveRelics,
              state.completedRuns,
              'Pain buckles your legs before you can secure the return. The run breaks around you.',
              buildEndSnapshot(state, xp, inventory, veilPressure, vitality, focus, lantern, 'Broken Return', []),
            ),
          )
          return
        }

        if (focus <= 0) {
          set(
            finishFailedRun(
              {
                ...state,
                log,
              },
              nextTurn,
              xp,
              level,
              maxVitality,
              maxFocus,
              maxLantern,
              discoveredScenes,
              archiveRelics,
              state.completedRuns,
              'Your focus shatters mid-thought. The waste stops pretending to be navigable.',
              buildEndSnapshot(state, xp, inventory, veilPressure, vitality, focus, lantern, 'Broken Return', []),
            ),
          )
          return
        }

        if (lantern <= 0) {
          set(
            finishFailedRun(
              {
                ...state,
                log,
              },
              nextTurn,
              xp,
              level,
              maxVitality,
              maxFocus,
              maxLantern,
              discoveredScenes,
              archiveRelics,
              state.completedRuns,
              'The lantern gutters out in hostile dark. Without that warding light, the way home stops existing.',
              buildEndSnapshot(state, xp, inventory, veilPressure, vitality, focus, lantern, 'Broken Return', []),
            ),
          )
          return
        }

        if (outcome.endRun === 'veil') {
          set(
            finishFailedRun(
              {
                ...state,
                log,
              },
              nextTurn,
              xp,
              level,
              maxVitality,
              maxFocus,
              maxLantern,
              discoveredScenes,
              archiveRelics,
              state.completedRuns + 1,
              'The Veil folds the landscape over you. You make it back only as a staggered survivor, empty-handed and changed.',
              buildEndSnapshot(state, xp, inventory, veilPressure, vitality, focus, lantern, 'Veil Breach', []),
            ),
          )
          return
        }

        if (outcome.endRun === 'success') {
          const hasVeilSalt = inventory.includes('veil_salt')
          if (state.currentSceneId === 'extraction_point') {
            let stabiliser = 0
            if (hasVeilSalt) {
              const saltIndex = inventory.indexOf('veil_salt')
              inventory.splice(saltIndex, 1)
              stabiliser = 30
              log = appendLog(log, {
                text: 'Veil Salt burns away, anchoring the return pulse for a moment longer.',
                type: 'reward',
                turn: nextTurn,
              })
            }

            const loadPenalty = inventory.length * 2
            const pressurePenalty = Math.max(0, veilPressure - 45)
            const hazardPenalty = state.runFlags.includes('disturbed_obelisk') || state.runFlags.includes('veil_noticed') ? 10 : 0
            const locatorBonus = inventory.includes('brass_locator') ? 10 : 0
            const studyBonus = state.runFlags.includes('gate_studied') ? 8 : 0
            const attentiveBonus = state.runFlags.includes('veil_attentive') ? 6 : 0
            const pressureTier = getPressureTier(veilPressure)
            const tierFailBoost = pressureTier === 2 ? 0.14 : pressureTier === 3 ? 0.26 : 0
            const failChance = clamp(
              (loadPenalty + pressurePenalty + hazardPenalty - stabiliser - locatorBonus - studyBonus - attentiveBonus) / 120 + tierFailBoost,
              0,
              0.88,
            )

            if (pressureTier >= 2) {
              log = appendLog(log, {
                text: 'The return corridor feels thin; the Veil tears at the edges of your hearing.',
                type: 'danger',
                turn: nextTurn,
              })
            }

            if (Math.random() < failChance) {
              set(
                finishFailedRun(
                  {
                    ...state,
                    log,
                  },
                  nextTurn,
                  xp,
                  level,
                  maxVitality,
                  maxFocus,
                  maxLantern,
                  discoveredScenes,
                  archiveRelics,
                  state.completedRuns + 1,
                  'The return pulse buckles. The gate snaps shut, and the Veil takes the route that was almost yours.',
                  buildEndSnapshot(state, xp, inventory, veilPressure, vitality, focus, lantern, 'Failed Extraction', []),
                ),
              )
              return
            }
          }

          archiveRelics = dedupe([...archiveRelics, ...inventory])
          const recoveredCount = inventory.length
          const recoveredRare = inventory.some((itemId) => ITEM_DEFS[itemId].rarity === 'rare' || ITEM_DEFS[itemId].rarity === 'mythic')
          const objectiveResult = evaluateObjectives(state.objectives, recoveredCount, recoveredRare, discoveredScenes, veilPressure, state.completedRuns + 1)
          xp += objectiveResult.bonusXp
          if (objectiveResult.bonusXp > 0) {
            log = appendLog(log, {
              text: `Contract reward: +${objectiveResult.bonusXp} XP for completing mission objectives.`,
              type: 'reward',
              turn: nextTurn,
            })
          }

          const runCount = state.completedRuns + 1
          log = appendLog(log, {
            text:
              recoveredCount > 0
                ? `Archive intake confirms ${recoveredCount} recovered relic${recoveredCount === 1 ? '' : 's'}. The bunker records another living return.`
                : 'You return alive, if light on salvage. Even that matters.',
            type: 'system',
            turn: nextTurn,
          })

          set({
            level,
            xp,
            vitality: maxVitality,
            maxVitality,
            focus: maxFocus,
            maxFocus,
            lantern: maxLantern,
            maxLantern,
            currentSceneId: 'ashfall_archive',
            inventory,
            archiveRelics,
            discoveredScenes: dedupe(discoveredScenes),
            runFlags: [],
            choiceUseCounts: {},
            veilPressure: 0,
            completedRuns: runCount,
            runStartXp,
            runStartArchiveCount,
            runStartDiscoveredCount,
            runResultCause: 'Extraction complete.',
            runResultNewObjectives: objectiveResult.completedObjectiveLabels,
            runEndSnapshot: buildEndSnapshot(
              state,
              xp,
              inventory,
              veilPressure,
              maxVitality,
              maxFocus,
              maxLantern,
              'Safe Extraction',
              objectiveResult.completedObjectiveLabels,
            ),
            runComfortXpConsumed: false,
            objectives: objectiveResult.objectives,
            log,
            turn: nextTurn,
            runStatus: 'success',
            lastLevelUpAt,
          })
          return
        }

        if (currentSceneId !== 'ashfall_archive') {
          runStatus = 'expedition'
        } else {
          runStatus = 'hub'
        }

        set({
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
          discoveredScenes: dedupe(discoveredScenes),
          runFlags,
          choiceUseCounts,
          veilPressure,
          runStartXp,
          runStartArchiveCount,
          runStartDiscoveredCount,
          runResultCause: '',
          runResultNewObjectives: [],
          runComfortXpConsumed,
          log,
          turn: nextTurn,
          runStatus,
          lastLevelUpAt,
        })
      },

      useItem: (itemId) => {
        set((current) => {
          if (!current.inventory.includes(itemId)) {
            return {
              log: appendLog(current.log, {
                text: 'You do not have that item to use.',
                type: 'system',
                turn: current.turn,
              }),
            }
          }

          const def = ITEM_DEFS[itemId]
          if (def.itemType !== 'consumable') {
            return {
              log: appendLog(current.log, {
                text: 'That item is not something you can use in the field like a ration.',
                type: 'system',
                turn: current.turn,
              }),
            }
          }

          const inventory = current.inventory.filter((id) => id !== itemId)
          let vitality = current.vitality
          let focus = current.focus
          let veilPressure = current.veilPressure
          let log = appendLog(current.log, {
            text: `You use ${def.name}.`,
            type: 'reward',
            turn: current.turn + 1,
          })

          if (itemId === 'ashwater_flask') {
            vitality = clamp(vitality + 10, 0, current.maxVitality)
            focus = clamp(focus + 4, 0, current.maxFocus)
            log = appendLog(log, {
              text: 'Ashwater restores your strength and steadies your thoughts enough to press on.',
              type: 'system',
              turn: current.turn + 1,
            })
          }

          if (itemId === 'veil_salt') {
            veilPressure = clamp(veilPressure - 10, 0, 100)
            log = appendLog(log, {
              text: 'Veil Salt steadies your mind and eases the pressure around you.',
              type: 'system',
              turn: current.turn + 1,
            })
          }

          return {
            inventory,
            vitality,
            focus,
            veilPressure,
            log,
            turn: current.turn + 1,
          }
        })
      },
      settleRun: () =>
        set((current) => ({
          ...current,
          runStatus: 'hub',
          runResultCause: '',
          runResultNewObjectives: [],
          runEndSnapshot: null,
          runComfortXpConsumed: false,
          objectives: rotateObjectivesForArchive(current.objectives),
          runStartXp: current.xp,
          runStartArchiveCount: current.archiveRelics.length,
          runStartDiscoveredCount: current.discoveredScenes.length,
        })),

      resetGame: () => set(createInitialState()),
    }),
    {
      name: 'ashfaller-veil-between-save',
      partialize: (state) => ({
        level: state.level,
        xp: state.xp,
        vitality: state.vitality,
        maxVitality: state.maxVitality,
        focus: state.focus,
        maxFocus: state.maxFocus,
        lantern: state.lantern,
        maxLantern: state.maxLantern,
        currentSceneId: state.currentSceneId,
        inventory: state.inventory,
        archiveRelics: state.archiveRelics,
        discoveredScenes: state.discoveredScenes,
        runFlags: state.runFlags,
        choiceUseCounts: state.choiceUseCounts,
        veilPressure: state.veilPressure,
        completedRuns: state.completedRuns,
        runStartXp: state.runStartXp,
        runStartArchiveCount: state.runStartArchiveCount,
        runStartDiscoveredCount: state.runStartDiscoveredCount,
        runResultCause: state.runResultCause,
        runResultNewObjectives: state.runResultNewObjectives,
        runEndSnapshot: state.runEndSnapshot,
        runComfortXpConsumed: state.runComfortXpConsumed,
        objectives: state.objectives,
        log: state.log,
        turn: state.turn,
        runStatus: state.runStatus,
        lastLevelUpAt: state.lastLevelUpAt,
      }),
    },
  ),
)

function buildEndSnapshot(
  state: Pick<GameState, 'runStartXp'>,
  xp: number,
  inventory: string[],
  veilPressure: number,
  vitality: number,
  focus: number,
  lantern: number,
  resultLabel: string,
  objectivesDone: string[],
): RunEndSnapshot {
  return {
    resultLabel,
    xpGain: Math.max(0, xp - state.runStartXp),
    itemIds: [...inventory],
    pressure: veilPressure,
    vitality,
    focus,
    lantern,
    objectivesDone,
  }
}

function finishFailedRun(
  state: Pick<GameState, 'log'>,
  turn: number,
  xp: number,
  level: number,
  maxVitality: number,
  maxFocus: number,
  maxLantern: number,
  discoveredScenes: SceneId[],
  archiveRelics: string[],
  completedRuns: number,
  failText: string,
  snapshot: RunEndSnapshot,
) {
  const log = appendLog(
    state.log,
    {
      text: failText,
      type: 'danger',
      turn,
    },
  )

  return {
    level,
    xp,
    vitality: maxVitality,
    maxVitality,
    focus: maxFocus,
    maxFocus,
    lantern: maxLantern,
    maxLantern,
    currentSceneId: 'ashfall_archive' as SceneId,
    inventory: [],
    archiveRelics,
    discoveredScenes: dedupe(discoveredScenes),
    runFlags: [],
    veilPressure: 0,
    completedRuns,
    choiceUseCounts: {},
    runResultCause: failText,
    runResultNewObjectives: [],
    runEndSnapshot: snapshot,
    runComfortXpConsumed: false,
    log: appendLog(log, {
      text: 'Archive medicae records your return. The run is lost, but the memory of the route remains.',
      type: 'system',
      turn,
    }),
    turn,
    runStatus: 'failed' as RunStatus,
    lastLevelUpAt: 0,
  }
}

function replaceCompletedObjectives(objectives: ObjectiveStatus[]) {
  const activeIds = objectives.map((objective) => objective.id)
  const available = OBJECTIVE_DEFS.filter((def) => !activeIds.includes(def.id))
  return objectives.map((objective) => {
    if (!objective.completed) return objective
    const next = available.shift()
    return next ? createObjective(next) : objective
  })
}

function rotateObjectivesForArchive(objectives: ObjectiveStatus[]) {
  const refreshed = replaceCompletedObjectives(objectives)
  const activeIds = refreshed.map((objective) => objective.id)
  const available = OBJECTIVE_DEFS.filter((def) => !activeIds.includes(def.id))
  if (available.length === 0) return refreshed

  const rotateIndex = refreshed.findIndex((objective) => !objective.completed && objective.progress === 0)
  if (rotateIndex === -1) return refreshed

  const nextObjective = createObjective(pickRandom(available))
  const rotated = [...refreshed]
  rotated[rotateIndex] = nextObjective
  return rotated
}

function evaluateObjectives(
  objectives: ObjectiveStatus[],
  recoveredCount: number,
  recoveredRare: boolean,
  discoveredScenes: SceneId[],
  veilPressure: number,
  completedRuns: number,
) {
  let bonusXp = 0
  const completedObjectiveLabels: string[] = []

  const updated = objectives.map((objective) => {
    if (objective.completed) return objective

    let progress = objective.progress
    let completed = false

    if (objective.type === 'recoverRelics') {
      progress = Math.min(objective.target, recoveredCount)
      completed = progress >= objective.target
    }

    if (objective.type === 'returnRareRelic') {
      progress = recoveredRare ? 1 : 0
      completed = recoveredRare
    }

    if (objective.type === 'surviveHighPressure') {
      progress = veilPressure
      completed = veilPressure >= objective.target
    }

    if (objective.type === 'discoverScene' && objective.sceneId) {
      progress = discoveredScenes.includes(objective.sceneId) ? 1 : 0
      completed = progress >= 1
    }

    if (objective.type === 'successfulRuns') {
      progress = completedRuns
      completed = progress >= objective.target
    }

    if (!objective.completed && completed) {
      bonusXp += objective.rewardXp
      completedObjectiveLabels.push(objective.label)
      return { ...objective, progress: objective.target, completed: true }
    }

    return { ...objective, progress }
  })

  return {
    objectives: replaceCompletedObjectives(updated),
    bonusXp,
    completedObjectiveLabels,
  }
}

function pickOutcome(choice: Choice): ChoiceOutcome {
  const totalWeight = choice.outcomes.reduce((sum, outcome) => sum + outcome.weight, 0)
  let roll = Math.random() * totalWeight

  for (const outcome of choice.outcomes) {
    roll -= outcome.weight
    if (roll <= 0) return outcome
  }

  return choice.outcomes[choice.outcomes.length - 1]
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function appendLog(log: LogEntry[], entry: Omit<LogEntry, 'id'>) {
  return [...log, { id: crypto.randomUUID(), ...entry }].slice(-MAX_LOG)
}

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)]
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function dedupe<T>(items: T[]) {
  return [...new Set(items)]
}

export function totalXpRequiredForLevel(level: number) {
  if (level <= 1) return 0
  return ((level - 1) * level * 30)
}
