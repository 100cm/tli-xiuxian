import type { GameEvent } from '../domain/types'

/**
 * 坊市专属事件池（与历练/探险完全独立）
 * 定位：天材地宝、突破材料、装备 —— 高价灵石交易
 */
export const MARKET_EVENTS: GameEvent[] = [
  // ── 炼气 / 通用低阶 ──
  {
    id: 'mkt_foundation_pill_stall',
    title: '筑基丹专柜',
    body: '丹阁柜台摆着一枚封缄严密的筑基丹，标价不菲。掌柜只收灵石，概不赊欠。',
    tags: ['market', 'breakthrough'],
    maxRealm: 'qi_refining',
    weight: 16,
    choices: [
      {
        id: 'buy',
        text: '重金买下筑基丹',
        costStones: 120,
        outcomes: [
          { weight: 85, log: '货真价实，筑基丹入手。', flags: ['foundation_pill'] },
          { weight: 15, log: '成色略差，仍可用。', flags: ['foundation_pill'], daoHeart: -1 },
        ],
      },
      {
        id: 'bargain',
        text: '砍价再买',
        costStones: 95,
        requireAttr: { key: 'luck', min: 5 },
        outcomes: [
          { weight: 60, log: '砍下一截价，仍是真丹。', flags: ['foundation_pill'] },
          { weight: 40, log: '掌柜翻脸不卖，你白费口舌。' },
        ],
      },
      {
        id: 'leave',
        text: '买不起，走开',
        outcomes: [{ weight: 100, log: '你记下铺号，改日再来。' }],
      },
    ],
  },
  {
    id: 'mkt_yellow_gear_bundle',
    title: '黄阶法器架',
    body: '兵器架上摆着数件黄阶法器，每件都标着「一口价」。',
    tags: ['market', 'loot'],
    maxRealm: 'foundation',
    weight: 14,
    choices: [
      {
        id: 'sword',
        text: '购入青锋剑',
        costStones: 80,
        outcomes: [
          {
            weight: 100,
            log: '青锋入手，寒光凛凛。',
            equipId: 'qingfeng_sword',
            equipGrade: 'yellow',
          },
        ],
      },
      {
        id: 'boots',
        text: '购入疾风靴',
        costStones: 70,
        outcomes: [
          { weight: 100, log: '疾风靴穿上身法轻了几分。', equipId: 'wind_boots', equipGrade: 'yellow' },
        ],
      },
      {
        id: 'jade',
        text: '购入聚灵玉',
        costStones: 90,
        outcomes: [
          { weight: 100, log: '聚灵玉温润，助益修炼。', equipId: 'spirit_jade', equipGrade: 'yellow' },
        ],
      },
      {
        id: 'leave',
        text: '只看不买',
        outcomes: [{ weight: 100, log: '你逛了一圈离开。' }],
      },
    ],
  },
  {
    id: 'mkt_spirit_herb_box',
    title: '天材地宝匣',
    body: '宝匣里陈列灵参、玉髓、火精石等天材地宝，皆可辅助修炼，价格吓人。',
    tags: ['market', 'loot'],
    minLayer: 5,
    maxRealm: 'foundation',
    weight: 13,
    choices: [
      {
        id: 'buy_cult',
        text: '买下「聚气套装」服下',
        costStones: 100,
        outcomes: [
          { weight: 100, log: '天材入体，修为暴涨一截。', cultivation: 45, hp: 10 },
        ],
      },
      {
        id: 'buy_heal',
        text: '买下「续命灵浆」',
        costStones: 85,
        outcomes: [
          {
            weight: 100,
            log: '伤势大好，气血充盈。',
            hp: 40,
            injury: -2,
          },
        ],
      },
      {
        id: 'leave',
        text: '囊中羞涩',
        outcomes: [{ weight: 100, log: '你摸摸储物袋离开。' }],
      },
    ],
  },

  // ── 筑基 ──
  {
    id: 'mkt_core_material_shop',
    title: '结丹辅材专卖',
    body: '丹堂内柜摆着结丹所需辅材：金髓液、凝丹砂，明码标价，只认灵石。',
    tags: ['market', 'breakthrough'],
    minRealm: 'foundation',
    maxRealm: 'foundation',
    weight: 18,
    choices: [
      {
        id: 'buy',
        text: '全套买下',
        costStones: 180,
        outcomes: [
          { weight: 90, log: '结丹材料齐备！', flags: ['core_materials'] },
          { weight: 10, log: '成色一般，但够用。', flags: ['core_materials'], daoHeart: -1 },
        ],
      },
      {
        id: 'half',
        text: '只买一半碰运气',
        costStones: 100,
        outcomes: [
          { weight: 35, log: '你拼凑成功。', flags: ['core_materials'] },
          { weight: 65, log: '缺关键一味，钱白花。', daoHeart: -2 },
        ],
      },
      {
        id: 'leave',
        text: '改日再议',
        outcomes: [{ weight: 100, log: '你退出丹堂。' }],
      },
    ],
  },
  {
    id: 'mkt_xuan_armor',
    title: '玄阶软甲拍卖',
    body: '坊市内场正在拍卖一件玄阶软甲，起拍价已不低，水很深。',
    tags: ['market', 'loot'],
    minRealm: 'foundation',
    maxRealm: 'core_formation',
    weight: 12,
    choices: [
      {
        id: 'bid',
        text: '一口价拍下',
        costStones: 220,
        outcomes: [
          {
            weight: 100,
            log: '玄铁鳞甲入手。',
            equipId: 'iron_scale',
            equipGrade: 'mysterious',
          },
        ],
      },
      {
        id: 'robe',
        text: '改买旁边流云袍',
        costStones: 110,
        outcomes: [
          { weight: 100, log: '流云袍入手。', equipId: 'cloud_robe', equipGrade: 'yellow' },
        ],
      },
      {
        id: 'leave',
        text: '不参与',
        outcomes: [{ weight: 100, log: '你退出内场。' }],
      },
    ],
  },
  {
    id: 'mkt_foundation_treasure',
    title: '宝库租赁日',
    body: '坊市宝库今日对外开放租赁位：可花重金「租悟」一枚天材，临时大幅增益修为。',
    tags: ['market', 'loot'],
    minRealm: 'foundation',
    maxRealm: 'core_formation',
    weight: 11,
    choices: [
      {
        id: 'rent',
        text: '重金租悟天材',
        costStones: 150,
        outcomes: [
          { weight: 100, log: '感悟入体，修为猛涨。', cultivation: 55, daoHeart: 2 },
        ],
      },
      {
        id: 'cheap',
        text: '租低等灵材',
        costStones: 80,
        outcomes: [
          { weight: 100, log: '略有所得。', cultivation: 28 },
        ],
      },
      {
        id: 'leave',
        text: '离开',
        outcomes: [{ weight: 100, log: '你捂紧钱袋。' }],
      },
    ],
  },

  // ── 结丹 ──
  {
    id: 'mkt_nascent_fruit',
    title: '婴变灵果暗售',
    body: '黑市内柜：一枚婴变灵果，标价夸张。掌柜只认灵石，不问来历。',
    tags: ['market', 'breakthrough'],
    minRealm: 'core_formation',
    maxRealm: 'core_formation',
    weight: 17,
    choices: [
      {
        id: 'buy',
        text: '砸灵石买果',
        costStones: 280,
        outcomes: [
          { weight: 88, log: '婴变灵物入手！', flags: ['nascent_item'] },
          { weight: 12, log: '果有瑕，仍可勉强一用。', flags: ['nascent_item'], daoHeart: -2 },
        ],
      },
      {
        id: 'sample',
        text: '买「碎果残渣」碰运气',
        costStones: 140,
        outcomes: [
          { weight: 30, log: '残渣竟够用！', flags: ['nascent_item'] },
          { weight: 70, log: '完全不够，钱打水漂。', daoHeart: -3 },
        ],
      },
      {
        id: 'leave',
        text: '买不起',
        outcomes: [{ weight: 100, log: '你退出黑市。' }],
      },
    ],
  },
  {
    id: 'mkt_core_pill_set',
    title: '结丹后养护丹方',
    body: '丹师出售「金丹养护套装」：可短时大幅推进修为，价格不菲。',
    tags: ['market', 'loot'],
    minRealm: 'core_formation',
    maxRealm: 'nascent_soul',
    weight: 13,
    choices: [
      {
        id: 'buy',
        text: '全套购入服用',
        costStones: 200,
        outcomes: [
          { weight: 100, log: '丹力化开，修为大进，伤势也好了些。', cultivation: 60, hp: 25, injury: -1 },
        ],
      },
      {
        id: 'half',
        text: '只买主丹',
        costStones: 120,
        outcomes: [
          { weight: 100, log: '修为有涨。', cultivation: 35 },
        ],
      },
      {
        id: 'leave',
        text: '不买',
        outcomes: [{ weight: 100, log: '你离开丹铺。' }],
      },
    ],
  },
  {
    id: 'mkt_mystery_weapon',
    title: '玄阶兵刃展',
    body: '兵阁展出赤焰枪、影刺等玄阶兵刃，每件都配灵石天价标签。',
    tags: ['market', 'loot'],
    minRealm: 'core_formation',
    maxRealm: 'nascent_soul',
    weight: 12,
    choices: [
      {
        id: 'spear',
        text: '购入赤焰枪',
        costStones: 260,
        outcomes: [
          { weight: 100, log: '赤焰枪入手。', equipId: 'flame_spear', equipGrade: 'mysterious' },
        ],
      },
      {
        id: 'crown',
        text: '购入凝神冠',
        costStones: 240,
        outcomes: [
          { weight: 100, log: '凝神冠入手。', equipId: 'mind_crown', equipGrade: 'mysterious' },
        ],
      },
      {
        id: 'leave',
        text: '逛逛就走',
        outcomes: [{ weight: 100, log: '你咽了咽口水离开。' }],
      },
    ],
  },
  {
    id: 'mkt_heaven_soil',
    title: '一撮灵土',
    body: '据说取自洞天的灵土，可炼器可种药，也有人拿来强行灌修为。',
    tags: ['market', 'loot'],
    minRealm: 'core_formation',
    maxRealm: 'nascent_soul',
    weight: 10,
    choices: [
      {
        id: 'eat',
        text: '重金买下炼化',
        costStones: 190,
        outcomes: [
          { weight: 100, log: '灵土化力，修为暴涨。', cultivation: 58 },
        ],
      },
      {
        id: 'leave',
        text: '太贵了',
        outcomes: [{ weight: 100, log: '你离开。' }],
      },
    ],
  },

  // ── 元婴 ──
  {
    id: 'mkt_soul_thought',
    title: '化神神念残缕',
    body: '有商贩以玉瓶封存「疑似化神神念」，专供元婴修士冲击化神。天价。',
    tags: ['market', 'breakthrough'],
    minRealm: 'nascent_soul',
    maxRealm: 'nascent_soul',
    weight: 18,
    choices: [
      {
        id: 'buy',
        text: '倾囊求购',
        costStones: 380,
        outcomes: [
          { weight: 90, log: '化神神念入手！', flags: ['soul_item'] },
          { weight: 10, log: '略有损耗，仍可一用。', flags: ['soul_item'], daoHeart: -2 },
        ],
      },
      {
        id: 'fake_check',
        text: '付鉴定费验货',
        costStones: 40,
        requireAttr: { key: 'int', min: 9 },
        outcomes: [
          {
            weight: 65,
            log: '鉴定为真。你另付巨款购入神念。',
            stones: -340,
            flags: ['soul_item'],
          },
          { weight: 35, log: '鉴定为伪货，省下一笔冤枉钱。', daoHeart: 4 },
        ],
      },
      {
        id: 'leave',
        text: '走开',
        outcomes: [{ weight: 100, log: '你不敢妄买。' }],
      },
    ],
  },
  {
    id: 'mkt_nascent_vault',
    title: '元婴宝库开柜',
    body: '商会宝库对元婴开放：天材、法器、秘卷明码标价。',
    tags: ['market', 'loot'],
    minRealm: 'nascent_soul',
    maxRealm: 'soul_transformation',
    weight: 14,
    choices: [
      {
        id: 'gear',
        text: '购入踏云履',
        costStones: 320,
        outcomes: [
          { weight: 100, log: '踏云履入手。', equipId: 'cloud_step', equipGrade: 'mysterious' },
        ],
      },
      {
        id: 'pendant',
        text: '购入定心佩',
        costStones: 300,
        outcomes: [
          {
            weight: 100,
            log: '定心佩入手。',
            equipId: 'dao_heart_pendant',
            equipGrade: 'mysterious',
          },
        ],
      },
      {
        id: 'cult',
        text: '购入「婴火灵髓」服下',
        costStones: 260,
        outcomes: [
          { weight: 100, log: '修为狂涨，神台微烫。', cultivation: 75, hp: -8 },
        ],
      },
      {
        id: 'leave',
        text: '空手出库',
        outcomes: [{ weight: 100, log: '你只是开开眼界。' }],
      },
    ],
  },
  {
    id: 'mkt_law_shard',
    title: '法则碎片柜台',
    body: '柜中悬浮细碎法则光，据说化神以下也可强行炼化，失败则伤神。',
    tags: ['market', 'loot', 'risk'],
    minRealm: 'nascent_soul',
    maxRealm: 'soul_transformation',
    weight: 11,
    choices: [
      {
        id: 'buy_refine',
        text: '重金买下炼化',
        costStones: 350,
        outcomes: [
          { weight: 55, log: '炼化成功，大道感悟入体。', cultivation: 80, daoHeart: 4 },
          { weight: 45, log: '炼化失败，神台受伤。', hp: -30, daoHeart: -8, cultivation: 15 },
        ],
      },
      {
        id: 'leave',
        text: '不敢碰',
        outcomes: [{ weight: 100, log: '你退出柜台。' }],
      },
    ],
  },

  // ── 化神 ──
  {
    id: 'mkt_soul_grand',
    title: '化神堂供奉',
    body: '坊市最高阁：供奉天材地宝与「证道辅物」，只服务化神修士，价比山高。',
    tags: ['market', 'loot', 'breakthrough'],
    minRealm: 'soul_transformation',
    maxRealm: 'soul_transformation',
    weight: 16,
    choices: [
      {
        id: 'dao_aid',
        text: '购「证道香」静修',
        costStones: 400,
        outcomes: [
          {
            weight: 100,
            log: '心神空明，修为与道心齐升。',
            cultivation: 90,
            daoHeart: 12,
            injury: -2,
            hp: 30,
          },
        ],
      },
      {
        id: 'treasure',
        text: '购「太虚髓」',
        costStones: 450,
        outcomes: [
          { weight: 100, log: '太虚髓入体，修为暴涨。', cultivation: 110 },
        ],
      },
      {
        id: 'gourd',
        text: '购火云葫芦',
        costStones: 360,
        outcomes: [
          { weight: 100, log: '火云葫芦入手。', equipId: 'fire_gourd', equipGrade: 'mysterious' },
        ],
      },
      {
        id: 'leave',
        text: '告辞',
        outcomes: [{ weight: 100, log: '你下楼。' }],
      },
    ],
  },
  {
    id: 'mkt_soul_repair',
    title: '神台修复秘药',
    body: '专治神台裂痕、伤势与道心暗损的秘药，化神圈里极抢手。',
    tags: ['market', 'loot'],
    minRealm: 'soul_transformation',
    maxRealm: 'soul_transformation',
    weight: 13,
    choices: [
      {
        id: 'buy',
        text: '重金购药服用',
        costStones: 300,
        outcomes: [
          {
            weight: 100,
            log: '伤势尽去，道心回稳，气血充盈。',
            injury: -3,
            hp: 50,
            daoHeart: 15,
            cultivation: 25,
          },
        ],
      },
      {
        id: 'leave',
        text: '暂不需要',
        outcomes: [{ weight: 100, log: '你离开药阁。' }],
      },
    ],
  },

  // ── 全境界常驻高价货 ──
  {
    id: 'mkt_black_counter',
    title: '黑市一口价',
    body: '黑市不讲价：左边突破材料盲盒，右边玄阶法器盲盒，都贵。',
    tags: ['market', 'loot', 'breakthrough', 'risk'],
    minRealm: 'foundation',
    maxRealm: 'soul_transformation',
    weight: 12,
    choices: [
      {
        id: 'mat',
        text: '买突破材料盲盒',
        costStones: 200,
        outcomes: [
          { weight: 25, log: '开出筑基丹！', flags: ['foundation_pill'] },
          { weight: 25, log: '开出结丹材料！', flags: ['core_materials'] },
          { weight: 25, log: '开出婴变灵物！', flags: ['nascent_item'] },
          { weight: 15, log: '开出化神神念！', flags: ['soul_item'] },
          { weight: 10, log: '空盒，被坑。', daoHeart: -4 },
        ],
      },
      {
        id: 'gear',
        text: '买法器盲盒',
        costStones: 180,
        outcomes: [
          {
            weight: 30,
            log: '开出赤焰枪。',
            equipId: 'flame_spear',
            equipGrade: 'mysterious',
          },
          {
            weight: 30,
            log: '开出凝神冠。',
            equipId: 'mind_crown',
            equipGrade: 'mysterious',
          },
          {
            weight: 25,
            log: '开出血纹戒。',
            equipId: 'blood_ring',
            equipGrade: 'mysterious',
          },
          { weight: 15, log: '凡品垃圾。', equipId: 'copper_ring', equipGrade: 'mortal' },
        ],
      },
      {
        id: 'leave',
        text: '不赌',
        outcomes: [{ weight: 100, log: '你退出黑市。' }],
      },
    ],
  },
  {
    id: 'mkt_vip_room',
    title: '雅间珍品',
    body: '掌柜请你入雅间：三样珍品任选其一，价格都是「大数目」。',
    tags: ['market', 'loot', 'breakthrough'],
    minRealm: 'qi_refining',
    maxRealm: 'soul_transformation',
    weight: 11,
    choices: [
      {
        id: 'a',
        text: '天材灌修礼盒',
        costStones: 160,
        outcomes: [
          { weight: 100, log: '修为精进显著。', cultivation: 50, hp: 15 },
        ],
      },
      {
        id: 'b',
        text: '随机黄阶以上法器',
        costStones: 140,
        outcomes: [
          {
            weight: 50,
            log: '得聚灵玉。',
            equipId: 'spirit_jade',
            equipGrade: 'yellow',
          },
          {
            weight: 50,
            log: '得疾风靴。',
            equipId: 'wind_boots',
            equipGrade: 'yellow',
          },
        ],
      },
      {
        id: 'c',
        text: '「材料礼包」（可能有突破物）',
        costStones: 170,
        outcomes: [
          { weight: 40, log: '礼包有筑基丹。', flags: ['foundation_pill'] },
          { weight: 30, log: '礼包有结丹材料。', flags: ['core_materials'] },
          { weight: 20, log: '礼包有婴变灵物。', flags: ['nascent_item'] },
          { weight: 10, log: '只有普通灵材，修为小涨。', cultivation: 20 },
        ],
      },
      {
        id: 'leave',
        text: '告辞',
        outcomes: [{ weight: 100, log: '你谢绝掌柜。' }],
      },
    ],
  },
  {
    id: 'mkt_repair_service',
    title: '天价修复台',
    body: '修复台可「一键」恢复伤势与部分道心，收费按境界加价。',
    tags: ['market', 'loot'],
    minRealm: 'qi_refining',
    maxRealm: 'soul_transformation',
    weight: 10,
    choices: [
      {
        id: 'full',
        text: '全身修复',
        costStones: 130,
        outcomes: [
          {
            weight: 100,
            log: '伤势尽去，气血充盈，道心回稳。',
            injury: -3,
            hp: 60,
            daoHeart: 10,
          },
        ],
      },
      {
        id: 'light',
        text: '简单包扎',
        costStones: 60,
        outcomes: [
          { weight: 100, log: '伤势减轻。', injury: -1, hp: 25 },
        ],
      },
      {
        id: 'leave',
        text: '不修',
        outcomes: [{ weight: 100, log: '你离开修复台。' }],
      },
    ],
  },
]
