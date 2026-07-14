import type { OriginDef } from '../domain/types'

export const ORIGINS: OriginDef[] = [
  {
    id: 'villager',
    name: '山村猎户',
    description: '出身寒微，体魄尚可，灵石拮据。',
    age: 18,
    spiritStones: 15,
    attrDelta: { con: 1, str: 1, luck: -1 },
  },
  {
    id: 'apothecary',
    name: '坊市药徒',
    description: '识得草木，开局略有积蓄，略通药理。',
    age: 17,
    spiritStones: 40,
    attrDelta: { int: 1, will: 1 },
    startArtIds: ['stoneskin'],
  },
  {
    id: 'sect_servant',
    name: '宗门杂役',
    description: '见过修士威仪，略懂规矩，却身无长物。',
    age: 16,
    spiritStones: 25,
    attrDelta: { will: 1, luck: 1 },
  },
  {
    id: 'orphan',
    name: '散修孤儿',
    description: '无依无靠，身法机敏，万事靠自己。',
    age: 15,
    spiritStones: 10,
    attrDelta: { agi: 2, con: -1, luck: 1 },
  },
  {
    id: 'merchant_guard',
    name: '商队护卫',
    description: '见多识广，灵石稍丰，杀伐果决。',
    age: 20,
    spiritStones: 55,
    attrDelta: { str: 1, luck: 1 },
  },
]

export function getOrigin(id: string): OriginDef {
  const o = ORIGINS.find((x) => x.id === id)
  if (!o) throw new Error(`未知出身: ${id}`)
  return o
}
