/**
 * 赌坊：灵石对赌 + 梭哈赌装备
 * 设计意图：长期期望为负（庄家抽水），梭哈越高越好装概率略升，但仍常亏。
 */
import { EQUIPMENT } from '../content/equipment'
import type { ArtGrade, PlayerState } from '../domain/types'
import { grantEquipment } from './equipment'
import { createRng, type Rng } from './rng'
import { withGearDefaults } from './effects'

export type GambleBetKind = 'high' | 'low' | 'lucky'

export interface GambleActionResult {
  state: PlayerState
  messages: string[]
  ended?: boolean
}

const GOD_IDS = new Set(['eternity', 'lun_ge_mouth'])

function clampStones(n: number): number {
  return Math.max(0, Math.floor(n))
}

function advanceMonth(state: PlayerState, months: number, rng: Rng): PlayerState {
  let { year, month, age, lifespan, dead, endingText } = state
  month += months
  while (month > 12) {
    month -= 12
    year += 1
  }
  age = state.age + months / 12
  if (age >= lifespan) {
    dead = true
    endingText = `寿元耗尽。赌坊散场，享年 ${Math.floor(age)}。`
  }
  void rng
  return { ...state, year, month: Math.floor(month), age, dead, endingText }
}

function pickEquipOfGrade(grade: ArtGrade, rng: Rng, allowGod: boolean): (typeof EQUIPMENT)[0] | null {
  const pool = EQUIPMENT.filter((e) => {
    if (e.grade !== grade) return false
    if (!allowGod && GOD_IDS.has(e.id)) return false
    return true
  })
  if (pool.length === 0) return null
  return rng.pick(pool)
}

/**
 * 根据押注额估「手气档」0~1，越高越好装权重越大，但整体仍偏亏。
 * 30 石≈0.25，100≈0.45，500≈0.7，2000≈0.9
 */
export function stakePower(stake: number): number {
  if (stake <= 0) return 0
  const p = Math.log10(stake + 10) / Math.log10(3000)
  return Math.max(0, Math.min(1, p))
}

/** 梭哈档预览文案 */
export function allInOddsPreview(stake: number): string {
  const p = stakePower(stake)
  const empty = Math.max(0.18, 0.48 - p * 0.22)
  const yellow = 0.28 + p * 0.12
  const mysterious = 0.08 + p * 0.18
  const immortal = p > 0.55 ? 0.005 + (p - 0.55) * 0.02 : 0.001
  return `约：空仓 ${(empty * 100).toFixed(0)}% · 黄阶↑ ${(yellow * 100).toFixed(0)}% · 玄阶↑ ${(mysterious * 100).toFixed(0)}% · 神级极稀 ${(immortal * 100).toFixed(1)}%（长期必亏）`
}

/**
 * 灵石对赌：猜大小 / 赌气运
 * - 赢：约 1.85 倍返还（含本金），胜率 <50% → EV 负
 * - 耗时 1 月
 */
export function runStoneBet(
  state: PlayerState,
  stake: number,
  kind: GambleBetKind,
): GambleActionResult {
  if (state.dead || state.won) {
    return { state, messages: ['本局已结束。'], ended: true }
  }
  const s0 = withGearDefaults(state)
  const stakeN = clampStones(stake)
  if (stakeN < 5) {
    return { state: s0, messages: ['下注至少 5 灵石。'] }
  }
  if (s0.spiritStones < stakeN) {
    return {
      state: s0,
      messages: [`灵石不足：要押 ${stakeN}，当前仅 ${s0.spiritStones}。`],
    }
  }

  const rng = createRng(
    (s0.seed + s0.year * 131 + s0.month * 17 + s0.spiritStones * 3 + s0.log.length * 9 + kind.length) >>>
      0,
  )
  let s = { ...s0, spiritStones: s0.spiritStones - stakeN }
  s = advanceMonth(s, 1, rng)
  if (s.dead) {
    return { state: s, messages: [s.endingText!], ended: true }
  }

  // 庄家优势：基础胜率 44%，运高略抬（最多 +6%）
  const luck = s.attrs.luck ?? 3
  const winRate = Math.min(0.5, 0.44 + Math.max(0, luck - 3) * 0.008)
  const roll = rng.next()
  const point = rng.int(1, 6)
  const isHigh = point >= 4
  let win = false
  let flavor = ''

  if (kind === 'high') {
    win = isHigh && roll < winRate + 0.06 // 大：略好猜，但赔率会在下面统一压
    flavor = `骰子开 ${point} 点（${isHigh ? '大' : '小'}）`
  } else if (kind === 'low') {
    win = !isHigh && roll < winRate + 0.06
    flavor = `骰子开 ${point} 点（${isHigh ? '大' : '小'}）`
  } else {
    // 气运梭：更低胜率更高赔
    win = roll < winRate - 0.08
    flavor = `气运签开出「${roll < 0.5 ? '凶' : '吉'}」纹`
  }

  const messages: string[] = [
    `你走进坊市赌坊，押下 ${stakeN} 灵石${kind === 'high' ? '猜大' : kind === 'low' ? '猜小' : '赌气运'}。`,
    flavor + '。',
  ]

  if (win) {
    // 大小：1.85x；气运：2.4x（胜率更低）
    const mult = kind === 'lucky' ? 2.4 : 1.85
    const payout = Math.floor(stakeN * mult)
    s.spiritStones += payout
    messages.push(`赢了！收回 ${payout} 灵石（含本金折算）。`, `当前灵石 ${s.spiritStones}。`)
    // 小幅道心/杀孽波动
    if (rng.next() < 0.12) {
      s.daoHeart = Math.min(100, s.daoHeart + 1)
      messages.push('赌运顺畅，道心微稳。')
    }
  } else {
    messages.push(`输光这一注。`, `当前灵石 ${s.spiritStones}。`)
    if (rng.next() < 0.15) {
      s.daoHeart = Math.max(0, s.daoHeart - 2)
      messages.push('赌气上涌，道心微损。')
    }
    if (rng.next() < 0.08) {
      s.karma += 1
      messages.push('坊间闲话：又一只肥羊……杀孽微增。')
    }
  }

  s = {
    ...s,
    log: [
      ...s.log,
      {
        year: s.year,
        month: s.month,
        text: win
          ? `赌坊下注 ${stakeN} 赢至 ${s.spiritStones} 石。`
          : `赌坊下注 ${stakeN} 输掉，余 ${s.spiritStones} 石。`,
      },
    ].slice(-80),
  }

  return { state: s, messages }
}

/**
 * 梭哈赌装备：押灵石换随机法器。
 * 押得越多，高阶权重越高；空仓/凡品仍是主流 → 长期亏。
 * 耗时 2 月。
 */
export function runAllInEquip(
  state: PlayerState,
  stake: number,
): GambleActionResult {
  if (state.dead || state.won) {
    return { state, messages: ['本局已结束。'], ended: true }
  }
  const s0 = withGearDefaults(state)
  const stakeN = clampStones(stake)
  if (stakeN < 20) {
    return { state: s0, messages: ['梭哈赌宝至少押 20 灵石。'] }
  }
  if (s0.spiritStones < stakeN) {
    return {
      state: s0,
      messages: [`灵石不足：梭哈需 ${stakeN}，当前 ${s0.spiritStones}。`],
    }
  }

  const rng = createRng(
    (s0.seed + s0.year * 211 + s0.month * 29 + stakeN * 7 + s0.log.length * 13) >>> 0,
  )
  let s = { ...s0, spiritStones: s0.spiritStones - stakeN }
  s = advanceMonth(s, 2, rng)
  if (s.dead) {
    return { state: s, messages: [s.endingText!], ended: true }
  }

  const p = stakePower(stakeN)
  const luck = s.attrs.luck ?? 3
  const luckNudge = Math.min(0.06, Math.max(0, luck - 4) * 0.01)

  // 权重表（未归一）：空仓 / 凡 / 黄 / 玄 / 神
  let wEmpty = Math.max(0.16, 0.5 - p * 0.28 - luckNudge)
  let wMortal = Math.max(0.12, 0.32 - p * 0.12)
  let wYellow = 0.22 + p * 0.14 + luckNudge * 0.5
  let wMysterious = 0.06 + p * 0.22 + luckNudge
  let wImmortal = p >= 0.5 ? 0.004 + (p - 0.5) * 0.035 : 0.0008
  // 超高额梭哈才有一点点神级
  if (stakeN < 300) wImmortal *= 0.15
  if (stakeN < 800) wImmortal *= 0.5

  const total = wEmpty + wMortal + wYellow + wMysterious + wImmortal
  let r = rng.next() * total
  type Tier = 'empty' | ArtGrade
  let tier: Tier = 'empty'
  r -= wEmpty
  if (r > 0) {
    r -= wMortal
    if (r <= 0) tier = 'mortal'
    else {
      r -= wYellow
      if (r <= 0) tier = 'yellow'
      else {
        r -= wMysterious
        if (r <= 0) tier = 'mysterious'
        else tier = 'immortal'
      }
    }
  }

  const messages: string[] = [
    `你在赌坊宝匣台前梭哈 ${stakeN} 灵石，宝匣缓缓开启……`,
    allInOddsPreview(stakeN),
  ]

  // 极小概率退回一点零头（安慰奖），仍远小于本金
  if (tier === 'empty' && rng.next() < 0.2) {
    const crumb = Math.max(1, Math.floor(stakeN * 0.05 * rng.next()))
    s.spiritStones += crumb
    messages.push(`匣中空空，庄家扔回 ${crumb} 灵石作「茶水」。`)
    messages.push(`当前灵石 ${s.spiritStones}。`)
  } else if (tier === 'empty') {
    messages.push('匣中空空如也，灵石打了水漂。')
    messages.push(`当前灵石 ${s.spiritStones}。`)
    if (rng.next() < 0.2) {
      s.daoHeart = Math.max(0, s.daoHeart - 3)
      messages.push('心有不甘，道心微损。')
    }
  } else {
    const allowGod = tier === 'immortal'
    const def = pickEquipOfGrade(tier, rng, allowGod)
    if (!def) {
      // 无对应池时降级
      const fallback = pickEquipOfGrade('yellow', rng, false) ?? EQUIPMENT[0]
      const granted = grantEquipment(s, fallback.id, fallback.grade)
      s = granted.state
      messages.push(`匣中钻出一件凑数货。`, granted.log, `当前灵石 ${s.spiritStones}。`)
    } else {
      const granted = grantEquipment(s, def.id, def.grade)
      s = granted.state
      const gradeLabel =
        tier === 'immortal' ? '神级' : tier === 'mysterious' ? '玄阶' : tier === 'yellow' ? '黄阶' : '凡阶'
      messages.push(
        tier === 'immortal'
          ? `满堂哗然！神级法器【${def.name}】出世！`
          : `匣中躺着${gradeLabel}法器【${def.name}】。`,
        granted.log,
        `你用 ${stakeN} 灵石换来此物（多数时候并不划算）。`,
        `当前灵石 ${s.spiritStones}。`,
      )
      if (tier === 'immortal') {
        s.daoHeart = Math.min(100, s.daoHeart + 5)
        messages.push('气运滔天，道心大定。')
      }
    }
  }

  s = {
    ...s,
    log: [
      ...s.log,
      {
        year: s.year,
        month: s.month,
        text: `梭哈赌宝押 ${stakeN} 石，${tier === 'empty' ? '空匣' : `得${tier}装`}，余 ${s.spiritStones} 石。`,
      },
    ].slice(-80),
  }

  return { state: s, messages }
}

export const BET_PRESETS = [10, 25, 50, 100, 200, 500] as const
