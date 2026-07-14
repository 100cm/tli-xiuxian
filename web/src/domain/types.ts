/** 火炬修仙转 — 核心类型 */

export type MajorRealm =
  | 'qi_refining'
  | 'foundation'
  | 'core_formation'
  | 'nascent_soul'
  | 'soul_transformation'
  | 'void_refinement'
  | 'body_integration'
  | 'mahayana'
  | 'tribulation'
  | 'true_immortal'

/** 筑基及以后：初/中/后/大圆满 */
export type MinorStage = 'early' | 'mid' | 'late' | 'perfect'

export type AttrKey = 'str' | 'agi' | 'int' | 'con' | 'luck' | 'will'

export type ArtGrade =
  | 'mortal'
  | 'yellow'
  | 'mysterious'
  | 'earth'
  | 'heaven'
  | 'immortal'

export type Screen =
  | 'title'
  | 'hero'
  | 'origin'
  | 'talent'
  | 'main_art'
  | 'play'
  | 'event'
  | 'result'
  | 'arts'
  | 'log'
  | 'ending'

/** 行动/事件结算展示，确认后才回年历 */
export interface PendingResult {
  title: string
  lines: string[]
  /** 确认后去哪 */
  next: 'play' | 'ending' | 'arts'
}

export interface Attrs {
  str: number
  agi: number
  int: number
  con: number
  luck: number
  will: number
}

export interface TalentEffect {
  type: 'attr' | 'cultivateMult' | 'checkBonus' | 'eventWeight' | 'combat' | 'rule'
  key?: string
  value?: number
  tags?: string[]
  mult?: number
  id?: string
}

export interface TalentDef {
  id: string
  name: string
  kind: 'core' | 'small' | 'medium' | 'legendary_medium'
  professionId: string
  professionName: string
  description: string
  effects: TalentEffect[]
  tags: string[]
  weight?: number
}

export interface TalentLoadout {
  professionId: string
  professionName: string
  core: TalentDef
  nodes: TalentDef[]
}

export interface ArtEffect {
  type: 'attr' | 'cultivateMult' | 'checkBonus' | 'combat' | 'unlockChoice' | 'eventWeight'
  key?: string
  value?: number
  tags?: string[]
  mult?: number
  choiceFlag?: string
}

export interface ArtDef {
  id: string
  name: string
  tags: string[]
  description: string
  baseGrade: ArtGrade
  minRealm?: MajorRealm
  effects: ArtEffect[]
  enabled: boolean
}

export interface OwnedArt {
  artId: string
  grade: ArtGrade
  skillLevel: number
  skillXp: number
  complete: boolean
}

export type MainArtSlots = Partial<Record<MajorRealm, string>>

/** 八部位装备 */
export type EquipSlot =
  | 'weapon'
  | 'offhand'
  | 'head'
  | 'body'
  | 'hands'
  | 'feet'
  | 'neck'
  | 'ring'

export interface EquipEffect {
  type: 'attr' | 'cultivateMult' | 'checkBonus' | 'combat' | 'maxHp'
  key?: string
  value?: number
  tags?: string[]
}

export interface EquipDef {
  id: string
  name: string
  slot: EquipSlot
  grade: ArtGrade
  description: string
  effects: EquipEffect[]
  /** 最低炼气层或境界提示用 */
  minLayer?: number
}

export interface OwnedEquip {
  uid: string
  defId: string
  grade: ArtGrade
}

export type EquippedMap = Partial<Record<EquipSlot, string>>

export interface HeroDef {
  id: string
  name: string
  pathName: string
  title: string
  description: string
  resourceName: string
  resourceMax: number
  baseAttrs: Attrs
  startArtIds: string[]
  tags: string[]
  /** public/heroes 下头像，如 /heroes/rehan_anger.webp */
  portrait: string
  wikiPath?: string
}

export interface OriginDef {
  id: string
  name: string
  description: string
  age: number
  spiritStones: number
  attrDelta: Partial<Attrs>
  startArtIds?: string[]
}

export interface ChoiceOutcome {
  weight: number
  log: string
  cultivation?: number
  hp?: number
  stones?: number
  daoHeart?: number
  karma?: number
  artId?: string
  artGrade?: ArtGrade
  artFragment?: boolean
  equipId?: string
  equipGrade?: ArtGrade
  /** 额外装备（神级套装等一次给多件） */
  equipId2?: string
  equipGrade2?: ArtGrade
  injury?: number
  skillXp?: number
  death?: boolean
  flags?: string[]
}

export interface EventChoice {
  id: string
  text: string
  hint?: string
  requireFlag?: string
  requireHero?: string
  requireAttr?: { key: AttrKey; min: number }
  costStones?: number
  costResource?: number
  outcomes: ChoiceOutcome[]
}

export interface GameEvent {
  id: string
  title: string
  body: string
  tags: string[]
  minLayer?: number
  /** 最低大境界（含） */
  minRealm?: MajorRealm
  /** 最高大境界（含），用于分阶段奇遇 */
  maxRealm?: MajorRealm
  weight: number
  choices: EventChoice[]
  once?: boolean
}

export interface LogEntry {
  year: number
  month: number
  text: string
}

export interface PlayerState {
  seed: number
  heroId: string
  originId: string
  talent: TalentLoadout
  realm: MajorRealm
  /** 炼气 1-13；其它境用 minor */
  layer: number
  minor: MinorStage
  cultivation: number
  year: number
  month: number
  age: number
  lifespan: number
  hp: number
  maxHp: number
  mana: number
  maxMana: number
  attrs: Attrs
  daoHeart: number
  karma: number
  spiritStones: number
  injury: number
  heartDemonRisk: number
  pillResist: number
  resource: number
  caveLevel: number
  region: string
  arts: OwnedArt[]
  mainArtByRealm: MainArtSlots
  /** 背包中的装备（含已装备） */
  inventory: OwnedEquip[]
  /** 八部位 → 装备 uid */
  equipped: EquippedMap
  flags: string[]
  seenEventIds: string[]
  log: LogEntry[]
  dead: boolean
  won: boolean
  endingText?: string
}

export type ActionId =
  | 'dual_cult'
  | 'cultivate_6'
  | 'cultivate_12'
  | 'cultivate_art'
  | 'explore_low'
  | 'explore_mid'
  | 'explore_high'
  | 'duel'
  | 'trade'
  | 'heal'
  | 'breakthrough'
  | 'change_main_art'
