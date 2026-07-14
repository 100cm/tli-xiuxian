import { getArt, GRADE_MAX_LEVEL, GRADE_MULT } from '../content/arts'
import { getEquipDef } from '../content/equipment'
import type {
  Attrs,
  MainArtSlots,
  MajorRealm,
  OwnedArt,
  PlayerState,
} from '../domain/types'
import { collectTalentEffects } from './talentRoll'

export function emptyAttrs(): Attrs {
  return { str: 0, agi: 0, int: 0, con: 0, luck: 0, will: 0 }
}

export function addAttrs(a: Attrs, b: Partial<Attrs>): Attrs {
  return {
    str: a.str + (b.str ?? 0),
    agi: a.agi + (b.agi ?? 0),
    int: a.int + (b.int ?? 0),
    con: a.con + (b.con ?? 0),
    luck: a.luck + (b.luck ?? 0),
    will: a.will + (b.will ?? 0),
  }
}

function applyEffectList(
  effects: { type: string; key?: string; value?: number; mult?: number; tags?: string[] }[],
  scale: number,
  into: {
    attrs: Attrs
    cultivateMult: number
    checkBonus: Record<string, number>
    maxHpBonus: number
  },
) {
  for (const e of effects) {
    if (e.type === 'attr' && e.key && e.value != null) {
      const k = e.key as keyof Attrs
      into.attrs[k] = (into.attrs[k] ?? 0) + Math.round(e.value * scale)
    }
    if (e.type === 'cultivateMult' && e.value != null) {
      into.cultivateMult += e.value * scale
    }
    if (e.type === 'checkBonus' && e.tags && e.value != null) {
      for (const t of e.tags) {
        into.checkBonus[t] = (into.checkBonus[t] ?? 0) + e.value * scale
      }
    }
    if (e.type === 'maxHp' && e.value != null) {
      into.maxHpBonus += Math.round(e.value * scale)
    }
    if (e.type === 'combat' && e.key && e.value != null) {
      // 战斗词条暂并入相关属性小加成
      if (e.key.includes('melee') || e.key === 'burst') into.attrs.str += Math.round(e.value * 0.05 * scale)
      if (e.key.includes('fire') || e.key.includes('spell'))
        into.attrs.int += Math.round(e.value * 0.05 * scale)
    }
  }
}

export function computeBonuses(
  state: Pick<
    PlayerState,
    'talent' | 'arts' | 'mainArtByRealm' | 'realm' | 'attrs' | 'inventory' | 'equipped'
  >,
) {
  const result = {
    attrs: emptyAttrs(),
    cultivateMult: 0,
    checkBonus: {} as Record<string, number>,
    choiceFlags: new Set<string>(),
    maxHpBonus: 0,
  }

  applyEffectList(collectTalentEffects(state.talent), 1, result)

  const currentMain = state.mainArtByRealm[state.realm]
  for (const owned of state.arts) {
    const def = getArt(owned.artId)
    if (!def || !owned.complete) continue
    const isMain = owned.artId === currentMain
    const isPast = Object.entries(state.mainArtByRealm).some(
      ([realm, id]) => id === owned.artId && realm !== state.realm,
    )
    if (!isMain && !isPast) continue

    // 主修 100% / 往境烙印 40%
    const slot = isMain ? 1 : 0.4
    const grade = GRADE_MULT[owned.grade]
    // 等级缩放：每级 +12% 效果（专修升级会变强）
    const levelScale = 1 + (owned.skillLevel - 1) * 0.12
    const scale = slot * grade * levelScale

    applyEffectList(def.effects, scale, result)

    // 主修额外：每升 1 级，功法自带属性再 +1（保证专修能看见属性涨）
    if (isMain && owned.skillLevel > 1) {
      const lv = owned.skillLevel - 1
      for (const e of def.effects) {
        if (e.type === 'attr' && e.key && e.value != null && e.value !== 0) {
          const k = e.key as keyof Attrs
          result.attrs[k] += lv * (e.value > 0 ? 1 : -1)
        }
      }
      // 闭关类词条：每级再 +1% 修炼效率
      const hasCult = def.effects.some((e) => e.type === 'cultivateMult')
      if (hasCult) result.cultivateMult += lv * 0.01
    }

    for (const e of def.effects) {
      if (e.type === 'unlockChoice' && e.choiceFlag && isMain) {
        result.choiceFlags.add(e.choiceFlag)
      }
    }
  }

  // 已装备
  if (state.equipped && state.inventory) {
    for (const uid of Object.values(state.equipped)) {
      if (!uid) continue
      const item = state.inventory.find((i) => i.uid === uid)
      if (!item) continue
      const def = getEquipDef(item.defId)
      if (!def) continue
      const scale = GRADE_MULT[item.grade] ?? 1
      applyEffectList(def.effects, scale, result)
    }
  }

  return result
}

export function totalAttrs(base: Attrs, state: PlayerState): Attrs {
  const b = computeBonuses(state)
  return addAttrs(base, b.attrs)
}

/** 兼容旧存档缺装备字段 */
export function withGearDefaults(state: PlayerState): PlayerState {
  return {
    ...state,
    inventory: state.inventory ?? [],
    equipped: state.equipped ?? {},
  }
}

/** 用状态上的 attrs 已是基础属性；bonus 另算展示时合并 */
export function displayAttrs(state: PlayerState): Attrs {
  const b = computeBonuses(withGearDefaults(state))
  return addAttrs(state.attrs, b.attrs)
}

export function equipMaxHpBonus(state: PlayerState): number {
  return computeBonuses(withGearDefaults(state)).maxHpBonus
}

export function cultivateMultiplier(state: PlayerState): number {
  const b = computeBonuses(withGearDefaults(state))
  const injuryPen = Math.min(0.5, state.injury * 0.12)
  const demonPen = Math.min(0.2, state.heartDemonRisk * 0.02)
  return Math.max(0.3, 1 + b.cultivateMult - injuryPen - demonPen + state.caveLevel * 0.04)
}

export function checkModifier(state: PlayerState, tags: string[]): number {
  const b = computeBonuses(withGearDefaults(state))
  const attrs = displayAttrs(state)
  let mod = 0
  for (const t of tags) {
    mod += b.checkBonus[t] ?? 0
  }
  // 粗略：相关属性
  if (tags.includes('melee') || tags.includes('combat')) mod += attrs.str
  if (tags.includes('escape') || tags.includes('stealth') || tags.includes('explore'))
    mod += attrs.agi
  if (tags.includes('spell') || tags.includes('insight')) mod += attrs.int
  if (tags.includes('endure') || tags.includes('defend') || tags.includes('breakthrough'))
    mod += attrs.con + attrs.will * 0.5
  if (tags.includes('trade') || tags.includes('luck')) mod += attrs.luck
  return mod
}

export function hasChoiceFlag(state: PlayerState, flag: string): boolean {
  if (state.flags.includes(flag)) return true
  return computeBonuses(withGearDefaults(state)).choiceFlags.has(flag)
}

/** 升到下一级所需熟练度（专修约 1～2 次可升 1 级前期） */
export function skillXpToLevel(level: number): number {
  return 28 + level * 14
}

/** 主修当前等级带来的属性加成说明用 */
export function describeMainArtPower(state: PlayerState): string {
  const mainId = state.mainArtByRealm[state.realm]
  if (!mainId) return '无主修'
  const owned = state.arts.find((a) => a.artId === mainId)
  const def = getArt(mainId)
  if (!owned || !def) return '无主修'
  const attrs = emptyAttrs()
  const slot = 1
  const grade = GRADE_MULT[owned.grade]
  const levelScale = 1 + (owned.skillLevel - 1) * 0.12
  const scale = slot * grade * levelScale
  const into = { attrs, cultivateMult: 0, checkBonus: {} as Record<string, number>, maxHpBonus: 0 }
  applyEffectList(def.effects, scale, into)
  if (owned.skillLevel > 1) {
    const lv = owned.skillLevel - 1
    for (const e of def.effects) {
      if (e.type === 'attr' && e.key && e.value) {
        const k = e.key as keyof Attrs
        into.attrs[k] += lv * (e.value > 0 ? 1 : -1)
      }
    }
  }
  const parts: string[] = []
  const names: Record<keyof Attrs, string> = {
    str: '攻',
    agi: '敏',
    int: '智',
    con: '体',
    luck: '运',
    will: '志',
  }
  for (const k of Object.keys(names) as (keyof Attrs)[]) {
    if (into.attrs[k]) parts.push(`${names[k]}+${into.attrs[k]}`)
  }
  if (into.cultivateMult > 0) parts.push(`闭关+${Math.round(into.cultivateMult * 100)}%`)
  return parts.length
    ? `《${def.name}》Lv${owned.skillLevel} 提供 ${parts.join(' ')}`
    : `《${def.name}》Lv${owned.skillLevel}`
}

export function maxLevelForGrade(grade: OwnedArt['grade']): number {
  return GRADE_MAX_LEVEL[grade]
}

export function grantArt(
  arts: OwnedArt[],
  artId: string,
  grade: OwnedArt['grade'],
  fragment: boolean,
): { arts: OwnedArt[]; log: string } {
  const existing = arts.find((a) => a.artId === artId)
  if (existing) {
    if (fragment && existing.complete) {
      return {
        arts: arts.map((a) =>
          a.artId === artId ? { ...a, skillXp: a.skillXp + 30 } : a,
        ),
        log: `已领悟过该功法，熟练度上升。`,
      }
    }
    if (!existing.complete && !fragment) {
      return {
        arts: arts.map((a) =>
          a.artId === artId ? { ...a, complete: true, grade } : a,
        ),
        log: `残篇合璧，功法圆满可修！`,
      }
    }
    if (!existing.complete && fragment) {
      return {
        arts: arts.map((a) =>
          a.artId === artId ? { ...a, complete: true, grade } : a,
        ),
        log: `残篇补全，功法成型。`,
      }
    }
    return {
      arts: arts.map((a) =>
        a.artId === artId
          ? {
              ...a,
              skillXp: a.skillXp + 40,
              grade: gradeRank(a.grade) < gradeRank(grade) ? grade : a.grade,
            }
          : a,
      ),
      log: `同名功法精进，熟练度大增。`,
    }
  }
  return {
    arts: [
      ...arts,
      {
        artId,
        grade,
        skillLevel: 1,
        skillXp: 0,
        complete: !fragment,
      },
    ],
    log: fragment ? `获得功法残篇。` : `学会新功法！`,
  }
}

function gradeRank(g: OwnedArt['grade']): number {
  const order = ['mortal', 'yellow', 'mysterious', 'earth', 'heaven', 'immortal']
  return order.indexOf(g)
}

export function applySkillXp(arts: OwnedArt[], artId: string, xp: number): OwnedArt[] {
  return arts.map((a) => {
    if (a.artId !== artId || !a.complete) return a
    let skillXp = a.skillXp + xp
    let skillLevel = a.skillLevel
    const max = maxLevelForGrade(a.grade)
    while (skillLevel < max && skillXp >= skillXpToLevel(skillLevel)) {
      skillXp -= skillXpToLevel(skillLevel)
      skillLevel += 1
    }
    return { ...a, skillXp, skillLevel }
  })
}

export function currentMainArtId(slots: MainArtSlots, realm: MajorRealm): string | undefined {
  return slots[realm]
}
