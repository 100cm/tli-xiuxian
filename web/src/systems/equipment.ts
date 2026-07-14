import { getEquipDef } from '../content/equipment'
import type {
  ArtGrade,
  EquippedMap,
  EquipSlot,
  OwnedEquip,
  PlayerState,
} from '../domain/types'

let uidSeq = 0

export function newEquipUid(): string {
  uidSeq += 1
  return `eq_${Date.now().toString(36)}_${uidSeq}_${Math.floor(Math.random() * 1e4)}`
}

export function grantEquipment(
  state: PlayerState,
  defId: string,
  grade?: ArtGrade,
): { state: PlayerState; log: string; uid: string } {
  const def = getEquipDef(defId)
  if (!def) {
    return { state, log: '未知装备。', uid: '' }
  }
  const g = grade ?? def.grade
  const uid = newEquipUid()
  const item: OwnedEquip = { uid, defId, grade: g }
  const inventory = [...state.inventory, item]
  // 该部位空着则自动穿上
  let equipped = { ...state.equipped }
  let auto = false
  if (!equipped[def.slot]) {
    equipped[def.slot] = uid
    auto = true
  }
  return {
    state: { ...state, inventory, equipped },
    log: auto
      ? `获得并装备【${def.name}】（${slotHint(def.slot)}）`
      : `获得【${def.name}】，已入囊中（${slotHint(def.slot)}已有装备）`,
    uid,
  }
}

function slotHint(slot: EquipSlot): string {
  const m: Record<EquipSlot, string> = {
    weapon: '兵刃',
    offhand: '副宝',
    head: '冠盔',
    body: '道袍',
    hands: '护腕',
    feet: '云履',
    neck: '玉佩',
    ring: '戒指',
  }
  return m[slot]
}

export function equipItem(state: PlayerState, uid: string): PlayerState {
  const item = state.inventory.find((i) => i.uid === uid)
  if (!item) return state
  const def = getEquipDef(item.defId)
  if (!def) return state
  return {
    ...state,
    equipped: { ...state.equipped, [def.slot]: uid },
  }
}

export function unequipSlot(state: PlayerState, slot: EquipSlot): PlayerState {
  const equipped = { ...state.equipped }
  delete equipped[slot]
  return { ...state, equipped }
}

/** 品阶回收价（低于坊市买入价） */
export function sellPriceOfGrade(grade: ArtGrade): number {
  const map: Record<ArtGrade, number> = {
    mortal: 12,
    yellow: 36,
    mysterious: 88,
    earth: 160,
    heaven: 280,
    immortal: 888,
  }
  return map[grade] ?? 10
}

/** 神级专属回收价（极难获取，卖了血亏） */
const GOD_SELL: Record<string, number> = {
  eternity: 1666,
  lun_ge_mouth: 1666,
}

export function sellPriceOfItem(item: OwnedEquip): number {
  const def = getEquipDef(item.defId)
  if (def && GOD_SELL[def.id] != null) return GOD_SELL[def.id]
  // 以实际品阶为准；若无定义则按 def 品阶
  return sellPriceOfGrade(item.grade ?? def?.grade ?? 'mortal')
}

/**
 * 出售装备：从背包移除并增加灵石。
 * 若正在穿戴，会先卸下再卖。
 */
export function sellEquipment(
  state: PlayerState,
  uid: string,
): { state: PlayerState; log: string; price: number } {
  const item = state.inventory.find((i) => i.uid === uid)
  if (!item) {
    return { state, log: '找不到这件装备。', price: 0 }
  }
  const def = getEquipDef(item.defId)
  const price = sellPriceOfItem(item)
  const name = def?.name ?? item.defId

  let equipped = { ...state.equipped }
  for (const [slot, id] of Object.entries(equipped)) {
    if (id === uid) delete equipped[slot as EquipSlot]
  }

  const inventory = state.inventory.filter((i) => i.uid !== uid)
  return {
    state: {
      ...state,
      inventory,
      equipped,
      spiritStones: state.spiritStones + price,
    },
    log: `出售【${name}】，获得灵石 ${price}。`,
    price,
  }
}

export function getEquippedItem(
  state: PlayerState,
  slot: EquipSlot,
): OwnedEquip | undefined {
  const uid = state.equipped[slot]
  if (!uid) return undefined
  return state.inventory.find((i) => i.uid === uid)
}

export function starterLoadout(heroId: string): {
  inventory: OwnedEquip[]
  equipped: EquippedMap
} {
  // 显式覆盖 + 标签启发，保证 26 形态都有合理起手
  const byHero: Record<string, string[]> = {
    rehan_anger: ['rusty_blade', 'linen_robe', 'cloth_bracer', 'straw_shoes'],
    rehan_shadow: ['rusty_blade', 'linen_robe', 'cloth_bracer', 'straw_shoes'],
    carino_glory: ['shadow_dagger', 'linen_robe', 'straw_shoes', 'copper_ring'],
    carino_lethal: ['shadow_dagger', 'linen_robe', 'straw_shoes', 'copper_ring'],
    carino_zealot: ['rusty_blade', 'linen_robe', 'cloth_bracer', 'straw_shoes'],
    erika_wind: ['shadow_dagger', 'linen_robe', 'straw_shoes', 'copper_ring'],
    erika_lightning: ['shadow_dagger', 'linen_robe', 'straw_shoes', 'copper_ring'],
    erika_vendetta: ['shadow_dagger', 'linen_robe', 'cloth_bracer', 'straw_shoes'],
    bing_blast: ['rusty_blade', 'linen_robe', 'straw_shoes', 'copper_ring'],
    bing_creative: ['cloth_cap', 'linen_robe', 'stone_pendant', 'copper_ring'],
    gemma_flame: ['cloth_cap', 'linen_robe', 'stone_pendant', 'copper_ring'],
    gemma_frost: ['cloth_cap', 'linen_robe', 'stone_pendant', 'copper_ring'],
    gemma_fusion: ['cloth_cap', 'linen_robe', 'stone_pendant', 'copper_ring'],
    thea_wisdom: ['cloth_cap', 'linen_robe', 'stone_pendant', 'copper_ring'],
    thea_incarnation: ['rusty_blade', 'linen_robe', 'cloth_bracer', 'straw_shoes'],
    thea_blasphemer: ['cloth_cap', 'linen_robe', 'stone_pendant', 'copper_ring'],
    youga_illusion: ['cloth_cap', 'linen_robe', 'stone_pendant', 'copper_ring'],
    youga_elapse: ['cloth_cap', 'linen_robe', 'stone_pendant', 'copper_ring'],
    moto_order: ['rusty_blade', 'linen_robe', 'cloth_bracer', 'straw_shoes'],
    moto_charge: ['rusty_blade', 'linen_robe', 'cloth_bracer', 'straw_shoes'],
    rosa_chariot: ['rusty_blade', 'linen_robe', 'cloth_bracer', 'straw_shoes'],
    rosa_blade: ['rusty_blade', 'linen_robe', 'stone_pendant', 'straw_shoes'],
    iris_growing: ['cloth_cap', 'linen_robe', 'stone_pendant', 'copper_ring'],
    iris_vigilant: ['cloth_cap', 'linen_robe', 'stone_pendant', 'copper_ring'],
    selena_tide: ['cloth_cap', 'linen_robe', 'stone_pendant', 'copper_ring'],
    sage_licorice: ['cloth_cap', 'linen_robe', 'stone_pendant', 'copper_ring'],
  }
  const ids = byHero[heroId] ?? ['rusty_blade', 'linen_robe', 'straw_shoes']
  const inventory: OwnedEquip[] = []
  const equipped: EquippedMap = {}
  for (const defId of ids) {
    const def = getEquipDef(defId)
    if (!def) continue
    const uid = newEquipUid()
    inventory.push({ uid, defId, grade: def.grade })
    equipped[def.slot] = uid
  }
  return { inventory, equipped }
}
