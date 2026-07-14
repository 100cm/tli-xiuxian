import type { MajorRealm, MinorStage } from './types'

export const REALM_ORDER: MajorRealm[] = [
  'qi_refining',
  'foundation',
  'core_formation',
  'nascent_soul',
  'soul_transformation',
  'void_refinement',
  'body_integration',
  'mahayana',
  'tribulation',
  'true_immortal',
]

/** 当前可玩上限：化神 */
export const PLAYABLE_MAX_REALM: MajorRealm = 'soul_transformation'

export const MINOR_ORDER: MinorStage[] = ['early', 'mid', 'late', 'perfect']

export const REALM_NAMES: Record<MajorRealm, string> = {
  qi_refining: '炼气',
  foundation: '筑基',
  core_formation: '结丹',
  nascent_soul: '元婴',
  soul_transformation: '化神',
  void_refinement: '炼虚',
  body_integration: '合体',
  mahayana: '大乘',
  tribulation: '渡劫',
  true_immortal: '真仙',
}

export const MINOR_NAMES: Record<MinorStage, string> = {
  early: '初期',
  mid: '中期',
  late: '后期',
  perfect: '大圆满',
}

export const LIFESPAN: Record<MajorRealm, number> = {
  qi_refining: 100,
  foundation: 250,
  core_formation: 500,
  nascent_soul: 1000,
  soul_transformation: 2000,
  void_refinement: 4000,
  body_integration: 8000,
  mahayana: 12000,
  tribulation: 12000,
  true_immortal: 99999,
}

/** 从本境突破到下一境所需 flag */
export const BREAKTHROUGH_FLAG: Partial<Record<MajorRealm, string>> = {
  qi_refining: 'foundation_pill',
  foundation: 'core_materials',
  core_formation: 'nascent_item',
  nascent_soul: 'soul_item',
}

export const FLAG_ITEM_NAME: Record<string, string> = {
  foundation_pill: '筑基丹',
  core_materials: '结丹材料',
  nascent_item: '婴变灵物',
  soul_item: '化神神念',
}

export const FLAG_ITEM_HINT: Record<string, string> = {
  foundation_pill: '探险/坊市找「筑基丹」相关事件',
  core_materials: '筑基后找「结丹材料」类事件',
  nascent_item: '结丹后找「婴变」类机缘',
  soul_item: '元婴后找「化神」类天材/心境事件',
}

export function realmIndex(r: MajorRealm): number {
  return REALM_ORDER.indexOf(r)
}

export function formatRealm(realm: MajorRealm, layer: number, minor: MinorStage): string {
  if (realm === 'qi_refining') return `炼气第 ${layer} 层`
  if (realm === 'tribulation') return '渡劫期'
  if (realm === 'true_immortal') return '真仙'
  return `${REALM_NAMES[realm]}${MINOR_NAMES[minor]}`
}

export function cultivationNeed(realm: MajorRealm, layer: number, minor: MinorStage): number {
  if (realm === 'qi_refining') {
    return 50 + layer * 5
  }
  const base: Record<MinorStage, number> = {
    early: 120,
    mid: 150,
    late: 180,
    perfect: 220,
  }
  const mult = 1 + realmIndex(realm) * 0.28
  return Math.round(base[minor] * mult)
}

export function canMinorAdvance(realm: MajorRealm, layer: number, minor: MinorStage): boolean {
  if (realm === 'qi_refining') return layer < 13
  if (realmIndex(realm) > realmIndex(PLAYABLE_MAX_REALM)) return false
  if (realm === 'tribulation' || realm === 'true_immortal') return false
  return minor !== 'perfect'
}

export function nextMinor(minor: MinorStage): MinorStage {
  const i = MINOR_ORDER.indexOf(minor)
  return MINOR_ORDER[Math.min(i + 1, MINOR_ORDER.length - 1)]
}

export function nextMajor(realm: MajorRealm): MajorRealm | null {
  const i = realmIndex(realm)
  if (i < 0 || i >= REALM_ORDER.length - 1) return null
  const n = REALM_ORDER[i + 1]
  if (realmIndex(n) > realmIndex(PLAYABLE_MAX_REALM) && realm !== PLAYABLE_MAX_REALM) {
    // 允许从元婴突破到化神
  }
  if (realmIndex(n) > realmIndex(PLAYABLE_MAX_REALM)) return null
  return n
}

/** 化神大圆满且修为满 → 可通关证道 */
export function isWinReady(
  realm: MajorRealm,
  minor: MinorStage,
  cultivation: number,
): boolean {
  if (realm !== 'soul_transformation' || minor !== 'perfect') return false
  return cultivation >= cultivationNeed(realm, 0, minor)
}

export function isMvpWinRealm(realm: MajorRealm): boolean {
  return realmIndex(realm) >= realmIndex('soul_transformation')
}

export function breakthroughReady(
  realm: MajorRealm,
  layer: number,
  minor: MinorStage,
  cultivation: number,
  flags: string[],
): boolean {
  return getBreakthroughBlockers(realm, layer, minor, cultivation, flags).length === 0
}

export function getBreakthroughBlockers(
  realm: MajorRealm,
  layer: number,
  minor: MinorStage,
  cultivation: number,
  flags: string[],
): string[] {
  const need = cultivationNeed(realm, layer, minor)
  const blockers: string[] = []

  // 化神圆满：证道通关，不需要下一境材料
  if (realm === 'soul_transformation') {
    if (minor !== 'perfect')
      blockers.push(`需化神大圆满（当前${MINOR_NAMES[minor]}，修为满会自动小进阶）`)
    if (cultivation < need) blockers.push(`修为未满（${cultivation}/${need}）`)
    return blockers
  }

  if (realmIndex(realm) > realmIndex(PLAYABLE_MAX_REALM)) {
    blockers.push('已超出本版境界')
    return blockers
  }

  if (realm === 'qi_refining') {
    if (layer < 13) blockers.push(`炼气需到第 13 层（当前第 ${layer} 层）`)
    if (cultivation < need) blockers.push(`修为未满（${cultivation}/${need}）`)
    if (!flags.includes('foundation_pill'))
      blockers.push(`缺少【${FLAG_ITEM_NAME.foundation_pill}】→ ${FLAG_ITEM_HINT.foundation_pill}`)
    return blockers
  }

  // 筑基～元婴：圆满 + 修为满 + 材料
  if (minor !== 'perfect')
    blockers.push(`需${REALM_NAMES[realm]}大圆满（当前${MINOR_NAMES[minor]}）`)
  if (cultivation < need) blockers.push(`修为未满（${cultivation}/${need}）`)

  const flag = BREAKTHROUGH_FLAG[realm]
  if (flag && !flags.includes(flag)) {
    blockers.push(`缺少【${FLAG_ITEM_NAME[flag]}】→ ${FLAG_ITEM_HINT[flag]}`)
  }

  const next = nextMajor(realm)
  if (!next) blockers.push('已无更高可玩境界')

  return blockers
}

export type CultivationTipKind = 'progress' | 'auto' | 'blocked' | 'ready'

export interface CultivationTip {
  kind: CultivationTipKind
  title: string
  detail: string
}

export function getCultivationTip(
  realm: MajorRealm,
  layer: number,
  minor: MinorStage,
  cultivation: number,
  flags: string[],
): CultivationTip {
  const need = cultivationNeed(realm, layer, minor)
  const full = cultivation >= need
  const blockers = getBreakthroughBlockers(realm, layer, minor, cultivation, flags)

  if (realm === 'qi_refining' && layer < 13) {
    if (!full) {
      return {
        kind: 'progress',
        title: `修为 ${cultivation}/${need}`,
        detail: `满后自动升到炼气第 ${layer + 1} 层。本版终点：化神。`,
      }
    }
    return {
      kind: 'auto',
      title: '修为已满 · 可自动进层',
      detail: `再获得修为时将升到炼气第 ${layer + 1} 层。`,
    }
  }

  // 小层次自动进阶（含结丹、元婴、化神未圆满）
  if (realm !== 'qi_refining' && minor !== 'perfect') {
    if (!full) {
      return {
        kind: 'progress',
        title: `${REALM_NAMES[realm]}${MINOR_NAMES[minor]} · ${cultivation}/${need}`,
        detail: `满后自动进阶到${REALM_NAMES[realm]}${nextMinorLabel(minor)}。`,
      }
    }
    return {
      kind: 'auto',
      title: '修为已满 · 可自动进阶',
      detail: `再获得修为 → ${REALM_NAMES[realm]}${nextMinorLabel(minor)}。大境界需圆满后冲击。`,
    }
  }

  if (full && blockers.length === 0) {
    if (realm === 'soul_transformation') {
      return {
        kind: 'ready',
        title: '可以证道化神！',
        detail: '化神大圆满、修为已满。点击「冲击大境界」完成通关。',
      }
    }
    const next = nextMajor(realm)
    return {
      kind: 'ready',
      title: '可以冲击大境界！',
      detail: next
        ? `条件已齐，可冲击【${REALM_NAMES[next]}】（天劫有风险）。`
        : '条件已齐。',
    }
  }

  if (full && blockers.length > 0) {
    return {
      kind: 'blocked',
      title: '修为已满 · 尚不能突破',
      detail: blockers.map((b, i) => `${i + 1}. ${b}`).join(' '),
    }
  }

  if (realm === 'qi_refining' && layer >= 13) {
    return {
      kind: 'progress',
      title: `炼气第 13 层 · ${cultivation}/${need}`,
      detail: flags.includes('foundation_pill')
        ? '修为满后冲击筑基。'
        : '需【筑基丹】+ 修为满 → 冲击筑基。',
    }
  }

  if (minor === 'perfect') {
    const flag = BREAKTHROUGH_FLAG[realm]
    const next = nextMajor(realm)
    const item = flag ? FLAG_ITEM_NAME[flag] : ''
    return {
      kind: 'progress',
      title: `${REALM_NAMES[realm]}大圆满 · ${cultivation}/${need}`,
      detail:
        realm === 'soul_transformation'
          ? '修为满后可证道通关。'
          : flag && !flags.includes(flag)
            ? `修为满并取得【${item}】后可冲击${next ? REALM_NAMES[next] : '下一境'}。`
            : `修为满后可冲击${next ? REALM_NAMES[next] : '下一境'}。`,
    }
  }

  return {
    kind: 'progress',
    title: `修为 ${cultivation}/${need}`,
    detail: '闭关、探险、斗法增加修为。本版终点：化神。',
  }
}

function nextMinorLabel(minor: MinorStage): string {
  return MINOR_NAMES[nextMinor(minor)]
}

/** 事件是否适配当前境界 */
export function eventMatchesRealm(
  playerRealm: MajorRealm,
  minRealm?: MajorRealm,
  maxRealm?: MajorRealm,
): boolean {
  const p = realmIndex(playerRealm)
  if (minRealm != null && p < realmIndex(minRealm)) return false
  if (maxRealm != null && p > realmIndex(maxRealm)) return false
  return true
}
