import type { ArtGrade, EquipDef, EquipSlot } from '../domain/types'

export const EQUIP_SLOTS: { id: EquipSlot; name: string }[] = [
  { id: 'weapon', name: '兵刃' },
  { id: 'offhand', name: '副宝' },
  { id: 'head', name: '冠盔' },
  { id: 'body', name: '道袍' },
  { id: 'hands', name: '护腕' },
  { id: 'feet', name: '云履' },
  { id: 'neck', name: '玉佩' },
  { id: 'ring', name: '戒指' },
]

export const SLOT_NAME: Record<EquipSlot, string> = Object.fromEntries(
  EQUIP_SLOTS.map((s) => [s.id, s.name]),
) as Record<EquipSlot, string>

/** 纸娃娃布局顺序（用于 UI） */
export const DOLL_LAYOUT: (EquipSlot | null)[][] = [
  [null, 'head', null],
  ['weapon', 'body', 'offhand'],
  ['hands', 'neck', 'ring'],
  [null, 'feet', null],
]

export const EQUIPMENT: EquipDef[] = [
  // —— 兵刃 ——
  {
    id: 'rusty_blade',
    name: '锈蚀铁刃',
    slot: 'weapon',
    grade: 'mortal',
    description: '俗物铁刀，聊胜于无。',
    effects: [{ type: 'attr', key: 'str', value: 1 }],
  },
  {
    id: 'qingfeng_sword',
    name: '青锋剑',
    slot: 'weapon',
    grade: 'yellow',
    description: '黄阶飞剑雏形，锋芒初露。',
    effects: [
      { type: 'attr', key: 'str', value: 2 },
      { type: 'combat', key: 'melee', value: 6 },
    ],
  },
  {
    id: 'flame_spear',
    name: '赤焰枪',
    slot: 'weapon',
    grade: 'mysterious',
    description: '枪头隐有火纹，破阵杀敌。',
    effects: [
      { type: 'attr', key: 'str', value: 3 },
      { type: 'attr', key: 'int', value: 1 },
      { type: 'combat', key: 'fire', value: 8 },
    ],
  },
  {
    id: 'shadow_dagger',
    name: '影刺',
    slot: 'weapon',
    grade: 'yellow',
    description: '短刃利于突袭。',
    effects: [
      { type: 'attr', key: 'agi', value: 2 },
      { type: 'checkBonus', tags: ['stealth', 'combat'], value: 4 },
    ],
  },
  // —— 副宝 ——
  {
    id: 'wood_shield',
    name: '木盾',
    slot: 'offhand',
    grade: 'mortal',
    description: '寻常木盾，挡得住一击。',
    effects: [
      { type: 'attr', key: 'con', value: 1 },
      { type: 'maxHp', value: 8 },
    ],
  },
  {
    id: 'spirit_mirror',
    name: '照神镜',
    slot: 'offhand',
    grade: 'yellow',
    description: '可映照心魔虚影。',
    effects: [
      { type: 'attr', key: 'will', value: 2 },
      { type: 'checkBonus', tags: ['insight', 'breakthrough'], value: 5 },
    ],
  },
  {
    id: 'fire_gourd',
    name: '火云葫芦',
    slot: 'offhand',
    grade: 'mysterious',
    description: '内蕴真火，辅攻辅修。',
    effects: [
      { type: 'attr', key: 'int', value: 2 },
      { type: 'cultivateMult', value: 0.05 },
    ],
  },
  // —— 冠盔 ——
  {
    id: 'cloth_cap',
    name: '青布帽',
    slot: 'head',
    grade: 'mortal',
    description: '寻常布帽。',
    effects: [{ type: 'attr', key: 'con', value: 1 }],
  },
  {
    id: 'bronze_helm',
    name: '青铜盔',
    slot: 'head',
    grade: 'yellow',
    description: '略有灵性的护头铜盔。',
    effects: [
      { type: 'attr', key: 'con', value: 2 },
      { type: 'maxHp', value: 10 },
    ],
  },
  {
    id: 'mind_crown',
    name: '凝神冠',
    slot: 'head',
    grade: 'mysterious',
    description: '安神定志，利于神识。',
    effects: [
      { type: 'attr', key: 'int', value: 2 },
      { type: 'attr', key: 'will', value: 1 },
    ],
  },
  // —— 道袍 ——
  {
    id: 'linen_robe',
    name: '麻衣',
    slot: 'body',
    grade: 'mortal',
    description: '粗麻道衣。',
    effects: [
      { type: 'attr', key: 'con', value: 1 },
      { type: 'maxHp', value: 6 },
    ],
  },
  {
    id: 'cloud_robe',
    name: '流云袍',
    slot: 'body',
    grade: 'yellow',
    description: '轻盈护体，略聚灵气。',
    effects: [
      { type: 'attr', key: 'con', value: 2 },
      { type: 'attr', key: 'agi', value: 1 },
      { type: 'maxHp', value: 12 },
    ],
  },
  {
    id: 'iron_scale',
    name: '玄铁鳞甲',
    slot: 'body',
    grade: 'mysterious',
    description: '硬抗之力出众。',
    effects: [
      { type: 'attr', key: 'con', value: 3 },
      { type: 'attr', key: 'str', value: 1 },
      { type: 'maxHp', value: 20 },
      { type: 'checkBonus', tags: ['endure', 'defend'], value: 6 },
    ],
  },
  // —— 护腕 ——
  {
    id: 'cloth_bracer',
    name: '布护腕',
    slot: 'hands',
    grade: 'mortal',
    description: '护腕而已。',
    effects: [{ type: 'attr', key: 'str', value: 1 }],
  },
  {
    id: 'beast_bracer',
    name: '兽皮护腕',
    slot: 'hands',
    grade: 'yellow',
    description: '增力稳握。',
    effects: [
      { type: 'attr', key: 'str', value: 2 },
      { type: 'combat', key: 'melee', value: 4 },
    ],
  },
  {
    id: 'silk_glove',
    name: '灵丝手套',
    slot: 'hands',
    grade: 'mysterious',
    description: '利于施法结印。',
    effects: [
      { type: 'attr', key: 'int', value: 2 },
      { type: 'attr', key: 'agi', value: 1 },
    ],
  },
  // —— 云履 ——
  {
    id: 'straw_shoes',
    name: '草履',
    slot: 'feet',
    grade: 'mortal',
    description: '行走尚可。',
    effects: [{ type: 'attr', key: 'agi', value: 1 }],
  },
  {
    id: 'wind_boots',
    name: '疾风靴',
    slot: 'feet',
    grade: 'yellow',
    description: '身法略快。',
    effects: [
      { type: 'attr', key: 'agi', value: 2 },
      { type: 'checkBonus', tags: ['escape', 'explore'], value: 5 },
    ],
  },
  {
    id: 'cloud_step',
    name: '踏云履',
    slot: 'feet',
    grade: 'mysterious',
    description: '如履平地，利于遁逃与猎杀。',
    effects: [
      { type: 'attr', key: 'agi', value: 3 },
      { type: 'checkBonus', tags: ['escape', 'stealth'], value: 8 },
    ],
  },
  // —— 玉佩 ——
  {
    id: 'stone_pendant',
    name: '石玉佩',
    slot: 'neck',
    grade: 'mortal',
    description: '粗玉而已。',
    effects: [{ type: 'attr', key: 'luck', value: 1 }],
  },
  {
    id: 'spirit_jade',
    name: '聚灵玉',
    slot: 'neck',
    grade: 'yellow',
    description: '微聚灵气，助修炼。',
    effects: [
      { type: 'attr', key: 'int', value: 1 },
      { type: 'cultivateMult', value: 0.06 },
    ],
  },
  {
    id: 'dao_heart_pendant',
    name: '定心佩',
    slot: 'neck',
    grade: 'mysterious',
    description: '稳固道心。',
    effects: [
      { type: 'attr', key: 'will', value: 2 },
      { type: 'attr', key: 'luck', value: 1 },
      { type: 'checkBonus', tags: ['breakthrough'], value: 6 },
    ],
  },
  // —— 戒指 ——
  {
    id: 'copper_ring',
    name: '铜戒',
    slot: 'ring',
    grade: 'mortal',
    description: '市井铜戒。',
    effects: [{ type: 'attr', key: 'luck', value: 1 }],
  },
  {
    id: 'storage_ring',
    name: '微尘戒',
    slot: 'ring',
    grade: 'yellow',
    description: '简陋储物戒，亦增气运。',
    effects: [
      { type: 'attr', key: 'luck', value: 2 },
      { type: 'attr', key: 'int', value: 1 },
    ],
  },
  {
    id: 'blood_ring',
    name: '血纹戒',
    slot: 'ring',
    grade: 'mysterious',
    description: '杀伐之气，增力亦增孽缘。',
    effects: [
      { type: 'attr', key: 'str', value: 2 },
      { type: 'combat', key: 'burst', value: 8 },
    ],
  },
]

export function getEquipDef(id: string): EquipDef | undefined {
  return EQUIPMENT.find((e) => e.id === id)
}

export function equipsBySlot(slot: EquipSlot): EquipDef[] {
  return EQUIPMENT.filter((e) => e.slot === slot)
}

export function randomEquipForDrop(
  gradeBias: ArtGrade = 'yellow',
): EquipDef {
  const pool = EQUIPMENT.filter((e) => {
    const order = ['mortal', 'yellow', 'mysterious', 'earth', 'heaven', 'immortal']
    const g = order.indexOf(e.grade)
    const b = order.indexOf(gradeBias)
    return g <= b + 1 && g >= Math.max(0, b - 1)
  })
  return pool[Math.floor(Math.random() * pool.length)] ?? EQUIPMENT[0]
}
