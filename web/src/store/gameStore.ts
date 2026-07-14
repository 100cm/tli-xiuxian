import { create } from 'zustand'
import type {
  ActionId,
  GameEvent,
  PendingResult,
  PlayerState,
  Screen,
  TalentLoadout,
} from '../domain/types'
import {
  canPickChoice,
  listActions,
  resolveChoice,
  runAction,
  runDualCultivation,
  setMainArt,
} from '../systems/actions'
import {
  runAllInEquip,
  runStoneBet,
  type GambleBetKind,
} from '../systems/gamble'
import type { DualPartnerId, DualPayMode } from '../content/dualCultivation'
import { createPlayer } from '../systems/createPlayer'
import { equipItem, sellEquipment, unequipSlot } from '../systems/equipment'
import { withGearDefaults } from '../systems/effects'
import { randomSeed, createRng } from '../systems/rng'
import { rollTalentLoadout } from '../systems/talentRoll'
import { EVENTS } from '../content/events'
import { formatRealm } from '../domain/realm'
import { getArt, GRADE_NAMES } from '../content/arts'
import { getEquipDef, SLOT_NAME } from '../content/equipment'
import type { EquipSlot } from '../domain/types'

const SAVE_KEY = 'tli-choose-save-v1'

const ACTION_TITLES: Partial<Record<ActionId, string>> = {
  dual_cult: '双修',
  gamble: '赌坊',
  cultivate_12: '苦修闭关（12月）',
  cultivate_art: '专修功法',
  explore_low: '谨慎探险',
  explore_mid: '寻常历练',
  explore_high: '冒进寻宝',
  duel: '交手 PK',
  trade: '坊市交易',
  heal: '疗伤静养',
  breakthrough: '冲击大境界',
  change_main_art: '更换主修',
}

interface Draft {
  seed: number
  heroId?: string
  originId?: string
  talent?: TalentLoadout
  mainArtId?: string
}

interface GameStore {
  screen: Screen
  draft: Draft
  player: PlayerState | null
  activeEvent: GameEvent | null
  /** 进入事件前的前序说明（如探险途中） */
  eventPrelude: string[]
  pendingResult: PendingResult | null
  toast: string[]
  setScreen: (s: Screen) => void
  startNew: () => void
  selectHero: (id: string) => void
  selectOrigin: (id: string) => void
  confirmTalent: () => void
  selectMainArt: (artId: string) => void
  beginPlay: () => void
  doAction: (id: ActionId) => void
  /** 选择天尊后执行双修；payMode 为灵石或折寿；不足时 false */
  performDualCult: (partnerId: DualPartnerId, payMode?: DualPayMode) => boolean
  /** 赌坊：灵石对赌 */
  performGambleBet: (stake: number, kind: GambleBetKind) => boolean
  /** 赌坊：梭哈赌装备 */
  performGambleAllIn: (stake: number) => boolean
  pickChoice: (choiceId: string) => void
  acknowledgeResult: () => void
  changeMainFromPlay: (artId: string) => void
  equipFromBag: (uid: string) => void
  unequip: (slot: EquipSlot) => void
  /** 出售装备（可卖穿戴中，会先卸下），返回获得灵石 */
  sellEquip: (uid: string) => number
  clearSaveAndTitle: () => void
  tryLoad: () => boolean
  persist: () => void
  getActionList: () => ReturnType<typeof listActions>
}

function loadRaw(): { player: PlayerState; screen: Screen } | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function summarizePlayerDelta(before: PlayerState, after: PlayerState): string[] {
  const lines: string[] = []
  const cultDiff = after.cultivation - before.cultivation
  // 进层时 cultivation 会减，用 log 里的自动进阶即可；这里补数值差提示
  if (after.layer !== before.layer) {
    lines.push(`境界：炼气第 ${before.layer} 层 → 第 ${after.layer} 层`)
  }
  if (after.minor !== before.minor || after.realm !== before.realm) {
    lines.push(
      `境界：${formatRealm(before.realm, before.layer, before.minor)} → ${formatRealm(after.realm, after.layer, after.minor)}`,
    )
  }
  if (cultDiff !== 0 && after.layer === before.layer && after.minor === before.minor && after.realm === before.realm) {
    lines.push(`修为 ${cultDiff > 0 ? '+' : ''}${cultDiff}（当前 ${after.cultivation}）`)
  }
  const hpDiff = after.hp - before.hp
  if (hpDiff !== 0) lines.push(`气血 ${hpDiff > 0 ? '+' : ''}${hpDiff}（${after.hp}/${after.maxHp}）`)
  const stDiff = after.spiritStones - before.spiritStones
  if (stDiff !== 0) lines.push(`灵石 ${stDiff > 0 ? '+' : ''}${stDiff}（现有 ${after.spiritStones}）`)
  const dh = after.daoHeart - before.daoHeart
  if (dh !== 0) lines.push(`道心 ${dh > 0 ? '+' : ''}${dh}`)
  if (after.injury !== before.injury) {
    lines.push(`伤势 ${before.injury} → ${after.injury}`)
  }
  // 新功法
  for (const a of after.arts) {
    const old = before.arts.find((x) => x.artId === a.artId)
    if (!old) {
      const def = getArt(a.artId)
      lines.push(
        `获得功法：${def?.name ?? a.artId}（${GRADE_NAMES[a.grade]}阶${a.complete ? '' : '·残篇'}）`,
      )
    } else if (!old.complete && a.complete) {
      const def = getArt(a.artId)
      lines.push(`功法成型：${def?.name ?? a.artId}`)
    } else if (a.skillLevel > old.skillLevel) {
      const def = getArt(a.artId)
      lines.push(`《${def?.name ?? a.artId}》升至 Lv${a.skillLevel}`)
    }
  }
  for (const f of after.flags) {
    if (!before.flags.includes(f)) {
      if (f === 'foundation_pill') lines.push('获得关键物品：【筑基丹】')
      if (f === 'core_materials') lines.push('获得关键物品：【结丹材料】')
      if (f === 'nascent_item') lines.push('获得关键物品：【婴变灵物】')
      if (f === 'soul_item') lines.push('获得关键物品：【化神神念】')
    }
  }
  const beforeInv = before.inventory ?? []
  const afterInv = after.inventory ?? []
  for (const item of afterInv) {
    if (!beforeInv.some((x) => x.uid === item.uid)) {
      const def = getEquipDef(item.defId)
      lines.push(
        `获得装备：${def?.name ?? item.defId}（${SLOT_NAME[def?.slot ?? 'weapon']}·${GRADE_NAMES[item.grade]}）`,
      )
    }
  }
  if (after.age !== before.age || after.year !== before.year || after.month !== before.month) {
    lines.push(
      `时光流逝 → 历法 ${after.year}年${after.month}月 · 虚岁 ${after.age.toFixed(1)}`,
    )
  }
  if (after.lifespan !== before.lifespan) {
    const d = after.lifespan - before.lifespan
    lines.push(
      `寿元上限 ${before.lifespan} → ${after.lifespan}（${d > 0 ? '+' : ''}${d}）`,
    )
  }
  return lines
}

function buildResultLines(messages: string[], delta: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const m of [...messages, ...delta]) {
    const t = m.trim()
    if (!t || seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out.length ? out : ['此事了结，暂无更多波澜。']
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: 'title',
  draft: { seed: randomSeed() },
  player: null,
  activeEvent: null,
  eventPrelude: [],
  pendingResult: null,
  toast: [],

  setScreen: (s) => set({ screen: s }),

  startNew: () => {
    localStorage.removeItem(SAVE_KEY)
    const seed = randomSeed()
    const rng = createRng(seed)
    const talent = rollTalentLoadout(rng)
    set({
      screen: 'hero',
      draft: { seed, talent },
      player: null,
      activeEvent: null,
      eventPrelude: [],
      pendingResult: null,
      toast: [],
    })
  },

  selectHero: (id) => {
    set({ draft: { ...get().draft, heroId: id }, screen: 'origin' })
  },

  selectOrigin: (id) => {
    set({ draft: { ...get().draft, originId: id }, screen: 'talent' })
  },

  confirmTalent: () => {
    set({ screen: 'main_art' })
  },

  selectMainArt: (artId) => {
    set({ draft: { ...get().draft, mainArtId: artId } })
  },

  beginPlay: () => {
    const d = get().draft
    if (!d.heroId || !d.originId || !d.talent || !d.mainArtId) return
    const player = createPlayer({
      seed: d.seed,
      heroId: d.heroId,
      originId: d.originId,
      talent: d.talent,
      mainArtId: d.mainArtId,
    })
    set({
      player,
      screen: 'play',
      toast: [],
      pendingResult: null,
      eventPrelude: [],
    })
    get().persist()
  },

  doAction: (id) => {
    const player = get().player
    if (!player || player.dead || player.won) return

    if (id === 'change_main_art') {
      set({
        screen: 'arts',
        pendingResult: {
          title: '更换主修',
          lines: ['请选择一部完整功法作为当前境界主修（将消耗 1 月）。'],
          next: 'arts' as const,
        },
      })
      // arts screen is enough; clear weird next
      set({ pendingResult: null, screen: 'arts', toast: ['选择一部完整功法作为主修（耗时 1 月）'] })
      return
    }

    // 双修 / 赌坊：由界面弹窗结算
    if (id === 'dual_cult' || id === 'gamble') {
      return
    }

    const result = runAction(player, id)
    const title = ACTION_TITLES[id] ?? '行动结果'
    const delta = summarizePlayerDelta(player, result.state)
    const lines = buildResultLines(result.messages, delta)

    if (result.state.dead || result.state.won) {
      set({
        player: result.state,
        activeEvent: null,
        eventPrelude: [],
        pendingResult: {
          title: result.state.won ? '道成' : '结局',
          lines: [...lines, result.state.endingText ?? ''].filter(Boolean),
          next: 'ending',
        },
        screen: 'result',
        toast: [],
      })
      get().persist()
      return
    }

    if (result.event) {
      // 先进入事件；结算在选项后展示
      set({
        player: result.state,
        activeEvent: result.event,
        eventPrelude: lines.length ? lines : [`你开始了「${title}」……`],
        pendingResult: null,
        screen: 'event',
        toast: [],
      })
      get().persist()
      return
    }

    // 无事件：必须展示结果再回年历
    let next: PendingResult['next'] = 'play'
    if (result.state.flags.includes('need_main_art')) {
      next = 'arts'
      lines.push('请为新境界选定主修功法。')
    }

    set({
      player: result.state,
      activeEvent: null,
      eventPrelude: [],
      pendingResult: { title: `${title} · 结果`, lines, next },
      screen: 'result',
      toast: [],
    })
    get().persist()
  },

  performDualCult: (partnerId, payMode = 'stones') => {
    const player = get().player
    if (!player || player.dead || player.won) return false

    const result = runDualCultivation(player, partnerId, payMode)
    const onlyWarn = result.messages.some(
      (m) => m.includes('灵石不足') || m.includes('寿元不足') || m.includes('无法与'),
    )

    if (onlyWarn) {
      set({
        pendingResult: {
          title: '双修 · 无法进行',
          lines: result.messages,
          next: 'play',
        },
        screen: 'result',
        toast: [],
      })
      return false
    }

    const delta = summarizePlayerDelta(player, result.state)
    const lines = buildResultLines(result.messages, delta)
    const next: PendingResult['next'] =
      result.state.dead || result.state.won
        ? 'ending'
        : result.state.flags.includes('need_main_art')
          ? 'arts'
          : 'play'

    if (next === 'arts') lines.push('请为新境界选定主修功法。')
    if (result.state.endingText && (result.state.dead || result.state.won)) {
      lines.push(result.state.endingText)
    }

    set({
      player: result.state,
      activeEvent: null,
      eventPrelude: [],
      pendingResult: {
        title: '双修 · 结果',
        lines,
        next,
      },
      screen: 'result',
      toast: [],
    })
    get().persist()
    return true
  },

  performGambleBet: (stake, kind) => {
    const player = get().player
    if (!player || player.dead || player.won) return false
    const result = runStoneBet(player, stake, kind)
    const onlyWarn = result.messages.some(
      (m) => m.includes('灵石不足') || m.includes('至少') || m.includes('下注至少'),
    )
    if (onlyWarn && !result.ended) {
      set({
        pendingResult: { title: '赌坊 · 无法下注', lines: result.messages, next: 'play' },
        screen: 'result',
        toast: [],
      })
      return false
    }
    const delta = summarizePlayerDelta(player, result.state)
    const lines = buildResultLines(result.messages, delta)
    set({
      player: result.state,
      activeEvent: null,
      eventPrelude: [],
      pendingResult: {
        title: result.ended ? '赌坊 · 结局' : '赌坊 · 对赌结果',
        lines: result.ended
          ? [...lines, result.state.endingText ?? ''].filter(Boolean)
          : lines,
        next: result.state.dead || result.state.won ? 'ending' : 'play',
      },
      screen: 'result',
      toast: [],
    })
    get().persist()
    return true
  },

  performGambleAllIn: (stake) => {
    const player = get().player
    if (!player || player.dead || player.won) return false
    const result = runAllInEquip(player, stake)
    const onlyWarn = result.messages.some(
      (m) => m.includes('灵石不足') || m.includes('至少押'),
    )
    if (onlyWarn && !result.ended) {
      set({
        pendingResult: { title: '赌坊 · 无法梭哈', lines: result.messages, next: 'play' },
        screen: 'result',
        toast: [],
      })
      return false
    }
    const delta = summarizePlayerDelta(player, result.state)
    const lines = buildResultLines(result.messages, delta)
    set({
      player: result.state,
      activeEvent: null,
      eventPrelude: [],
      pendingResult: {
        title: result.ended ? '赌坊 · 结局' : '赌坊 · 梭哈赌宝',
        lines: result.ended
          ? [...lines, result.state.endingText ?? ''].filter(Boolean)
          : lines,
        next: result.state.dead || result.state.won ? 'ending' : 'play',
      },
      screen: 'result',
      toast: [],
    })
    get().persist()
    return true
  },

  pickChoice: (choiceId) => {
    const { player, activeEvent } = get()
    if (!player || !activeEvent) return
    const choice = activeEvent.choices.find((c) => c.id === choiceId)
    if (!choice || !canPickChoice(player, choice)) return
    const result = resolveChoice(player, activeEvent, choice)
    const delta = summarizePlayerDelta(player, result.state)
    const lines = buildResultLines(
      [`【${activeEvent.title}】你选择：${choice.text}`, ...result.messages],
      delta,
    )

    if (result.state.dead || result.state.won) {
      set({
        player: result.state,
        activeEvent: null,
        eventPrelude: [],
        pendingResult: {
          title: result.state.won ? '事件结局 · 道成' : '事件结局',
          lines: [...lines, result.state.endingText ?? ''].filter(Boolean),
          next: 'ending',
        },
        screen: 'result',
        toast: [],
      })
      get().persist()
      return
    }

    let next: PendingResult['next'] = 'play'
    if (result.state.flags.includes('need_main_art')) {
      next = 'arts'
      lines.push('请为新境界选定主修功法。')
    }

    set({
      player: result.state,
      activeEvent: null,
      eventPrelude: [],
      pendingResult: {
        title: `【${activeEvent.title}】结果`,
        lines,
        next,
      },
      screen: 'result',
      toast: [],
    })
    get().persist()
  },

  acknowledgeResult: () => {
    const { pendingResult, player } = get()
    if (!pendingResult) {
      set({ screen: 'play' })
      return
    }
    const next = pendingResult.next
    set({
      pendingResult: null,
      eventPrelude: [],
      toast: [],
      screen:
        next === 'ending'
          ? 'ending'
          : next === 'arts'
            ? 'arts'
            : player?.dead || player?.won
              ? 'ending'
              : 'play',
    })
    get().persist()
  },

  changeMainFromPlay: (artId) => {
    const player = get().player
    if (!player) return
    const spend = !player.flags.includes('need_main_art')
    const next = setMainArt(player, artId, spend)
    const def = getArt(artId)
    const lines = [
      `立定主修：《${def?.name ?? artId}》`,
      spend ? '耗时 1 月。' : '新境界立修，未额外耗时。',
      ...summarizePlayerDelta(player, next),
    ]
    if (next.dead) {
      set({
        player: next,
        pendingResult: {
          title: '更换主修 · 结果',
          lines: [...lines, next.endingText ?? '寿元耗尽'],
          next: 'ending',
        },
        screen: 'result',
      })
    } else {
      set({
        player: next,
        pendingResult: {
          title: '更换主修 · 结果',
          lines,
          next: 'play',
        },
        screen: 'result',
      })
    }
    get().persist()
  },

  equipFromBag: (uid) => {
    const player = get().player
    if (!player) return
    const next = equipItem(withGearDefaults(player), uid)
    set({ player: next })
    get().persist()
  },

  unequip: (slot) => {
    const player = get().player
    if (!player) return
    const next = unequipSlot(withGearDefaults(player), slot)
    set({ player: next })
    get().persist()
  },

  sellEquip: (uid) => {
    const player = get().player
    if (!player) return 0
    const { state, price } = sellEquipment(withGearDefaults(player), uid)
    if (price <= 0) return 0
    set({
      player: {
        ...state,
        log: [
          {
            year: state.year,
            month: state.month,
            text: `出售装备，灵石 +${price}（现有 ${state.spiritStones}）。`,
          },
          ...state.log,
        ].slice(0, 80),
      },
    })
    get().persist()
    return price
  },

  clearSaveAndTitle: () => {
    localStorage.removeItem(SAVE_KEY)
    set({
      screen: 'title',
      player: null,
      activeEvent: null,
      eventPrelude: [],
      pendingResult: null,
      draft: { seed: randomSeed() },
      toast: [],
    })
  },

  tryLoad: () => {
    const data = loadRaw()
    if (!data?.player) return false
    if (data.player.dead || data.player.won) {
      localStorage.removeItem(SAVE_KEY)
      return false
    }
    set({
      player: withGearDefaults(data.player),
      screen: 'play',
      activeEvent: null,
      eventPrelude: [],
      pendingResult: null,
      toast: [],
    })
    return true
  },

  persist: () => {
    const { player, screen } = get()
    if (!player || player.dead || player.won) {
      localStorage.removeItem(SAVE_KEY)
      return
    }
    const saveScreen =
      screen === 'event' || screen === 'result' || screen === 'arts' || screen === 'log'
        ? 'play'
        : screen
    localStorage.setItem(SAVE_KEY, JSON.stringify({ player, screen: saveScreen }))
  },

  getActionList: () => {
    const p = get().player
    if (!p) return []
    return listActions(p)
  },
}))

export function debugForceEvent(id: string) {
  const ev = EVENTS.find((e) => e.id === id)
  if (ev) useGameStore.setState({ activeEvent: ev, screen: 'event' })
}
