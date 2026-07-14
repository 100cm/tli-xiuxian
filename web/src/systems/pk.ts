/**
 * PK 交手：即时战力对抗，非事件选项。
 * ~10% 概率撞见强敌「伦哥哥」「冰环探索者」——大概率惨败重创。
 */
import { EQUIPMENT } from '../content/equipment'
import { realmIndex } from '../domain/realm'
import type { PlayerState } from '../domain/types'
import { displayAttrs, withGearDefaults } from './effects'
import { grantEquipment } from './equipment'
import { createRng, type Rng } from './rng'

export interface PkResult {
  state: PlayerState
  messages: string[]
  ended?: boolean
}

interface Opponent {
  id: string
  name: string
  title: string
  /** 相对玩家战力倍率（再叠境界差） */
  powerMult: number
  /** 固定战力加成（强敌） */
  powerFlat: number
  boss: boolean
  flavorWin: string
  flavorLose: string
  flavorFlee?: string
}

const NORMAL_OPPONENTS: Opponent[] = [
  {
    id: 'qi_rogue',
    name: '散修游侠',
    title: '同境散修',
    powerMult: 0.85,
    powerFlat: 0,
    boss: false,
    flavorWin: '对方抱拳认输，扔下钱袋离开。',
    flavorLose: '你被压着打，狼狈退去。',
  },
  {
    id: 'sect_inner',
    name: '宗门内门弟子',
    title: '门中骄子',
    powerMult: 1.0,
    powerFlat: 5,
    boss: false,
    flavorWin: '内门弟子脸色铁青，丢下赌注。',
    flavorLose: '功法更纯熟，你连连后退。',
  },
  {
    id: 'blade_merc',
    name: '刀客佣兵',
    title: '刀口舔血',
    powerMult: 1.05,
    powerFlat: 8,
    boss: false,
    flavorWin: '刀客吐血跪地，你收刀。',
    flavorLose: '刀风贴面，你身中数创。',
  },
  {
    id: 'array_scholar',
    name: '阵修书生',
    title: '以阵代兵',
    powerMult: 0.95,
    powerFlat: 12,
    boss: false,
    flavorWin: '阵盘碎裂，书生拱手认栽。',
    flavorLose: '困阵之中，你气血倒涌。',
  },
  {
    id: 'beast_tamer',
    name: '驭兽客',
    title: '灵兽在侧',
    powerMult: 1.1,
    powerFlat: 6,
    boss: false,
    flavorWin: '灵兽溃逃，驭兽客弃宝而走。',
    flavorLose: '人兽夹攻，你败得干脆。',
  },
  {
    id: 'demon_cult',
    name: '魔道余孽',
    title: '邪功腥气',
    powerMult: 1.15,
    powerFlat: 10,
    boss: false,
    flavorWin: '魔修遁入夜色，遗落赃物。',
    flavorLose: '邪功噬心，你险些走火。',
  },
]

const BOSS_OPPONENTS: Opponent[] = [
  {
    id: 'lun_gege',
    name: '伦哥哥',
    title: '传说中的嘴遁之王',
    powerMult: 1.85,
    powerFlat: 55,
    boss: true,
    flavorWin:
      '不可思议——你竟压过伦哥哥半招！他摸了摸嘴角：「有点东西。」扔下重礼便走。',
    flavorLose:
      '伦哥哥只动了动嘴唇，你先觉得自己很菜，再觉得全身剧痛。灵石、气血、道心齐飞。',
    flavorFlee: '你拔腿就跑，伦哥哥在身后喊：「再来啊！」',
  },
  {
    id: 'ice_ring_explorer',
    name: '冰环探索者',
    title: '冰环深处归来者',
    powerMult: 1.9,
    powerFlat: 60,
    boss: true,
    flavorWin:
      '冰环寒气被你硬撼散去！探索者点头：「冰环之外，也有人。」留宝作贺。',
    flavorLose:
      '极寒锁脉，探索者一指点中气海。你如坠冰窟，重伤溃败，行囊散落一地。',
    flavorFlee: '寒气逼近，你滚下悬崖才保住半条命。',
  },
]

function combatPower(state: PlayerState): number {
  const a = displayAttrs(state)
  const ri = realmIndex(state.realm)
  const layerBonus =
    state.realm === 'qi_refining' ? state.layer * 2.5 : ({ early: 0, mid: 6, late: 12, perfect: 20 }[state.minor] ?? 0)
  const mainId = state.mainArtByRealm[state.realm]
  const main = mainId ? state.arts.find((x) => x.artId === mainId) : undefined
  const artPow = main ? main.skillLevel * 4 + ({ mortal: 0, yellow: 4, mysterious: 10, earth: 16, heaven: 22, immortal: 30 }[main.grade] ?? 4) : 0
  // 装备件数粗加成
  const gearCount = Object.values(state.equipped ?? {}).filter(Boolean).length
  const gearPow = gearCount * 3
  const injuryPen = state.injury * 6
  return (
    a.str * 2.2 +
    a.agi * 1.6 +
    a.int * 1.5 +
    a.con * 1.2 +
    a.will * 0.9 +
    a.luck * 0.5 +
    ri * 18 +
    layerBonus +
    artPow +
    gearPow -
    injuryPen +
    state.hp / 20
  )
}

function opponentPower(basePlayer: number, opp: Opponent, rng: Rng): number {
  const jitter = 0.92 + rng.next() * 0.16
  return (basePlayer * opp.powerMult + opp.powerFlat) * jitter
}

function advanceMonths(state: PlayerState, months: number): PlayerState {
  let { year, month, age, lifespan, dead, endingText } = state
  month += months
  while (month > 12) {
    month -= 12
    year += 1
  }
  age = state.age + months / 12
  if (age >= lifespan) {
    dead = true
    endingText = `寿元耗尽。交手归来，享年 ${Math.floor(age)}。`
  }
  return { ...state, year, month: Math.floor(month), age, dead, endingText }
}

function pickOpponent(rng: Rng): Opponent {
  // ~10% 强敌（各约 5%）
  if (rng.next() < 0.1) {
    return rng.pick(BOSS_OPPONENTS)
  }
  return rng.pick(NORMAL_OPPONENTS)
}

function rollWinChance(pPow: number, oPow: number, luck: number, boss: boolean): number {
  // 逻辑：战力比决定胜率，运微调；强敌上限压低
  const ratio = pPow / Math.max(1, oPow)
  let chance = 50 + (ratio - 1) * 55
  chance += Math.min(8, Math.max(-4, (luck - 4) * 1.2))
  if (boss) {
    chance = Math.min(chance, 28) // 强敌：再强也难超过约 28%
    chance = Math.max(4, chance)
  } else {
    chance = Math.min(88, Math.max(12, chance))
  }
  return chance
}

/**
 * 执行一次 PK：耗时 2 月，即时结算胜负。
 */
export function runPk(state: PlayerState): PkResult {
  if (state.dead || state.won) {
    return { state, messages: ['本局已结束。'], ended: true }
  }

  const rng = createRng(
    (state.seed + state.year * 173 + state.month * 41 + state.log.length * 19 + state.hp * 3) >>> 0,
  )
  let s = withGearDefaults({ ...state })
  s = advanceMonths(s, 2)
  if (s.dead) {
    return { state: s, messages: [s.endingText!], ended: true }
  }

  const opp = pickOpponent(rng)
  const pPow = combatPower(s)
  const oPow = opponentPower(pPow, opp, rng)
  const attrs = displayAttrs(s)
  const winChance = rollWinChance(pPow, oPow, attrs.luck, opp.boss)
  const roll = rng.int(1, 100)
  const win = roll <= winChance

  const messages: string[] = [
    '你耗时 2 月寻访可交手的修士，约战台前灵光四起。',
    opp.boss
      ? `！！气机锁死——来者竟是【${opp.name}】（${opp.title}）！周围修士纷纷退避。`
      : `对手：【${opp.name}】（${opp.title}）。`,
    `战力估测 己方 ${pPow.toFixed(0)} vs 对方 ${oPow.toFixed(0)} · 胜率约 ${winChance.toFixed(0)}%（掷 ${roll}）`,
  ]

  if (win) {
    messages.push(opp.flavorWin)
    // 奖励
    const stoneGain = opp.boss
      ? rng.int(80, 160)
      : rng.int(12, 28) + Math.floor(realmIndex(s.realm) * 6)
    const cultGain = opp.boss ? rng.int(35, 55) : rng.int(10, 22)
    s.spiritStones += stoneGain
    s.cultivation += cultGain
    s.karma += opp.boss ? 2 : rng.int(0, 2)
    // 轻伤也可能
    if (rng.next() < 0.35) {
      const dmg = opp.boss ? rng.int(8, 18) : rng.int(3, 12)
      s.hp = Math.max(1, s.hp - dmg)
      messages.push(`激战余波，气血 -${dmg}。`)
    }
    messages.push(`夺得灵石 +${stoneGain}，战中顿悟修为 +${cultGain}。`)

    // 掉装
    const dropP = opp.boss ? 0.72 : 0.28
    if (rng.next() < dropP) {
      const pool = EQUIPMENT.filter((e) => {
        if (e.id === 'eternity' || e.id === 'lun_ge_mouth') {
          return opp.boss && rng.next() < 0.08
        }
        if (opp.boss) return e.grade === 'mysterious' || e.grade === 'yellow' || e.grade === 'immortal'
        return e.grade === 'mortal' || e.grade === 'yellow' || (e.grade === 'mysterious' && rng.next() < 0.25)
      })
      if (pool.length) {
        const def = rng.pick(pool)
        const granted = grantEquipment(s, def.id, def.grade)
        s = granted.state
        messages.push(granted.log)
      }
    }

    if (opp.boss) {
      s.daoHeart = Math.min(100, s.daoHeart + 6)
      messages.push('力克强敌，道心大振！')
    }
  } else {
    messages.push(opp.flavorLose)

    if (opp.boss) {
      // 强敌惨败：巨额损失
      const stoneLoss = Math.min(s.spiritStones, Math.max(40, Math.floor(s.spiritStones * (0.35 + rng.next() * 0.25))))
      const hpLoss = Math.min(s.hp - 1, Math.max(25, Math.floor(s.maxHp * (0.35 + rng.next() * 0.2))))
      s.spiritStones -= stoneLoss
      s.hp = Math.max(1, s.hp - hpLoss)
      s.injury += rng.int(2, 4)
      s.daoHeart = Math.max(0, s.daoHeart - rng.int(8, 15))
      s.karma += rng.int(1, 3)
      // 可能被扒一件未神级装备
      if (rng.next() < 0.4 && s.inventory.length > 0) {
        const stealable = s.inventory.filter((i) => i.defId !== 'eternity' && i.defId !== 'lun_ge_mouth')
        if (stealable.length) {
          const stolen = rng.pick(stealable)
          s.inventory = s.inventory.filter((i) => i.uid !== stolen.uid)
          const eq = { ...s.equipped }
          for (const [slot, uid] of Object.entries(eq)) {
            if (uid === stolen.uid) delete eq[slot as keyof typeof eq]
          }
          s.equipped = eq
          messages.push('对方顺手抄走你一件法器！')
        }
      }
      messages.push(
        `惨败于【${opp.name}】！灵石 -${stoneLoss}，气血 -${hpLoss}，重伤，道心剧震。`,
      )
      // 极低概率直接致死（被杀）
      if (s.hp <= 5 && rng.next() < 0.12) {
        s.hp = 0
        s.dead = true
        s.endingText = `与【${opp.name}】交手，实力悬殊，身死道消。止步于历法 ${s.year} 年。`
        messages.push(s.endingText)
        s = pushLog(s, messages.filter((m) => !m.includes('胜率')).slice(-3).join(' '))
        return { state: clampPk(s), messages, ended: true }
      }
    } else {
      const stoneLoss = Math.min(s.spiritStones, rng.int(5, 18) + realmIndex(s.realm) * 3)
      const hpLoss = Math.min(s.hp - 1, rng.int(10, 22) + Math.floor(s.maxHp * 0.08))
      s.spiritStones -= stoneLoss
      s.hp = Math.max(1, s.hp - hpLoss)
      if (rng.next() < 0.55) s.injury += 1
      if (rng.next() < 0.25) s.daoHeart = Math.max(0, s.daoHeart - 3)
      s.karma += rng.next() < 0.3 ? 1 : 0
      messages.push(`落败。灵石 -${stoneLoss}，气血 -${hpLoss}${s.injury > state.injury ? '，带伤' : ''}。`)
    }

    // 败也有一点点修为（挨打长记性）
    const pity = opp.boss ? rng.int(5, 12) : rng.int(2, 8)
    s.cultivation += pity
    messages.push(`痛定思痛，修为 +${pity}。`)
  }

  // 道心归零
  if (s.daoHeart <= 0) {
    s.dead = true
    s.endingText = `交手败北，道心崩解，心魔反噬而亡。历法 ${s.year} 年。`
    messages.push(s.endingText)
    s = pushLog(s, `PK 败亡·${opp.name}`)
    return { state: clampPk(s), messages, ended: true }
  }

  s = pushLog(
    s,
    win
      ? `PK 胜·${opp.name}${opp.boss ? '（强敌）' : ''}`
      : `PK 败·${opp.name}${opp.boss ? '（强敌）' : ''}`,
  )

  return { state: clampPk(s), messages }
}

function clampPk(s: PlayerState): PlayerState {
  return {
    ...s,
    hp: Math.max(0, Math.min(s.maxHp, s.hp)),
    daoHeart: Math.max(0, Math.min(100, s.daoHeart)),
    spiritStones: Math.max(0, s.spiritStones),
    injury: Math.max(0, s.injury),
    cultivation: Math.max(0, s.cultivation),
  }
}

function pushLog(s: PlayerState, text: string): PlayerState {
  return {
    ...s,
    log: [...s.log, { year: s.year, month: s.month, text }].slice(-80),
  }
}
