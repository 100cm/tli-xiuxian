/**
 * 双修对象：三位天尊
 * 品级决定灵石消耗与收益倍率
 */
export type DualPartnerId = 'hanhong' | 'yujie' | 'xiguamei'

export type DualGrade = 'yellow' | 'mysterious' | 'earth'

export interface DualPartner {
  id: DualPartnerId
  name: string
  title: string
  grade: DualGrade
  gradeName: string
  /** 基础灵石消耗（会随境界略涨） */
  baseCost: number
  /** 修为倍率（相对原闭关3月基数） */
  cultMult: number
  /** 功法熟练度倍率 */
  artXpMult: number
  /** 气血恢复比例（最大气血） */
  healHpPct: number
  /** 伤势减少层数 */
  healInjury: number
  blurb: string
  style: string
}

export const DUAL_PARTNERS: DualPartner[] = [
  {
    id: 'xiguamei',
    name: '西瓜妹天尊',
    title: '瓜田证道·西瓜妹',
    grade: 'yellow',
    gradeName: '黄阶',
    baseCost: 25,
    cultMult: 1.35,
    artXpMult: 1.2,
    healHpPct: 0.25,
    healInjury: 1,
    blurb: '性子活泼，双修温和，花费较低，适合常修。',
    style: '温和·稳当',
  },
  {
    id: 'yujie',
    name: '雨姐天尊',
    title: '听雨楼主·雨姐',
    grade: 'mysterious',
    gradeName: '玄阶',
    baseCost: 55,
    cultMult: 1.75,
    artXpMult: 1.55,
    healHpPct: 0.45,
    healInjury: 2,
    blurb: '雨意绵长，功法共鸣强，疗伤与精进兼备。',
    style: '绵密·共鸣',
  },
  {
    id: 'hanhong',
    name: '韩红天尊',
    title: '天歌一啸·韩红',
    grade: 'earth',
    gradeName: '地阶',
    baseCost: 100,
    cultMult: 2.35,
    artXpMult: 2.1,
    healHpPct: 0.7,
    healInjury: 3,
    blurb: '气势如虹，双修开销最大，修为与功法精进最猛。',
    style: '霸道·暴涨',
  },
]

export function getDualPartner(id: DualPartnerId): DualPartner {
  const p = DUAL_PARTNERS.find((x) => x.id === id)
  if (!p) throw new Error(`未知双修对象: ${id}`)
  return p
}

/** 实际灵石消耗：基础 × (1 + 境界系数) */
export function dualCultCost(baseCost: number, realmIndex: number): number {
  return Math.round(baseCost * (1 + realmIndex * 0.12))
}
