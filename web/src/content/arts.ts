import type { ArtDef, ArtGrade } from '../domain/types'

export const GRADE_NAMES: Record<ArtGrade, string> = {
  mortal: '凡',
  yellow: '黄',
  mysterious: '玄',
  earth: '地',
  heaven: '天',
  immortal: '仙',
}

export const GRADE_MULT: Record<ArtGrade, number> = {
  mortal: 0.85,
  yellow: 1,
  mysterious: 1.2,
  earth: 1.45,
  heaven: 1.75,
  immortal: 2.1,
}

export const GRADE_MAX_LEVEL: Record<ArtGrade, number> = {
  mortal: 4,
  yellow: 6,
  mysterious: 8,
  earth: 10,
  heaven: 10,
  immortal: 10,
}

/** MVP：火炬主动技能子集，中文原名 */
export const ARTS: ArtDef[] = [
  {
    id: 'leap_attack',
    name: '跃击',
    tags: ['位移', '攻击', '近战', '物理', '力量'],
    description: '跃至目标位置猛击地面。映射：强突、破阵选项。',
    baseGrade: 'yellow',
    effects: [
      { type: 'attr', key: 'str', value: 1 },
      { type: 'combat', key: 'melee', value: 10 },
      { type: 'unlockChoice', choiceFlag: 'art_leap' },
      { type: 'checkBonus', tags: ['melee', 'explore'], value: 5 },
    ],
    enabled: true,
  },
  {
    id: 'focused_slash',
    name: '专注斩',
    tags: ['攻击', '近战', '物理', '挥斩', '力量', '敏捷'],
    description: '扇形挥击，斩击更强。映射：近战爆发。',
    baseGrade: 'yellow',
    effects: [
      { type: 'attr', key: 'str', value: 1 },
      { type: 'attr', key: 'agi', value: 1 },
      { type: 'combat', key: 'slash', value: 12 },
      { type: 'unlockChoice', choiceFlag: 'art_slash' },
    ],
    enabled: true,
  },
  {
    id: 'whirlwind',
    name: '旋风斩',
    tags: ['攻击', '近战', '引导', '物理', '挥斩'],
    description: '引导环斩。映射：群战优势。',
    baseGrade: 'mysterious',
    effects: [
      { type: 'attr', key: 'str', value: 2 },
      { type: 'combat', key: 'aoe', value: 15 },
      { type: 'unlockChoice', choiceFlag: 'art_whirl' },
    ],
    enabled: true,
  },
  {
    id: 'blink',
    name: '闪现',
    tags: ['位移', '法术'],
    description: '短距位移。映射：逃跑、穿阵。',
    baseGrade: 'yellow',
    effects: [
      { type: 'attr', key: 'agi', value: 2 },
      { type: 'checkBonus', tags: ['escape', 'stealth'], value: 12 },
      { type: 'unlockChoice', choiceFlag: 'art_blink' },
    ],
    enabled: true,
  },
  {
    id: 'split_shot',
    name: '分裂射击',
    tags: ['攻击', '投射物', '物理', '远程', '敏捷'],
    description: '多矢齐发。映射：远程猎杀。',
    baseGrade: 'yellow',
    effects: [
      { type: 'attr', key: 'agi', value: 2 },
      { type: 'combat', key: 'ranged', value: 12 },
      { type: 'unlockChoice', choiceFlag: 'art_split_shot' },
    ],
    enabled: true,
  },
  {
    id: 'ice_shot',
    name: '寒冰射击',
    tags: ['冰冷', '投射物', '攻击', '远程', '敏捷'],
    description: '冰锥射击并爆炸。映射：远程控场。',
    baseGrade: 'mysterious',
    effects: [
      { type: 'attr', key: 'agi', value: 1 },
      { type: 'attr', key: 'int', value: 1 },
      { type: 'combat', key: 'cold', value: 12 },
      { type: 'unlockChoice', choiceFlag: 'art_ice_shot' },
    ],
    enabled: true,
  },
  {
    id: 'stoneskin',
    name: '石肤术',
    tags: ['持续', '防护', '法术'],
    description: '获得伤害吸收防护。映射：减伤、硬抗。',
    baseGrade: 'yellow',
    effects: [
      { type: 'attr', key: 'con', value: 2 },
      { type: 'checkBonus', tags: ['endure', 'breakthrough', 'defend'], value: 10 },
      { type: 'unlockChoice', choiceFlag: 'art_stoneskin' },
    ],
    enabled: true,
  },
  {
    id: 'split_firebolt',
    name: '裂变火球',
    tags: ['法术', '投射物', '火焰', '智慧'],
    description: '火球分裂。映射：术法输出。',
    baseGrade: 'yellow',
    effects: [
      { type: 'attr', key: 'int', value: 2 },
      { type: 'combat', key: 'fire', value: 12 },
      { type: 'cultivateMult', value: 0.05 },
      { type: 'unlockChoice', choiceFlag: 'art_firebolt' },
    ],
    enabled: true,
  },
  {
    id: 'chain_lightning',
    name: '闪电链',
    tags: ['法术', '闪电', '连锁', '智慧'],
    description: '闪电弹射。映射：多目标术法。',
    baseGrade: 'mysterious',
    effects: [
      { type: 'attr', key: 'int', value: 2 },
      { type: 'combat', key: 'lightning', value: 14 },
      { type: 'unlockChoice', choiceFlag: 'art_chain' },
    ],
    enabled: true,
  },
  {
    id: 'flame_slash',
    name: '烈焰斩',
    tags: ['攻击', '近战', '火焰', '挥斩', '力量'],
    description: '火焰挥斩。映射：火系近战。',
    baseGrade: 'mysterious',
    effects: [
      { type: 'attr', key: 'str', value: 1 },
      { type: 'attr', key: 'int', value: 1 },
      { type: 'combat', key: 'fire_melee', value: 14 },
      { type: 'unlockChoice', choiceFlag: 'art_flame_slash' },
    ],
    enabled: true,
  },
  {
    id: 'frost_shield',
    name: '寒冰盾',
    tags: ['法术', '冰冷', '防护'],
    description: '防护并环绕寒冰。映射：防御与反击。',
    baseGrade: 'yellow',
    effects: [
      { type: 'attr', key: 'con', value: 1 },
      { type: 'attr', key: 'int', value: 1 },
      { type: 'checkBonus', tags: ['defend'], value: 8 },
      { type: 'unlockChoice', choiceFlag: 'art_frost_shield' },
    ],
    enabled: true,
  },
  {
    id: 'shadow_dash',
    name: '暗影冲刺',
    tags: ['法术', '位移', '腐蚀'],
    description: '暗影位移并减速。映射：潜行突进。',
    baseGrade: 'mysterious',
    effects: [
      { type: 'attr', key: 'agi', value: 2 },
      { type: 'checkBonus', tags: ['stealth', 'escape'], value: 8 },
      { type: 'unlockChoice', choiceFlag: 'art_shadow_dash' },
    ],
    enabled: true,
  },
  {
    id: 'blizzard',
    name: '暴风雪',
    tags: ['法术', '冰冷', '范围', '智慧'],
    description: '区域冰雪打击。映射：范围术法。',
    baseGrade: 'mysterious',
    effects: [
      { type: 'attr', key: 'int', value: 2 },
      { type: 'combat', key: 'cold_aoe', value: 14 },
      { type: 'unlockChoice', choiceFlag: 'art_blizzard' },
    ],
    enabled: true,
  },
  {
    id: 'hammer_of_ash',
    name: '灰烬之锤',
    tags: ['火焰', '攻击', '近战', '破击', '力量'],
    description: '猛击与灰烬投射。映射：破击爆发。',
    baseGrade: 'mysterious',
    effects: [
      { type: 'attr', key: 'str', value: 2 },
      { type: 'combat', key: 'smash', value: 15 },
      { type: 'unlockChoice', choiceFlag: 'art_ash_hammer' },
    ],
    enabled: true,
  },
  {
    id: 'rain_of_arrows',
    name: '箭雨',
    tags: ['攻击', '远程', '物理', '投射物', '敏捷'],
    description: '箭矢如雨。映射：远程群伤。',
    baseGrade: 'mysterious',
    effects: [
      { type: 'attr', key: 'agi', value: 2 },
      { type: 'combat', key: 'ranged_aoe', value: 14 },
      { type: 'unlockChoice', choiceFlag: 'art_arrow_rain' },
    ],
    enabled: true,
  },
  {
    id: 'ring_of_ice',
    name: '冰环术',
    tags: ['法术', '冰冷', '范围', '智慧'],
    description: '自身冰环。映射：近身术法。',
    baseGrade: 'yellow',
    effects: [
      { type: 'attr', key: 'int', value: 1 },
      { type: 'combat', key: 'cold', value: 10 },
      { type: 'unlockChoice', choiceFlag: 'art_ice_ring' },
    ],
    enabled: true,
  },
  {
    id: 'shadow_shot',
    name: '暗影弹',
    tags: ['法术', '腐蚀', '投射物', '智慧'],
    description: '腐蚀弹与沼泽联动。映射：魔道术法。',
    baseGrade: 'mysterious',
    effects: [
      { type: 'attr', key: 'int', value: 2 },
      { type: 'combat', key: 'erosion', value: 12 },
      { type: 'eventWeight', tags: ['demon'], mult: 1.1 },
      { type: 'unlockChoice', choiceFlag: 'art_shadow_bolt' },
    ],
    enabled: true,
  },
  {
    id: 'resurrection_warcry',
    name: '复苏战吼',
    tags: ['战吼', '范围', '回复'],
    description: '战吼虚弱敌人并回复。映射：聚势回血。',
    baseGrade: 'yellow',
    effects: [
      { type: 'attr', key: 'con', value: 1 },
      { type: 'attr', key: 'will', value: 1 },
      { type: 'unlockChoice', choiceFlag: 'art_warcry' },
      { type: 'checkBonus', tags: ['social', 'combat'], value: 6 },
    ],
    enabled: true,
  },
  {
    id: 'scorching_beam',
    name: '灼热射线',
    tags: ['法术', '火焰', '引导', '射线', '智慧'],
    description: '引导火焰射线。映射：持续术法。',
    baseGrade: 'mysterious',
    effects: [
      { type: 'attr', key: 'int', value: 2 },
      { type: 'cultivateMult', value: 0.06 },
      { type: 'combat', key: 'fire_beam', value: 13 },
      { type: 'unlockChoice', choiceFlag: 'art_beam' },
    ],
    enabled: true,
  },
  {
    id: 'double_thrusts',
    name: '双重突刺',
    tags: ['攻击', '近战', '物理', '影袭', '敏捷'],
    description: '两连突刺。映射：刺客连击。',
    baseGrade: 'yellow',
    effects: [
      { type: 'attr', key: 'agi', value: 2 },
      { type: 'combat', key: 'thrust', value: 11 },
      { type: 'unlockChoice', choiceFlag: 'art_thrust' },
    ],
    enabled: true,
  },
]

export function getArt(id: string): ArtDef | undefined {
  return ARTS.find((a) => a.id === id)
}

export function getEnabledArts(): ArtDef[] {
  return ARTS.filter((a) => a.enabled)
}
