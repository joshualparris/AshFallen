export type SceneId =
  | 'ashfall_archive'
  | 'threshold_gate'
  | 'red_waste_approach'
  | 'glass_dune'
  | 'broken_obelisk'
  | 'hollow_caravan'
  | 'extraction_point'

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'mythic'
export type LogType = 'narrative' | 'action' | 'reward' | 'danger' | 'system'

export interface ItemDef {
  id: string
  name: string
  rarity: ItemRarity
  /** Same as `itemType`; kept for readability in data. */
  type: 'relic' | 'consumable' | 'passive'
  itemType: 'relic' | 'consumable' | 'passive'
  description: string
  effect: string
}

export interface StatsDelta {
  vitality?: number
  focus?: number
  lantern?: number
}

export interface ChoiceRequirement {
  minFocus?: number
  minLantern?: number
  openInventorySlot?: boolean
  requiredItemIds?: string[]
  requiresFlags?: string[]
  forbiddenFlags?: string[]
}

export interface ChoiceRepeatPenalty {
  xpFactor?: number
  pressureDelta?: number
  message?: string
}

export interface ChoiceOutcome {
  weight: number
  text: string
  type: LogType
  nextSceneId?: SceneId
  statDelta?: StatsDelta
  xp?: [number, number]
  itemIds?: string[]
  endRun?: 'success' | 'veil'
  logBonus?: string
  pressureDelta?: number
  setFlags?: string[]
  clearFlags?: string[]
}

export interface Choice {
  id: string
  label: string
  intent: string
  description: string
  cost?: StatsDelta
  requires?: ChoiceRequirement
  pressure?: number
  maxUses?: number
  repeatPenalty?: ChoiceRepeatPenalty
  outcomes: ChoiceOutcome[]
}

export interface SceneDef {
  id: SceneId
  title: string
  region: string
  mood: string
  description: string
  flavour: string
  choices: Choice[]
}

export const ITEM_DEFS: Record<string, ItemDef> = {
  dustglass_shard: {
    id: 'dustglass_shard',
    name: 'Dustglass Shard',
    rarity: 'common',
    type: 'relic',
    itemType: 'relic',
    description: 'A red-gold splinter from a dune fused by old heat and stranger light.',
    effect: 'Field use: sold, studied, or used later to trace buried heat fractures.',
  },
  whisper_thread: {
    id: 'whisper_thread',
    name: 'Whisper Thread',
    rarity: 'uncommon',
    type: 'passive',
    itemType: 'passive',
    description: 'A silver fibre that hums when the Veil presses close.',
    effect: 'Field use: improves later listening and Veil-sense actions.',
  },
  old_gate_coin: {
    id: 'old_gate_coin',
    name: 'Old Gate Coin',
    rarity: 'common',
    type: 'relic',
    itemType: 'relic',
    description: 'Stamped with a ringed star and worn smooth by fingers long dead.',
    effect: 'Field use: hints at route logic and hidden gate traditions.',
  },
  ashwater_flask: {
    id: 'ashwater_flask',
    name: 'Ashwater Flask',
    rarity: 'common',
    type: 'consumable',
    itemType: 'consumable',
    description: 'A clay flask sealed with pitch, still cool despite the waste.',
    effect: 'Field use: restore vitality after a taxing choice.',
  },
  brass_locator: {
    id: 'brass_locator',
    name: 'Brass Locator',
    rarity: 'rare',
    type: 'passive',
    itemType: 'passive',
    description: 'A palm-sized dial that twitches toward worked stone under the dunes.',
    effect: 'Field use: reveals hidden caches and route shortcuts in later stages.',
  },
  veil_salt: {
    id: 'veil_salt',
    name: 'Veil Salt',
    rarity: 'uncommon',
    type: 'consumable',
    itemType: 'consumable',
    description: 'Grey crystals packed in wax paper to steady the mind against whispers.',
    effect: 'Field use: resists Veil distortion and mental attrition.',
  },
  hollow_reed_song: {
    id: 'hollow_reed_song',
    name: 'Hollow Reed Song',
    rarity: 'rare',
    type: 'passive',
    itemType: 'passive',
    description: 'A scored brass strip that sings when breathed across the glyph cuts.',
    effect: 'Field use: unlocks a musical Name path in future archive research.',
  },
  fragment_of_true_name: {
    id: 'fragment_of_true_name',
    name: 'Fragment of a True Name',
    rarity: 'mythic',
    type: 'relic',
    itemType: 'relic',
    description: 'Not quite text, not quite sound; it settles in the memory like warm ash.',
    effect: 'Field use: a mythic archive key for later attunement and Veiled paths.',
  },
}

export const SCENES: Record<SceneId, SceneDef> = {
  ashfall_archive: {
    id: 'ashfall_archive',
    title: 'Ashfall Archive',
    region: 'Subsurface Hub // Dubbo',
    mood: 'Vaulted quiet, warm brass, held breath',
    description:
      'Beneath the red earth of Dubbo, the Archive waits in lamplight and dust: brass rings, slate tables, salvaged maps, and the old gate chamber beyond a pressure door scarred by heat. The place feels part bunker, part chapel, part machine that remembers a sky no one living has seen.',
    flavour:
      'Ash settles slowly in the still air here. Even silence sounds curated, as if the bunker is listening for what you bring back.',
    choices: [
      {
        id: 'archive_prepare_gate',
        label: 'Approach the Threshold Gate',
        intent: 'deploy',
        description: 'Prime the old chamber, settle your breathing, and step toward the ring before the courage goes cold.',
        outcomes: [
          {
            weight: 1,
            text: 'The pressure door groans aside. Brass teeth align around the gate, and cyan fire walks the inner ring one glyph at a time.',
            type: 'action',
            nextSceneId: 'threshold_gate',
            xp: [8, 14],
          },
        ],
      },
      {
        id: 'archive_review_ledger',
        label: 'Review the field ledger',
        intent: 'study',
        description: 'Skim prior recoveries, whispered annotations, and incomplete destination notes before the next run.',
        maxUses: 1,
        repeatPenalty: {
          xpFactor: 0,
          pressureDelta: 8,
          message: 'The ledger has nothing more to teach you right now. The page is spent.',
        },
        outcomes: [
          {
            weight: 3,
            text: 'You find a cleaner route notation beside a half-burned sketch of the Red Waste. Someone before you marked the obelisk with a warning, then stopped writing mid-line.',
            type: 'narrative',
            xp: [10, 18],
            statDelta: { focus: 4 },
          },
          {
            weight: 1,
            text: 'A brittle pocket of papers drops free from the ledger spine. Inside sits an old transit token stamped with a ring and three stars.',
            type: 'reward',
            xp: [12, 20],
            itemIds: ['old_gate_coin'],
          },
        ],
      },
      {
        id: 'archive_steady_hands',
        label: 'Steady hands at the brazier',
        intent: 'rest',
        description: 'Warm yourself beside the ash brazier and let your pulse slow before another crossing.',
        maxUses: 1,
        repeatPenalty: {
          xpFactor: 0,
          pressureDelta: 10,
          message: 'The brazier is spent. Another rest here only summons the same old heat without new recovery.',
        },
        outcomes: [
          {
            weight: 1,
            text: 'The brazier burns with smokeless coals. Heat settles your lungs, and the ring-hum beyond the wall becomes easier to bear.',
            type: 'system',
            xp: [4, 8],
            statDelta: { vitality: 4, focus: 4, lantern: 3 },
          },
        ],
      },
    ],
  },
  threshold_gate: {
    id: 'threshold_gate',
    title: 'Threshold Gate',
    region: 'Gate Chamber',
    mood: 'Pressure, signal-glow, old machine prayer',
    description:
      'The ancient ring hangs in its cradle like a sunken crown. Brass braces and modern cabling keep it barely obedient. Beyond the wet cyan sheen inside the aperture, another sky waits, blurred by sand and interference.',
    flavour:
      'The gate does not merely open. It agrees, reluctantly, and only after measuring whether you are worth remembering.',
    choices: [
      {
        id: 'threshold_enter_red_waste',
        label: 'Commit to the Red Waste code',
        intent: 'travel',
        description: 'Lock the destination string, tighten your satchel, and step through before the sequence drifts.',
        cost: { lantern: -8, focus: -3, vitality: -3 },
        outcomes: [
          {
            weight: 1,
            text: 'Static tears across your skin. Red wind meets you on the far side, hot with iron dust and the smell of stone that has not seen rain in an age.',
            type: 'action',
            nextSceneId: 'red_waste_approach',
            xp: [12, 18],
          },
        ],
      },
      {
        id: 'threshold_study_sigils',
        label: 'Study the waking sigils',
        intent: 'study',
        description: 'Follow the rotating glyph lattice and trace what little of the gate-language you have recovered.',
        requires: { minFocus: 8 },
        cost: { focus: -5, vitality: -2 },
        maxUses: 1,
        pressure: 8,
        outcomes: [
          {
            weight: 3,
            text: 'One sigil catches in your memory: not a place-name, but a verb. Open is too simple a translation. It is nearer to yield.',
            type: 'narrative',
            xp: [16, 26],
            statDelta: { lantern: 2 },
            setFlags: ['gate_studied'],
            pressureDelta: 8,
          },
          {
            weight: 1,
            text: 'A seam opens in the brass housing and spills a preserved ampoule of Veil salt into your hand, as if the machine expected you to need it.',
            type: 'reward',
            xp: [18, 28],
            itemIds: ['veil_salt'],
            setFlags: ['gate_studied'],
          },
        ],
      },
      {
        id: 'threshold_recenter',
        label: 'Recenter beneath the ring',
        intent: 'rest',
        description: 'Keep your footing, breathe through the static, and stabilise your nerves before the crossing.',
        maxUses: 1,
        pressure: 2,
        repeatPenalty: {
          xpFactor: 0.25,
          pressureDelta: 12,
          message: 'The gate hums in a harsher key now. Another pause here only gives the Veil more time to watch you.',
        },
        outcomes: [
          {
            weight: 1,
            text: 'You let the hum pass through you instead of against you. For a brief moment, the chamber feels less like a machine and more like a rite.',
            type: 'system',
            xp: [6, 10],
            statDelta: { focus: 5, lantern: 3 },
            pressureDelta: -8,
          },
        ],
      },
    ],
  },
  red_waste_approach: {
    id: 'red_waste_approach',
    title: 'Red Waste Approach',
    region: 'Outer Veil // Red Waste',
    mood: 'Open dunes, old dread, beautiful ruin',
    description:
      'The waste spreads in waves of red dust and glassed stone, broken by distant ribs of metal and the black line of an obelisk half-swallowed by the dunes. Wind strips the world down to shape and omen.',
    flavour:
      'You can turn back now and still call it a sensible run. The danger starts where staying seems worthwhile.',
    choices: [
      {
        id: 'approach_follow_dune',
        label: 'Travel by the glass dune',
        intent: 'travel',
        description: 'Take the higher line where the wind cuts clearer paths across the fused ridge.',
        cost: { vitality: -9, focus: -3, lantern: -6 },
        pressure: 6,
        outcomes: [
          {
            weight: 1,
            text: 'Your boots crunch over old fused sand. Beneath the ridge, the dune glitters with trapped light, as if a storm once fell here made of fire.',
            type: 'action',
            nextSceneId: 'glass_dune',
            xp: [12, 18],
          },
        ],
      },
      {
        id: 'approach_markers',
        label: 'Follow the buried markers',
        intent: 'search',
        description: 'Probe for the half-hidden waystones jutting from the dust and trust the older path.',
        cost: { vitality: -9, focus: -5, lantern: -5 },
        pressure: 8,
        outcomes: [
          {
            weight: 2,
            text: 'The markers lead you by broken intervals toward a black obelisk scored with channels like dried rivers.',
            type: 'narrative',
            nextSceneId: 'broken_obelisk',
            xp: [16, 24],
          },
          {
            weight: 1,
            text: 'The markers vanish into a grave circle of wagons, all hollow frames and prayer poles creaking in the hot wind.',
            type: 'narrative',
            nextSceneId: 'hollow_caravan',
            xp: [16, 24],
          },
        ],
      },
      {
        id: 'approach_trace_signal',
        label: 'Trace the gate signal',
        intent: 'study',
        description: 'Use the glyph pattern from the gate to trace a cleaner route through the Waste.',
        requires: { requiresFlags: ['gate_studied'], minFocus: 10 },
        cost: { focus: -7, lantern: -4, vitality: -3 },
        pressure: 6,
        outcomes: [
          {
            weight: 1,
            text: 'The remembered gate-sigil reshapes the wind line around you. The route feels less arbitrary and more chosen.',
            type: 'reward',
            nextSceneId: 'glass_dune',
            xp: [18, 26],
            pressureDelta: 6,
          },
        ],
      },
      {
        id: 'approach_listen_veil',
        label: 'Listen along the Veil',
        intent: 'listen',
        description: 'Still yourself and feel for the hidden layer under heat and wind, where lies and revelations sound alike.',
        requires: { minFocus: 10 },
        cost: { focus: -6, lantern: -4, vitality: -4 },
        outcomes: [
          {
            weight: 2,
            text: 'A second geography folds over the first. For a heartbeat you see the caravan whole, lit by ceremonial lamps and full of silent figures waiting for a name.',
            type: 'reward',
            nextSceneId: 'hollow_caravan',
            xp: [20, 30],
            itemIds: ['whisper_thread'],
            setFlags: ['veil_attentive'],
            pressureDelta: 14,
          },
          {
            weight: 1,
            text: 'The Veil answers too quickly. Distances distort, your lantern gutters blue, and the waste rearranges itself around your next step.',
            type: 'danger',
            xp: [18, 26],
            endRun: 'veil',
            pressureDelta: 20,
            setFlags: ['veil_noticed'],
          },
        ],
      },
      {
        id: 'approach_extract',
        label: 'Break off and head for extraction',
        intent: 'extract',
        description: 'You have enough to justify caution. Pull back while the route still makes sense.',
        cost: { lantern: -4 },
        outcomes: [
          {
            weight: 1,
            text: 'You keep the gate-beacon in sight and fall back along your own footprints before the wind can eat them.',
            type: 'action',
            nextSceneId: 'extraction_point',
            xp: [8, 14],
          },
        ],
      },
    ],
  },
  glass_dune: {
    id: 'glass_dune',
    title: 'Glass Dune',
    region: 'Red Waste Interior',
    mood: 'Sharp light, old heat, watchful silence',
    description:
      'The dune rises like a frozen wave of red-gold glass, banded with old shock lines and pockets of shadow. Beneath the surface, trapped refractions flicker like a storm still trying to get out.',
    flavour:
      'Everything here is beautiful in the way broken sacred things often are.',
    choices: [
      {
        id: 'glass_search_basin',
        label: 'Search the wind-cut basin',
        intent: 'search',
        description: 'Drop below the crest and sift through the pockets where heavier relics settle.',
        requires: { openInventorySlot: true, forbiddenFlags: ['glass_basin_searched'] },
        cost: { vitality: -10, focus: -3, lantern: -5 },
        pressure: 10,
        outcomes: [
          {
            weight: 3,
            text: 'Your gloved hand closes around a fused shard warm from the dune body, still carrying a faint internal glow.',
            type: 'reward',
            nextSceneId: 'glass_dune',
            xp: [16, 24],
            itemIds: ['dustglass_shard'],
            setFlags: ['glass_basin_searched'],
            pressureDelta: 10,
          },
          {
            weight: 1,
            text: 'A brass instrument lies wedged in a seam, its needle twitching the moment daylight touches it.',
            type: 'reward',
            nextSceneId: 'glass_dune',
            xp: [20, 30],
            itemIds: ['brass_locator'],
            setFlags: ['glass_basin_searched'],
            pressureDelta: 10,
          },
        ],
      },
      {
        id: 'glass_follow_locator',
        label: 'Follow the locator pull',
        intent: 'search',
        description: 'Let the Brass Locator hum and lead you toward a seam the dust hides.',
        requires: { requiredItemIds: ['brass_locator'], openInventorySlot: true },
        cost: { vitality: -9, focus: -3, lantern: -4 },
        pressure: 8,
        outcomes: [
          {
            weight: 1,
            text: 'The locator hums sharp and sure. You follow it to a glittering seam the wind has not claimed yet.',
            type: 'reward',
            nextSceneId: 'broken_obelisk',
            xp: [20, 30],
            itemIds: ['whisper_thread'],
            pressureDelta: 8,
          },
        ],
      },
      {
        id: 'glass_climb_crest',
        label: 'Climb the crestline',
        intent: 'travel',
        description: 'Take the higher ground and sight the black obelisk from the top of the glass swell.',
        cost: { vitality: -9, focus: -3, lantern: -5 },
        pressure: 6,
        outcomes: [
          {
            weight: 1,
            text: 'The obelisk stands clearer from the ridge, cut into the horizon like a nail driven into the world.',
            type: 'narrative',
            nextSceneId: 'broken_obelisk',
            xp: [12, 18],
          },
        ],
      },
      {
        id: 'glass_shelter',
        label: 'Shelter in the lee',
        intent: 'rest',
        description: 'Use the dune wall as cover and recover what strength the wind has not already taken.',
        maxUses: 1,
        pressure: 2,
        repeatPenalty: {
          xpFactor: 0,
          pressureDelta: 12,
          message: 'The lee has already given its shield. Staying longer only lets the wind learn your shape.',
        },
        outcomes: [
          {
            weight: 3,
            text: 'The lee side holds a little shade and less noise. You drink slowly and let your pulse stop racing the lantern.',
            type: 'system',
            xp: [8, 12],
            statDelta: { vitality: 5, focus: 3 },
            pressureDelta: -10,
          },
          {
            weight: 1,
            text: 'In the quiet pocket behind the dune, you find a sealed flask cached beneath a cairn of fused pebbles.',
            type: 'reward',
            xp: [10, 16],
            statDelta: { vitality: 3 },
            itemIds: ['ashwater_flask'],
            pressureDelta: -8,
          },
        ],
      },
      {
        id: 'glass_extract',
        label: 'Turn for extraction',
        intent: 'extract',
        description: 'Leave the glass singing behind you and head back while your route still holds.',
        cost: { lantern: -4 },
        outcomes: [
          {
            weight: 1,
            text: 'You descend before the dune can mirror too many versions of you back at yourself.',
            type: 'action',
            nextSceneId: 'extraction_point',
            xp: [8, 14],
          },
        ],
      },
    ],
  },
  broken_obelisk: {
    id: 'broken_obelisk',
    title: 'Broken Obelisk',
    region: 'Red Waste Interior',
    mood: 'Name-work, omen, deep-time gravity',
    description:
      'The obelisk leans from the waste at a slight and impossible angle, its black surface cut by glyph channels that catch the light like liquid metal. At the base, old offerings sit half-buried in sand too fine to be natural.',
    flavour:
      'This is the kind of place that makes practical people start using the word holy without meaning to.',
    choices: [
      {
        id: 'obelisk_study_channels',
        label: 'Study the channel-glyphs',
        intent: 'study',
        description: 'Read the cuts as language rather than decoration and risk understanding more than is safe.',
        requires: { minFocus: 12 },
        cost: { focus: -8, lantern: -5, vitality: -2 },
        outcomes: [
          {
            weight: 2,
            text: 'The channels resolve into a pattern that is almost music and almost command. One phrase nests in your memory and refuses to leave.',
            type: 'reward',
            xp: [24, 36],
            itemIds: ['fragment_of_true_name'],
          },
          {
            weight: 2,
            text: 'You do not master the script, but you map its recurring turns well enough to mark them for later archive work.',
            type: 'narrative',
            xp: [18, 28],
          },
          {
            weight: 1,
            text: 'The final stroke opens inward. For one terrible second, the obelisk seems to remember you from somewhere older than your own life.',
            type: 'danger',
            xp: [18, 24],
            endRun: 'veil',
          },
        ],
      },
      {
        id: 'obelisk_pry_relic',
        label: 'Pry loose a lodged relic',
        intent: 'search',
        description: 'Work a tool into the offering seam and take something before the place decides you have overstayed.',
        requires: { openInventorySlot: true },
        cost: { vitality: -11, focus: -4, lantern: -5 },
        pressure: 10,
        outcomes: [
          {
            weight: 2,
            text: 'A scored brass strip slips free from the seam and thrums softly against your palm.',
            type: 'reward',
            xp: [18, 28],
            itemIds: ['hollow_reed_song'],
            setFlags: ['disturbed_obelisk'],
          },
          {
            weight: 1,
            text: 'You wrench loose a pouch of preserved salt crystals, sealed in wax and hidden against the stone.',
            type: 'reward',
            xp: [16, 24],
            itemIds: ['veil_salt'],
            setFlags: ['disturbed_obelisk'],
          },
        ],
      },
      {
        id: 'obelisk_to_caravan',
        label: 'Track the lee route to the caravan',
        intent: 'travel',
        description: 'Move while the marker shadows still point a coherent direction through the waste.',
        cost: { vitality: -7, lantern: -5 },
        outcomes: [
          {
            weight: 1,
            text: 'The wind eases long enough for you to follow the shadowline into a dead caravan circle beyond the ridge.',
            type: 'action',
            nextSceneId: 'hollow_caravan',
            xp: [12, 18],
          },
        ],
      },
      {
        id: 'obelisk_extract',
        label: 'Withdraw to extraction',
        intent: 'extract',
        description: 'Leave before the place learns your name properly.',
        cost: { lantern: -4 },
        outcomes: [
          {
            weight: 1,
            text: 'You back away from the obelisk without turning your shoulders to it, then break for the beacon line.',
            type: 'action',
            nextSceneId: 'extraction_point',
            xp: [10, 16],
          },
        ],
      },
    ],
  },
  hollow_caravan: {
    id: 'hollow_caravan',
    title: 'Hollow Caravan',
    region: 'Red Waste Interior',
    mood: 'Grief, memory, ritual remains',
    description:
      'A caravan circle lies half-submerged in red dust: split wagons, prayer poles threaded with brittle ribbons, and a central mast cut with names in three scripts. The air tastes faintly of cedar, though there are no trees here.',
    flavour:
      'Someone crossed a world to get here, and something kept them from crossing back.',
    choices: [
      {
        id: 'caravan_search_wagons',
        label: 'Search the wagons',
        intent: 'search',
        description: 'Open sealed lockers, probe hidden compartments, and accept that not all travellers leave honest inventories.',
        requires: { openInventorySlot: true },
        cost: { vitality: -9, focus: -4, lantern: -5 },
        pressure: 6,
        outcomes: [
          {
            weight: 2,
            text: 'A wrapped kit survives beneath a false floor: a compact flask, still sealed against dust and time.',
            type: 'reward',
            xp: [16, 24],
            itemIds: ['ashwater_flask'],
          },
          {
            weight: 2,
            text: 'Inside a broken instrument case you find a silver listening fibre wound around a brass spindle.',
            type: 'reward',
            xp: [18, 26],
            itemIds: ['whisper_thread'],
          },
          {
            weight: 1,
            text: 'A locker opens onto a rush of cold air and voices that are not yours. By the time you slam it shut, the shadows have all shifted.',
            type: 'danger',
            xp: [14, 22],
            statDelta: { focus: -6, lantern: -5 },
          },
        ],
      },
      {
        id: 'caravan_listen_mast',
        label: 'Listen at the prayer mast',
        intent: 'listen',
        description: 'Rest a hand against the carved names and let the Veil tell you what the surviving dust refuses to say.',
        requires: { minFocus: 12 },
        cost: { focus: -8, lantern: -5, vitality: -3 },
        pressure: 14,
        outcomes: [
          {
            weight: 2,
            text: 'A low song rises through the mast. You catch only one line, but it is enough to mark the place as a true crossing-site.',
            type: 'reward',
            xp: [20, 30],
            itemIds: ['hollow_reed_song'],
          },
          {
            weight: 1,
            text: 'One carved name surfaces in your thoughts with impossible clarity. The meaning is beyond you, but the force of it is not.',
            type: 'reward',
            xp: [24, 34],
            itemIds: ['fragment_of_true_name'],
          },
          {
            weight: 1,
            text: 'The mast answers with too many voices at once. The waste folds over itself and the safe route back goes missing.',
            type: 'danger',
            xp: [16, 24],
            endRun: 'veil',
          },
        ],
      },
      {
        id: 'caravan_collect_coin',
        label: 'Collect the ring-marked tokens',
        intent: 'study',
        description: 'Inspect the central offering bowl and recover what symbols still survive under the dust.',
        requires: { openInventorySlot: true },
        cost: { focus: -4, lantern: -3, vitality: -2 },
        pressure: 5,
        outcomes: [
          {
            weight: 1,
            text: 'Several gate-marked tokens sit beneath the dust, stacked like fare for a journey no one finished.',
            type: 'reward',
            xp: [14, 22],
            itemIds: ['old_gate_coin'],
          },
        ],
      },
      {
        id: 'caravan_extract',
        label: 'Run for extraction',
        intent: 'extract',
        description: 'Leave the caravan circle and get back to the gate-beacon before memory and wind trade places.',
        cost: { vitality: -9, lantern: -4 },
        outcomes: [
          {
            weight: 1,
            text: 'You leave the mast singing behind you and follow the pulse of the extractor like a heartbeat across the waste.',
            type: 'action',
            nextSceneId: 'extraction_point',
            xp: [10, 16],
          },
        ],
      },
    ],
  },
  extraction_point: {
    id: 'extraction_point',
    title: 'Extraction Point',
    region: 'Return Corridor',
    mood: 'Decision edge, unstable light, narrowing time',
    description:
      'The portable beacon pulses beside a spine of broken stone, its ring-light syncing badly with the distant gate. Dust streams sideways through the air, drawn by currents that do not belong to wind alone.',
    flavour:
      'Every Ashfaller learns the same lesson eventually: leaving is a skill, not a default.',
    choices: [
      {
        id: 'extract_commit',
        label: 'Stabilise and extract',
        intent: 'extract',
        description: 'Commit to the return pulse, trust the anchor tone, and carry whatever you can through the narrowing window.',
        requires: { minLantern: 6 },
        cost: { vitality: -6, focus: -5, lantern: -6 },
        pressure: 8,
        outcomes: [
          {
            weight: 1,
            text: 'The return line catches. Cyan fire folds around you, and the Archive receives you in brass light with dust still on your boots and relic-weight in your satchel.',
            type: 'reward',
            xp: [18, 28],
            endRun: 'success',
          },
        ],
      },
      {
        id: 'extract_last_cache',
        label: 'Search one last cache',
        intent: 'search',
        description: 'Take the risky final reach that ruins cautious runs and makes the good ones worth remembering.',
        requires: { openInventorySlot: true },
        maxUses: 1,
        pressure: 12,
        repeatPenalty: {
          xpFactor: 0,
          pressureDelta: 10,
          message: 'The last cache is gone. Lingering here only brings the Veil closer.',
        },
        cost: { vitality: -8, lantern: -6, focus: -4 },
        outcomes: [
          {
            weight: 2,
            text: 'Beneath the beacon stones you find a relic pack someone else never made it back to claim.',
            type: 'reward',
            nextSceneId: 'extraction_point',
            xp: [22, 32],
            itemIds: ['brass_locator', 'veil_salt', 'dustglass_shard'],
          },
          {
            weight: 1,
            text: 'The Veil surges while you are crouched over the cache. When you look up, the beacon pulse is coming from three directions at once.',
            type: 'danger',
            xp: [18, 24],
            endRun: 'veil',
          },
        ],
      },
      {
        id: 'extract_regain_bearing',
        label: 'Regain your bearing',
        intent: 'rest',
        description: 'Plant the beacon, breathe through the static, and refuse to rush the return sequence.',
        maxUses: 1,
        pressure: -4,
        repeatPenalty: {
          xpFactor: 0.4,
          pressureDelta: 12,
          message: 'The beacon pulse is already set. Spending more time here only lets the Veil braid new threads through the route.',
        },
        outcomes: [
          {
            weight: 1,
            text: 'You draw a slow breath and let the pulse line settle. The world stops splitting at the edges long enough for the way home to hold still.',
            type: 'system',
            xp: [6, 10],
            statDelta: { focus: 4, lantern: 3 },
            pressureDelta: -12,
          },
        ],
      },
    ],
  },
}
