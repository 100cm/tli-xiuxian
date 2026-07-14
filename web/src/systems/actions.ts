import { EVENTS } from '../content/events'
import { MARKET_EVENTS } from '../content/eventsMarket'
import { getArt, GRADE_NAMES } from '../content/arts'
import { getHero } from '../content/heroes'
import {
  BREAKTHROUGH_FLAG,
  breakthroughReady,
  cultivationNeed,
  eventMatchesRealm,
  formatRealm,
  getBreakthroughBlockers,
  LIFESPAN,
  nextMajor,
  nextMinor,
  PLAYABLE_MAX_REALM,
  realmIndex,
  REALM_NAMES,
} from '../domain/realm'
import type {
  ActionId,
  ChoiceOutcome,
  EventChoice,
  GameEvent,
  PlayerState,
} from '../domain/types'
import {
  applySkillXp,
  cultivateMultiplier,
  describeMainArtPower,
  displayAttrs,
  grantArt,
  hasChoiceFlag,
  withGearDefaults,
} from './effects'
import { grantEquipment } from './equipment'
import { createRng, type Rng } from './rng'
import { hasTalentRule } from './talentRoll'
import { EQUIPMENT } from '../content/equipment'
import {
  dualCultCost,
  dualCultLifeCost,
  getDualPartner,
  type DualPartnerId,
  type DualPayMode,
} from '../content/dualCultivation'

export interface ActionResult {
  state: PlayerState
  messages: string[]
  event?: GameEvent
  ended?: boolean
}

function pushLog(state: PlayerState, text: string): PlayerState {
  return {
    ...state,
    log: [
      { year: state.year, month: state.month, text },
      ...state.log,
    ].slice(0, 80),
  }
}

function diffAttrsLine(
  before: { str: number; agi: number; int: number; con: number; luck: number; will: number },
  after: { str: number; agi: number; int: number; con: number; luck: number; will: number },
): string {
  const names = {
    str: '攻',
    agi: '敏',
    int: '智',
    con: '体',
    luck: '运',
    will: '志',
  } as const
  const parts: string[] = []
  for (const k of Object.keys(names) as (keyof typeof names)[]) {
    const d = after[k] - before[k]
    if (d !== 0) parts.push(`${names[k]}${d > 0 ? '+' : ''}${d}`)
  }
  return parts.join(' ')
}

function advanceTime(state: PlayerState, months: number, rng: Rng): PlayerState {
  let { year, month, age, lifespan, dead, endingText } = state
  let exploreCut = 0
  if (hasTalentRule(state.talent, 'explore_faster')) {
    exploreCut = 0 // applied at caller for explore
  }
  void exploreCut
  void rng

  month += months
  while (month > 12) {
    month -= 12
    year += 1
    age += 1
  }
  // 按月折算年龄
  age = state.age + months / 12

  if (age >= lifespan) {
    dead = true
    endingText = `寿元耗尽。享年 ${Math.floor(age)}，止步于 ${formatRealm(state.realm, state.layer, state.minor)}。`
  }

  return { ...state, year, month: Math.floor(month), age, dead, endingText }
}

function clampState(s: PlayerState): PlayerState {
  return {
    ...s,
    hp: Math.max(0, Math.min(s.maxHp, s.hp)),
    daoHeart: Math.max(0, Math.min(100, s.daoHeart)),
    spiritStones: Math.max(0, s.spiritStones),
    injury: Math.max(0, s.injury),
    heartDemonRisk: Math.max(0, s.heartDemonRisk),
  }
}

function tryCultivationGain(state: PlayerState, raw: number): {
  state: PlayerState
  messages: string[]
} {
  const messages: string[] = []
  let s = { ...state }
  const gain = Math.round(raw)
  if (gain > 0) {
    s.cultivation += gain
    messages.push(`修为 +${gain}`)
  }

  let guard = 0
  while (guard++ < 20) {
    const need = cultivationNeed(s.realm, s.layer, s.minor)
    if (s.cultivation < need) break

    if (s.realm === 'qi_refining' && s.layer < 13) {
      s.cultivation -= need
      s.layer += 1
      messages.push(`✦ 自动进阶：炼气第 ${s.layer} 层！`)
      continue
    }

    // 筑基～化神：小层次自动进阶
    if (
      s.realm !== 'qi_refining' &&
      s.minor !== 'perfect' &&
      realmIndex(s.realm) <= realmIndex(PLAYABLE_MAX_REALM)
    ) {
      s.cultivation -= need
      s.minor = nextMinor(s.minor)
      const stageName =
        s.minor === 'mid'
          ? '中期'
          : s.minor === 'late'
            ? '后期'
            : s.minor === 'perfect'
              ? '大圆满'
              : '初期'
      messages.push(`✦ 自动进阶：${REALM_NAMES[s.realm]}${stageName}！`)
      continue
    }
    // 满层/圆满后卡修为等突破
    s.cultivation = need
    break
  }

  return { state: s, messages }
}

function isMarketEvent(e: GameEvent): boolean {
  return e.tags.includes('market')
}

/** 历练/探险/交手：不含坊市专属 */
function pickExploreEvent(
  state: PlayerState,
  rng: Rng,
  tagsPrefer?: string[],
): GameEvent | undefined {
  const pool = EVENTS.filter((e) => {
    if (isMarketEvent(e)) return false
    // 纯坊市交易向（只有 trade 且无 adventure/combat 等）也不进历练
    const tags = e.tags
    if (
      tags.includes('trade') &&
      !tags.some((t) =>
        ['adventure', 'combat', 'cultivate', 'risk', 'loot', 'social', 'demon', 'sect', 'hunt'].includes(
          t,
        ),
      ) &&
      !tags.some((t) => t.startsWith('stage:'))
    ) {
      return false
    }
    if (e.once && state.seenEventIds.includes(e.id)) return false
    if (e.minLayer && state.realm === 'qi_refining' && state.layer < e.minLayer) return false
    if (!eventMatchesRealm(state.realm, e.minRealm, e.maxRealm)) return false
    return true
  }).map((e) => {
    let w = e.weight
    if (tagsPrefer) {
      for (const t of tagsPrefer) {
        if (e.tags.includes(t)) w *= 1.45
      }
    }
    if (e.minRealm === state.realm && e.maxRealm === state.realm) w *= 1.35
    if (e.tags.includes(`stage:${state.realm}`)) w *= 1.5
    // 历练池降低纯 trade 权重
    if (e.tags.includes('trade') && !e.tags.includes('adventure') && !e.tags.includes('combat')) {
      w *= 0.35
    }
    return { ...e, weight: w }
  })
  if (!pool.length) return undefined
  return rng.weighted(pool)
}

/** 坊市专属池：天材地宝 / 突破材料 / 装备，高价灵石 */
function pickMarketEvent(state: PlayerState, rng: Rng): GameEvent | undefined {
  const pool = MARKET_EVENTS.filter((e) => {
    if (e.once && state.seenEventIds.includes(e.id)) return false
    if (e.minLayer && state.realm === 'qi_refining' && state.layer < e.minLayer) return false
    if (!eventMatchesRealm(state.realm, e.minRealm, e.maxRealm)) return false
    return true
  }).map((e) => {
    let w = e.weight
    if (e.minRealm === state.realm || e.maxRealm === state.realm) w *= 1.25
    return { ...e, weight: w }
  })
  if (!pool.length) return undefined
  return rng.weighted(pool)
}

export function listActions(state: PlayerState): {
  id: ActionId
  label: string
  hint: string
  disabled?: boolean
  reason?: string
}[] {
  const bt = breakthroughReady(
    state.realm,
    state.layer,
    state.minor,
    state.cultivation,
    state.flags,
  )
  return [
    {
      id: 'dual_cult',
      label: '双修',
      hint: '选天尊·灵石或折寿·疗伤涨修为功法',
    },
    { id: 'cultivate_6', label: '闭关·6月', hint: '稳定修为' },
    { id: 'cultivate_12', label: '苦修·年', hint: '高收益，心魔风险' },
    {
      id: 'cultivate_art',
      label: '专修',
      hint: '提升主修等级·3月',
      disabled: !state.mainArtByRealm[state.realm],
      reason: '未设置主修',
    },
    { id: 'explore_low', label: '探险·慎', hint: '低风险·2月' },
    { id: 'explore_mid', label: '历练', hint: '中等风险·3月' },
    { id: 'explore_high', label: '探险·险', hint: '高风险·2月' },
    {
      id: 'duel',
      label: '交手',
      hint: 'PK 夺宝·2月',
      disabled: state.realm === 'qi_refining' && state.layer < 4,
      reason: '炼气 4 层后解锁',
    },
    { id: 'trade', label: '坊市', hint: '天材法器·耗巨资·1月' },
    {
      id: 'heal',
      label: '疗伤',
      hint: '静养·2月',
      disabled: state.injury <= 0 && state.hp >= state.maxHp,
      reason: '状态良好',
    },
    {
      id: 'breakthrough',
      label: bt
        ? state.realm === 'soul_transformation'
          ? '证道✓'
          : '突破✓'
        : state.realm === 'soul_transformation'
          ? '证道'
          : '突破',
      hint: bt
        ? state.realm === 'soul_transformation'
          ? '化神圆满·可通关'
          : '条件已齐·天劫风险'
        : '条件未齐',
      disabled: !bt,
      reason: !bt
        ? getBreakthroughBlockers(
            state.realm,
            state.layer,
            state.minor,
            state.cultivation,
            state.flags,
          ).join('；') || '条件未满足'
        : state.realm === 'soul_transformation'
          ? '证道化神通关'
          : '冲击大境界',
    },
    {
      id: 'change_main_art',
      label: '换主修',
      hint: '耗时1月',
    },
  ]
}

export function runAction(state: PlayerState, actionId: ActionId): ActionResult {
  if (state.dead || state.won) {
    return { state, messages: ['本局已结束。'], ended: true }
  }

  const rng = createRng((state.seed + state.year * 100 + state.month * 10 + state.log.length) >>> 0)
  const messages: string[] = []
  let s = withGearDefaults({ ...state })

  const applyMonths = (m: number) => {
    s = advanceTime(s, m, rng)
  }

  if (actionId === 'dual_cult') {
    // 由 UI 选择天尊后走 runDualCultivation
    return {
      state: s,
      messages: ['请选择双修天尊'],
    }
  }

  if (actionId.startsWith('cultivate_') && actionId !== 'cultivate_art') {
    const months = actionId === 'cultivate_6' ? 6 : 12
    applyMonths(months)
    if (s.dead) {
      s = pushLog(s, s.endingText!)
      return { state: clampState(s), messages: [s.endingText!], ended: true }
    }

    const mult = cultivateMultiplier(s)
    const base = months === 6 ? 42 : 95
    const gain = base * mult * (0.9 + rng.next() * 0.2)
    s.heartDemonRisk += months === 12 ? 2 : 1
    if (months === 12 && rng.next() < 0.15 + s.heartDemonRisk * 0.01) {
      const ev = EVENTS.find((e) => e.id === 'closed_door_insight')
      s = pushLog(s, `苦修 ${months} 个月，异象陡生……`)
      return { state: clampState(s), messages: [`闭关 ${months} 月`], event: ev }
    }

    const r = tryCultivationGain(s, gain)
    s = r.state
    messages.push(`你闭关 ${months} 个月，调息炼气。`, ...r.messages)
    s = pushLog(s, `闭关 ${months} 个月。${r.messages.join(' ')}`)
    // 小概率普通事件（不含坊市）
    if (rng.next() < 0.12) {
      const ev = pickExploreEvent(s, rng, ['cultivate'])
      if (ev) {
        messages.push('闭关之中，心神忽有异动——')
        return { state: clampState(s), messages, event: ev }
      }
    }
    return { state: clampState(s), messages }
  }

  if (actionId === 'cultivate_art') {
    applyMonths(3)
    if (s.dead) {
      s = pushLog(s, s.endingText!)
      return { state: clampState(s), messages: [s.endingText!], ended: true }
    }
    const mainId = s.mainArtByRealm[s.realm]
    if (!mainId) return { state: s, messages: ['无主修功法'] }
    const art = getArt(mainId)
    const beforeLv = s.arts.find((a) => a.artId === mainId)?.skillLevel ?? 1
    const beforeXp = s.arts.find((a) => a.artId === mainId)?.skillXp ?? 0
    const attrsBefore = displayAttrs(s)

    // 专修：熟练度为主；升级会提高功法提供的属性
    const xpGain = 40 + rng.int(0, 20)
    s.arts = applySkillXp(s.arts, mainId, xpGain)
    const owned = s.arts.find((a) => a.artId === mainId)
    const afterLv = owned?.skillLevel ?? 1
    const afterXp = owned?.skillXp ?? 0

    // 修为收益：专修略少于纯闭关，但仍有
    const r = tryCultivationGain(s, 12 * cultivateMultiplier(s))
    s = r.state
    const attrsAfter = displayAttrs(s)

    messages.push(`你专修《${art?.name ?? mainId}》三月。`)
    messages.push(`功法熟练度 +${xpGain}`)
    if (afterLv > beforeLv) {
      messages.push(`✦ 功法突破：Lv${beforeLv} → Lv${afterLv}`)
      const attrDiff = diffAttrsLine(attrsBefore, attrsAfter)
      if (attrDiff) messages.push(`属性因功法强化：${attrDiff}`)
      else messages.push('功法效果增强（检定/闭关效率等）')
    } else {
      // 未升级：说明还在攒熟练
      const need = 28 + afterLv * 14
      messages.push(
        `等级仍为 Lv${afterLv}（熟练 ${afterXp}/${need}，满可升级）`,
      )
      messages.push('提示：专修升级后会提高主修提供的属性与闭关效率')
    }
    messages.push(...r.messages)
    messages.push(describeMainArtPower(s))

    s = pushLog(
      s,
      `专修《${art?.name}》：${afterLv > beforeLv ? `Lv${beforeLv}→${afterLv}` : `熟练+${xpGain}`}；${r.messages.join(' ')}`,
    )
    void beforeXp
    return { state: clampState(s), messages }
  }

  if (actionId.startsWith('explore_')) {
    let months = actionId === 'explore_low' ? 2 : actionId === 'explore_mid' ? 3 : 2
    if (hasTalentRule(s.talent, 'explore_faster')) months = Math.max(1, months - 1)
    applyMonths(months)
    if (s.dead) {
      s = pushLog(s, s.endingText!)
      return { state: clampState(s), messages: [s.endingText!], ended: true }
    }
    s.heartDemonRisk = Math.max(0, s.heartDemonRisk - 1)
    const risk = actionId === 'explore_low' ? 'low' : actionId === 'explore_mid' ? 'mid' : 'high'
    // 直接给一点修为再进事件
    const base = risk === 'low' ? 8 : risk === 'mid' ? 14 : 20
    const r = tryCultivationGain(s, base * cultivateMultiplier(s) * 0.5)
    s = r.state
    const stageTag = `stage:${s.realm}`
    const prefer =
      risk === 'high'
        ? ['adventure', 'risk', 'loot', 'combat', stageTag, 'breakthrough']
        : risk === 'mid'
          ? ['adventure', 'loot', stageTag, 'combat']
          : ['adventure', 'social', 'cultivate', stageTag]
    const ev = pickExploreEvent(s, rng, prefer)
    s = pushLog(s, `外出探险（${risk === 'low' ? '谨慎' : risk === 'mid' ? '寻常' : '冒进'}）。`)
    const riskName = risk === 'low' ? '谨慎' : risk === 'mid' ? '寻常' : '冒进'
    if (!ev) {
      const stoneGain = rng.int(2, 10)
      s.spiritStones += stoneGain
      messages.push(
        `你以【${riskName}】方式外出历练，耗时 ${months} 月。`,
        '此行未遇大机缘，沿途略有收获。',
        ...r.messages,
        `拾得灵石 +${stoneGain}`,
      )
      // 平淡探险也有机会捡到凡/黄装
      if (rng.next() < (risk === 'high' ? 0.35 : risk === 'mid' ? 0.22 : 0.12)) {
        const pool = EQUIPMENT.filter((e) =>
          risk === 'high' ? e.grade !== 'mortal' : e.grade === 'mortal' || e.grade === 'yellow',
        )
        const def = rng.pick(pool)
        const granted = grantEquipment(s, def.id, def.grade)
        s = granted.state
        messages.push(granted.log)
      }
      s = pushLog(s, `探险平淡：${messages.filter((m) => m.startsWith('修为') || m.includes('进阶') || m.includes('获得')).join(' ')} 灵石+${stoneGain}`)
      return { state: clampState(s), messages }
    }
    messages.push(
      `你以【${riskName}】方式外出历练，耗时 ${months} 月。`,
      ...r.messages,
      '途中忽有变故——',
    )
    return { state: clampState(s), messages, event: ev }
  }

  if (actionId === 'duel') {
    applyMonths(2)
    if (s.dead) {
      s = pushLog(s, s.endingText!)
      return { state: clampState(s), messages: [s.endingText!], ended: true }
    }
    const ev =
      pickExploreEvent(s, rng, ['combat']) ?? EVENTS.find((e) => e.id === 'rogue_duel' && !isMarketEvent(e))
    s = pushLog(s, '你寻人交手……')
    return {
      state: clampState(s),
      messages: ['你耗时 2 月寻访可交手的修士。', '终于撞见机缘（或杀机）——'],
      event: ev,
    }
  }

  if (actionId === 'trade') {
    applyMonths(1)
    if (s.dead) {
      s = pushLog(s, s.endingText!)
      return { state: clampState(s), messages: [s.endingText!], ended: true }
    }
    // 坊市独立池：只出高价天材/材料/装备摊
    const ev =
      pickMarketEvent(s, rng) ??
      MARKET_EVENTS.find((e) => eventMatchesRealm(s.realm, e.minRealm, e.maxRealm))
    s = pushLog(s, '你前往坊市宝肆。')
    return {
      state: clampState(s),
      messages: [
        '你花费 1 月往来坊市。',
        '此处不讲奇遇江湖，只论天材地宝与法器材料——皆需大笔灵石。',
      ],
      event: ev,
    }
  }

  if (actionId === 'heal') {
    applyMonths(2)
    if (s.dead) {
      s = pushLog(s, s.endingText!)
      return { state: clampState(s), messages: [s.endingText!], ended: true }
    }
    const beforeHp = s.hp
    const beforeInjury = s.injury
    s.hp = Math.min(s.maxHp, s.hp + 25 + displayAttrs(s).con * 2)
    s.injury = Math.max(0, s.injury - 1)
    messages.push(
      '你闭门静养 2 月，调息疗伤。',
      `气血 ${beforeHp} → ${s.hp}`,
      beforeInjury > s.injury ? `伤势减轻：${beforeInjury} → ${s.injury}` : '伤势已无大碍或本就无伤。',
    )
    s = pushLog(s, messages.join(' '))
    return { state: clampState(s), messages }
  }

  if (actionId === 'breakthrough') {
    return runBreakthrough(s, rng)
  }

  if (actionId === 'change_main_art') {
    // UI 侧处理选功法；此处仅占位
    return {
      state: s,
      messages: ['请在功法页选择新主修（将消耗 1 月）'],
    }
  }

  return { state: s, messages: ['未知行动'] }
}

function runBreakthrough(state: PlayerState, rng: Rng): ActionResult {
  let s = advanceTime({ ...withGearDefaults(state) }, 2, rng)
  const messages: string[] = []
  if (s.dead) {
    s = pushLog(s, s.endingText!)
    return { state: clampState(s), messages: [s.endingText!], ended: true }
  }

  // 化神圆满：证道通关（无下一境）
  if (s.realm === 'soul_transformation' && s.minor === 'perfect') {
    const attrs = displayAttrs(s)
    let chance = 50 + attrs.will * 4 + attrs.con + attrs.luck
    chance -= s.injury * 6
    chance -= Math.max(0, 50 - s.daoHeart) * 0.4
    chance = Math.min(95, Math.max(15, chance))
    const roll = rng.int(1, 100)
    if (roll <= chance) {
      s.won = true
      s.endingText = `化神大圆满，神游太虚，证道有成！（通关）\n${s.talent.professionName}·${s.talent.core.name} 伴你一路。历法 ${s.year} 年。`
      messages.push('九天神光倾泻——你稳住神台，化神之境彻底稳固！', s.endingText)
      s = pushLog(s, '证道化神，通关。')
      return { state: clampState(s), messages, ended: true }
    }
    s.hp -= 40
    s.injury += 2
    s.daoHeart -= 8
    const msg = `证道受挫，神台震荡。（${chance}% / 掷 ${roll}）`
    if (s.hp <= 0) {
      return failDeath(s, messages, msg, `证道失败，神魂溃散。止步化神。`)
    }
    messages.push(msg)
    s = pushLog(s, msg)
    return { state: clampState(s), messages }
  }

  const next = nextMajor(s.realm)
  if (!next) {
    return { state: clampState(s), messages: ['已无更高可玩境界。'] }
  }

  const attrs = displayAttrs(s)
  let chance = 42 + attrs.will * 3 + attrs.con * 2 + attrs.luck
  chance -= s.injury * 8
  chance -= Math.max(0, 40 - s.daoHeart) * 0.5
  // 境界越高越难
  chance -= realmIndex(s.realm) * 4
  const flag = BREAKTHROUGH_FLAG[s.realm]
  if (flag && s.flags.includes(flag)) chance += 18
  chance = Math.min(90, Math.max(8, chance))

  const roll = rng.int(1, 100)
  const success = roll <= chance
  const fromName = REALM_NAMES[s.realm]
  const toName = REALM_NAMES[next]

  if (success) {
    if (flag) s.flags = s.flags.filter((f) => f !== flag)
    s.realm = next
    s.layer = 0
    s.minor = 'early'
    s.cultivation = 0
    s.lifespan = LIFESPAN[next]
    s.maxHp += 25 + realmIndex(next) * 12
    s.hp = s.maxHp
    s.maxMana += 15 + realmIndex(next) * 8
    s.mana = s.maxMana
    s.flags = [...s.flags, 'need_main_art']
    const msg = `天劫散去！你成功自【${fromName}】踏入【${toName}】！（约 ${chance}% / 掷 ${roll}）`
    messages.push(msg, `寿元上限延至 ${s.lifespan} 岁。请为新境界选定主修功法。`)
    s = pushLog(s, msg)
    return { state: clampState(s), messages }
  }

  // 失败
  const dmg = 20 + realmIndex(s.realm) * 8
  s.hp -= dmg
  s.injury += 1 + (realmIndex(s.realm) >= 2 ? 1 : 0)
  s.cultivation = Math.floor(s.cultivation * 0.55)
  s.daoHeart -= 5 + realmIndex(s.realm)
  const msg = `冲击【${toName}】失败，雷劫重创。（约 ${chance}% / 掷 ${roll}）`
  if (s.hp <= 0) {
    return failDeath(
      s,
      messages,
      msg,
      `${fromName}突破失败，身死道消。止步于 ${formatRealm(state.realm, state.layer, state.minor)}。`,
    )
  }
  messages.push(msg)
  s = pushLog(s, msg)
  return { state: clampState(s), messages }
}

function failDeath(
  s: PlayerState,
  messages: string[],
  msg: string,
  ending: string,
): ActionResult {
  if (hasTalentRule(s.talent, 'second_wind') && !s.flags.includes('second_wind_used')) {
    s.hp = 1
    s.flags = [...s.flags, 'second_wind_used']
    messages.push(msg, '天赋【坚强】触发，你留下一口气！')
    s = pushLog(s, messages.join(' '))
    return { state: clampState(s), messages }
  }
  s.dead = true
  s.endingText = ending
  s = pushLog(s, ending)
  return { state: clampState(s), messages: [msg, ending], ended: true }
}

export function resolveChoice(
  state: PlayerState,
  event: GameEvent,
  choice: EventChoice,
): ActionResult {
  const rng = createRng(
    (state.seed + event.id.length * 17 + choice.id.length * 31 + state.year * 3) >>> 0,
  )
  let s = { ...withGearDefaults(state), flags: [...state.flags] }
  const messages: string[] = []

  if (choice.costStones) {
    if (s.spiritStones < choice.costStones) {
      return { state, messages: ['灵石不足'] }
    }
    s.spiritStones -= choice.costStones
  }

  // 属性需求失败软处理：仍可选但在 outcome 外已由 UI 锁
  const outcome = pickOutcome(choice.outcomes, rng, s)
  s = applyOutcome(s, outcome, messages, rng)
  s.seenEventIds = [...new Set([...s.seenEventIds, event.id])]
  s = pushLog(s, `【${event.title}】${choice.text} → ${outcome.log}`)

  if (s.hp <= 0 && !s.dead) {
    if (hasTalentRule(s.talent, 'second_wind') && !s.flags.includes('second_wind_used')) {
      s.hp = 1
      s.flags.push('second_wind_used')
      messages.push('天赋【坚强】救你一命！')
    } else {
      s.dead = true
      s.endingText = `身死道消。止步于 ${formatRealm(s.realm, s.layer, s.minor)}。`
      messages.push(s.endingText)
    }
  }

  if (s.daoHeart <= 0) {
    s.dead = true
    s.endingText = '道心崩溃，心魔反噬而亡。'
    messages.push(s.endingText)
  }

  return {
    state: clampState(s),
    messages: [outcome.log, ...messages],
    ended: s.dead || s.won,
  }
}

function pickOutcome(outcomes: ChoiceOutcome[], rng: Rng, state: PlayerState): ChoiceOutcome {
  let list = outcomes.map((o) => ({ ...o }))
  if (hasTalentRule(state.talent, 'extreme_rolls')) {
    // 极端化：提高最高与最低权重
    const sorted = [...list].sort((a, b) => a.weight - b.weight)
    if (sorted.length >= 2) {
      sorted[0].weight *= 1.5
      sorted[sorted.length - 1].weight *= 1.5
      list = sorted
    }
  }
  return rng.weighted(list)
}

function applyOutcome(
  state: PlayerState,
  o: ChoiceOutcome,
  messages: string[],
  rng: Rng,
): PlayerState {
  let s = { ...state }
  if (o.cultivation) {
    const r = tryCultivationGain(s, o.cultivation)
    s = r.state
    messages.push(...r.messages)
  }
  if (o.hp) s.hp += o.hp
  if (o.stones) s.spiritStones += o.stones
  if (o.daoHeart) s.daoHeart += o.daoHeart
  if (o.karma) s.karma += o.karma
  if (o.injury != null && o.injury !== 0) {
    s.injury = Math.max(0, s.injury + o.injury)
  }
  if (o.flags) s.flags = [...new Set([...s.flags, ...o.flags])]
  if (o.death) {
    s.hp = 0
  }
  if (o.artId) {
    const g = o.artGrade ?? 'yellow'
    const res = grantArt(s.arts, o.artId, g, !!o.artFragment)
    s.arts = res.arts
    const name = getArt(o.artId)?.name ?? o.artId
    messages.push(`${res.log}（${name}·${GRADE_NAMES[g]}${o.artFragment ? '·残' : ''}）`)
  }
  if (o.equipId) {
    const granted = grantEquipment(s, o.equipId, o.equipGrade)
    s = granted.state
    messages.push(granted.log)
  }
  if (o.equipId2) {
    const granted2 = grantEquipment(s, o.equipId2, o.equipGrade2)
    s = granted2.state
    messages.push(granted2.log)
  }
  if (!o.equipId && !o.equipId2 && rng.next() < 0.18 && (o.cultivation || o.stones || o.artId)) {
    // 有收获的结算附带小概率掉装
    const def = rng.pick(EQUIPMENT.filter((e) => e.grade === 'yellow' || e.grade === 'mortal'))
    const granted = grantEquipment(s, def.id, def.grade)
    s = granted.state
    messages.push(granted.log)
  }
  if (o.skillXp) {
    const main = s.mainArtByRealm[s.realm]
    if (main) s.arts = applySkillXp(s.arts, main, o.skillXp)
  }
  return s
}

export function canPickChoice(state: PlayerState, choice: EventChoice): boolean {
  if (choice.costStones && state.spiritStones < choice.costStones) return false
  if (choice.requireHero && state.heroId !== choice.requireHero) return false
  if (choice.requireFlag && !hasChoiceFlag(state, choice.requireFlag)) return false
  if (choice.requireAttr) {
    const a = displayAttrs(state)
    if (a[choice.requireAttr.key] < choice.requireAttr.min) return false
  }
  return true
}

export function setMainArt(state: PlayerState, artId: string, spendMonth: boolean): PlayerState {
  const owned = state.arts.find((a) => a.artId === artId && a.complete)
  if (!owned) return state
  let s = {
    ...state,
    mainArtByRealm: { ...state.mainArtByRealm, [state.realm]: artId },
    flags: state.flags.filter((f) => f !== 'need_main_art'),
  }
  if (spendMonth) {
    const rng = createRng(s.seed + s.year)
    s = advanceTime(s, 1, rng)
  }
  const name = getArt(artId)?.name ?? artId
  s = pushLog(s, `立定主修功法：《${name}》`)
  return clampState(s)
}

export function getHeroResourceLabel(state: PlayerState): string {
  return getHero(state.heroId).resourceName
}

/**
 * 双修：耗时 3 月，代价可选灵石或寿元，按天尊品级
 * - 修为：高于原闭关 3 月
 * - 疗伤回血
 * - 主修功法熟练度大涨
 * - 寿元支付：永久缩短寿元上限（折寿），收益与灵石版相同
 */
export function runDualCultivation(
  state: PlayerState,
  partnerId: DualPartnerId,
  payMode: DualPayMode = 'stones',
): ActionResult {
  if (state.dead || state.won) {
    return { state, messages: ['本局已结束。'], ended: true }
  }

  const partner = getDualPartner(partnerId)
  const rng = createRng(
    (state.seed +
      state.year * 97 +
      state.month * 13 +
      partnerId.length * 7 +
      state.log.length +
      (payMode === 'lifespan' ? 333 : 0)) >>>
      0,
  )
  let s = withGearDefaults({ ...state })
  const messages: string[] = []

  const stoneCost = dualCultCost(partner.baseCost, realmIndex(s.realm))
  const lifeCost = dualCultLifeCost(partner.baseLifeCost, realmIndex(s.realm))
  // 三月后年龄约 +0.25，预留一点余量
  const lifeAfterMonths = s.age + 3 / 12
  const remainingLife = s.lifespan - lifeAfterMonths

  if (payMode === 'stones') {
    if (s.spiritStones < stoneCost) {
      return {
        state,
        messages: [
          `灵石不足：与【${partner.name}】双修需 ${stoneCost} 灵石（当前 ${s.spiritStones}）。可改选「折寿双修」。`,
        ],
      }
    }
    s.spiritStones -= stoneCost
  } else {
    if (remainingLife < lifeCost + 0.5) {
      return {
        state,
        messages: [
          `寿元不足：与【${partner.name}】折寿双修需折寿 ${lifeCost} 年（当前余寿约 ${Math.max(0, s.lifespan - s.age).toFixed(1)} 年，且须留活路）。可改选灵石支付。`,
        ],
      }
    }
    const beforeCap = s.lifespan
    s.lifespan = Math.max(Math.ceil(lifeAfterMonths + 0.5), s.lifespan - lifeCost)
    if (s.lifespan >= beforeCap) {
      return {
        state,
        messages: [`寿元已不足再折，无法与【${partner.name}】以寿换修。`],
      }
    }
  }

  // 耗时 3 月
  s = advanceTime(s, 3, rng)
  if (s.dead) {
    s = pushLog(s, s.endingText!)
    return { state: clampState(s), messages: [s.endingText!], ended: true }
  }

  const attrsBefore = displayAttrs(s)
  const beforeHp = s.hp
  const beforeInjury = s.injury

  // 疗伤回血
  const healHp = Math.round(s.maxHp * partner.healHpPct)
  s.hp = Math.min(s.maxHp, s.hp + healHp)
  s.injury = Math.max(0, s.injury - partner.healInjury)
  s.heartDemonRisk = Math.max(0, s.heartDemonRisk - 1)

  // 修为：原闭关 3 月基数约 18，双修按品级倍率拉高
  // 折寿双修略加一点修为体感（以命换道）
  const lifeBonus = payMode === 'lifespan' ? 1.08 : 1
  const mult = cultivateMultiplier(s)
  const baseCult = 18 * partner.cultMult * lifeBonus
  const cultGain = baseCult * mult * (0.95 + rng.next() * 0.15)
  const r = tryCultivationGain(s, cultGain)
  s = r.state

  // 功法熟练度
  const mainId = s.mainArtByRealm[s.realm]
  let artLine = '无主修功法，未涨功法等级'
  if (mainId) {
    const art = getArt(mainId)
    const beforeLv = s.arts.find((a) => a.artId === mainId)?.skillLevel ?? 1
    const xpGain = Math.round((48 + rng.int(0, 24)) * partner.artXpMult * lifeBonus)
    s.arts = applySkillXp(s.arts, mainId, xpGain)
    const afterLv = s.arts.find((a) => a.artId === mainId)?.skillLevel ?? 1
    const attrsAfter = displayAttrs(s)
    artLine =
      afterLv > beforeLv
        ? `《${art?.name}》Lv${beforeLv}→Lv${afterLv}（熟练+${xpGain}）`
        : `《${art?.name}》熟练+${xpGain}（仍为 Lv${afterLv}）`
    const attrDiff = diffAttrsLine(attrsBefore, attrsAfter)
    if (attrDiff) messages.push(`功法共鸣属性：${attrDiff}`)
  }

  const payLine =
    payMode === 'stones'
      ? `耗费灵石 ${stoneCost}（余 ${s.spiritStones}）`
      : `以寿换道：寿元上限 -${lifeCost}（现 ${s.lifespan} 岁上限，虚岁 ${s.age.toFixed(1)}）`

  messages.unshift(
    `你与【${partner.name}】（${partner.gradeName}）双修三月。`,
    partner.blurb,
    payLine,
    payMode === 'lifespan' ? '折寿双修，修为共鸣略强于灵石之交。' : '',
    `疗伤：气血 ${beforeHp}→${s.hp}` +
      (beforeInjury !== s.injury ? `，伤势 ${beforeInjury}→${s.injury}` : '，伤势无大碍或已减轻'),
    ...r.messages,
    artLine,
    describeMainArtPower(s),
  )

  s = pushLog(
    s,
    payMode === 'stones'
      ? `双修·${partner.name}：灵石-${stoneCost}；${r.messages.join(' ')}；${artLine}`
      : `双修·${partner.name}：折寿-${lifeCost}年（上限${s.lifespan}）；${r.messages.join(' ')}；${artLine}`,
  )

  return { state: clampState(s), messages: messages.filter(Boolean) }
}

/** 查询某天尊当前境界下的实际灵石价 */
export function getDualCultCostForState(
  state: PlayerState,
  partnerId: DualPartnerId,
): number {
  const p = getDualPartner(partnerId)
  return dualCultCost(p.baseCost, realmIndex(state.realm))
}

/** 查询某天尊当前境界下的折寿年数 */
export function getDualCultLifeCostForState(
  state: PlayerState,
  partnerId: DualPartnerId,
): number {
  const p = getDualPartner(partnerId)
  return dualCultLifeCost(p.baseLifeCost, realmIndex(state.realm))
}
