import type { GameEvent } from '../domain/types'
import { EXTRA_EVENTS } from './eventsExtra'
import { STAGE_EVENTS } from './eventsStage'

/** 低阶通用事件 + 分阶段奇遇 */
const BASE_EVENTS: GameEvent[] = [
  {
    id: 'cave_green_lamp',
    title: '古洞残灯',
    body: '你在乱石谷深处发现一盏不灭的青灯。灯芯下压着半页功法，隐有血腥气与阵纹波动。',
    tags: ['adventure', 'risk', 'loot', 'stage:qi_refining'],
    minLayer: 3,
    maxRealm: 'foundation',
    weight: 12,
    choices: [
      {
        id: 'probe',
        text: '以神识探查',
        hint: '智检定',
        requireAttr: { key: 'int', min: 4 },
        outcomes: [
          {
            weight: 70,
            log: '你看破残阵，小心取下功法残篇。',
            cultivation: 12,
            artId: 'flame_slash',
            artFragment: true,
            artGrade: 'mysterious',
          },
          {
            weight: 30,
            log: '神识被刺，头痛欲裂。',
            hp: -12,
            cultivation: 3,
          },
        ],
      },
      {
        id: 'grab',
        text: '直接取走功法',
        hint: '运检定，可能触阵',
        outcomes: [
          {
            weight: 55,
            log: '你硬抢成功，得黄阶功法线索。',
            artId: 'ice_shot',
            artGrade: 'yellow',
            cultivation: 8,
          },
          {
            weight: 45,
            log: '阵纹爆发，你带伤逃出，却攥住了残玉。',
            hp: -18,
            injury: 1,
            artId: 'ring_of_ice',
            artFragment: true,
            artGrade: 'yellow',
          },
        ],
      },
      {
        id: 'leap',
        text: '以跃击硬闯雾障',
        hint: '需主修/已悟跃击',
        requireFlag: 'art_leap',
        outcomes: [
          {
            weight: 100,
            log: '你借跃击破雾，完整取走玉简！',
            artId: 'flame_slash',
            artGrade: 'mysterious',
            cultivation: 15,
            skillXp: 20,
          },
        ],
      },
      {
        id: 'leave',
        text: '原路返回',
        outcomes: [
          {
            weight: 100,
            log: '你记下方位，改日再来。',
            flags: ['cave_marked'],
          },
        ],
      },
    ],
  },
  {
    id: 'market_scam',
    title: '坊市伪玉',
    body: '摊贩高声叫卖「筑基前辈亲传功法」。价不高，但总觉得哪里不对。',
    tags: ['trade', 'risk'],
    maxRealm: 'foundation',
    weight: 14,
    choices: [
      {
        id: 'buy',
        text: '花灵石买下',
        costStones: 20,
        outcomes: [
          {
            weight: 40,
            log: '竟是真货残篇！',
            artId: 'chain_lightning',
            artFragment: true,
            artGrade: 'yellow',
          },
          {
            weight: 60,
            log: '伪本害你走火片刻，白花灵石。',
            hp: -8,
            daoHeart: -3,
          },
        ],
      },
      {
        id: 'insight',
        text: '仔细辨伪',
        requireAttr: { key: 'int', min: 5 },
        outcomes: [
          {
            weight: 80,
            log: '你揭穿骗局，摊贩塞给你一点封口费。',
            stones: 8,
          },
          {
            weight: 20,
            log: '对方翻脸，你险险脱身。',
            hp: -6,
          },
        ],
      },
      {
        id: 'ignore',
        text: '转身离开',
        outcomes: [{ weight: 100, log: '你不为所动。' }],
      },
    ],
  },
  {
    id: 'rogue_duel',
    title: '散修拦路',
    body: '一名同境散修拦住去路，眼中满是贪婪：「留下储物袋，饶你不死。」',
    tags: ['combat', 'risk'],
    minLayer: 4,
    maxRealm: 'foundation',
    weight: 16,
    choices: [
      {
        id: 'fight',
        text: '拔剑相向',
        outcomes: [
          {
            weight: 60,
            log: '你击败对方，搜得灵石、残篇与一件法器。',
            cultivation: 18,
            stones: 15,
            karma: 5,
            artId: 'double_thrusts',
            artGrade: 'yellow',
            equipId: 'qingfeng_sword',
            equipGrade: 'yellow',
            skillXp: 15,
          },
          {
            weight: 30,
            log: '两败俱伤，对方逃遁。',
            hp: -20,
            cultivation: 8,
            injury: 1,
          },
          {
            weight: 10,
            log: '你不敌，几乎身死……',
            hp: -40,
            injury: 2,
            death: false,
          },
        ],
      },
      {
        id: 'blink_away',
        text: '闪现脱身',
        requireFlag: 'art_blink',
        outcomes: [
          {
            weight: 100,
            log: '身形一晃，你已在十丈开外，对方骂骂咧咧。',
            cultivation: 5,
            skillXp: 10,
          },
        ],
      },
      {
        id: 'warcry',
        text: '复苏战吼震慑',
        requireFlag: 'art_warcry',
        outcomes: [
          {
            weight: 75,
            log: '战吼令其胆寒，丢下灵石便逃。',
            stones: 12,
            skillXp: 8,
          },
          {
            weight: 25,
            log: '对方更怒，恶战一场。',
            hp: -15,
            cultivation: 10,
          },
        ],
      },
      {
        id: 'give',
        text: '扔下部分灵石走人',
        costStones: 10,
        outcomes: [
          {
            weight: 100,
            log: '破财消灾，你匆匆离去。',
            daoHeart: -2,
          },
        ],
      },
    ],
  },
  {
    id: 'herb_valley',
    title: '药谷异香',
    body: '山谷中药香浮动，似乎有灵草成熟，也像有人布置了简易禁制。',
    tags: ['adventure', 'alchemy'],
    maxRealm: 'core_formation',
    weight: 13,
    choices: [
      {
        id: 'pick',
        text: '小心采药',
        outcomes: [
          {
            weight: 70,
            log: '你采得灵草，可炼或卖。',
            stones: 12,
            cultivation: 6,
            flags: ['herbs'],
          },
          {
            weight: 30,
            log: '禁制轻伤，药也丢了大半。',
            hp: -10,
          },
        ],
      },
      {
        id: 'saqi',
        text: '以药理辨别毒草（赛琪）',
        requireHero: 'sage_licorice',
        outcomes: [
          {
            weight: 100,
            log: '你轻松分辨，满载而归，还悟得防护心法。',
            stones: 25,
            cultivation: 12,
            artId: 'frost_shield',
            artGrade: 'yellow',
          },
        ],
      },
      {
        id: 'leave',
        text: '不贪此财',
        outcomes: [{ weight: 100, log: '你压下贪念，道心微稳。', daoHeart: 2 }],
      },
    ],
  },
  {
    id: 'closed_door_insight',
    title: '闭关异象',
    body: '苦修之中，丹田真元躁动，眼前似有火光与剑意交错。',
    tags: ['cultivate', 'insight'],
    maxRealm: 'foundation',
    weight: 8,
    choices: [
      {
        id: 'force',
        text: '强行引动顿悟',
        hint: '志检定',
        outcomes: [
          {
            weight: 50,
            log: '你抓住机缘，修为大进。',
            cultivation: 35,
            skillXp: 25,
          },
          {
            weight: 50,
            log: '走火入魔边缘，道心受损。',
            hp: -15,
            daoHeart: -8,
            cultivation: 5,
          },
        ],
      },
      {
        id: 'steady',
        text: '稳固心神，徐徐收功',
        outcomes: [
          {
            weight: 100,
            log: '你稳住气息，虽无大悟，根基更稳。',
            cultivation: 15,
            daoHeart: 3,
          },
        ],
      },
    ],
  },
  {
    id: 'foundation_rumor',
    title: '筑基丹线索',
    body: '茶馆中有人低声议论：城北散修刚从秘境带回一枚成色不错的筑基丹，欲高价出手。',
    tags: ['trade', 'breakthrough', 'stage:qi_refining'],
    minLayer: 8,
    maxRealm: 'qi_refining',
    weight: 14,
    choices: [
      {
        id: 'buy_pill',
        text: '倾囊求购',
        costStones: 50,
        outcomes: [
          {
            weight: 70,
            log: '你买到真丹，筑基有望！',
            flags: ['foundation_pill'],
          },
          {
            weight: 30,
            log: '买到伪丹，气得半死。',
            daoHeart: -5,
            hp: -5,
          },
        ],
      },
      {
        id: 'rob',
        text: '尾随夺丹',
        hint: '杀孽上升',
        outcomes: [
          {
            weight: 55,
            log: '你得手了，筑基丹在握，杀孽缠身。',
            flags: ['foundation_pill'],
            karma: 15,
            daoHeart: -5,
          },
          {
            weight: 45,
            log: '反被伏击，重伤而逃。',
            hp: -25,
            injury: 2,
          },
        ],
      },
      {
        id: 'ignore',
        text: '暂且记下',
        outcomes: [{ weight: 100, log: '你不动声色，日后再议。' }],
      },
    ],
  },
  {
    id: 'core_materials',
    title: '结丹材料商队',
    body: '商队护送一批据说能辅助结丹的珍稀材料，护卫森严，也有人在暗中打主意。',
    tags: ['trade', 'combat', 'breakthrough', 'stage:foundation'],
    minRealm: 'foundation',
    maxRealm: 'foundation',
    weight: 12,
    choices: [
      {
        id: 'escort',
        text: '应聘护送',
        outcomes: [
          {
            weight: 65,
            log: '任务完成，商会酬谢材料一份。',
            flags: ['core_materials'],
            stones: 20,
            cultivation: 20,
          },
          {
            weight: 35,
            log: '遇劫，你力战保下货物，自己也带伤。',
            flags: ['core_materials'],
            hp: -18,
            injury: 1,
            cultivation: 15,
          },
        ],
      },
      {
        id: 'buy',
        text: '高价购买',
        costStones: 80,
        outcomes: [
          {
            weight: 100,
            log: '钱货两清，结丹材料到手。',
            flags: ['core_materials'],
          },
        ],
      },
      {
        id: 'leave',
        text: '与我无关',
        outcomes: [{ weight: 100, log: '你目送商队远去。' }],
      },
    ],
  },
  {
    id: 'erika_hunt',
    title: '夜狩妖踪',
    body: '月下有妖兽低吼。对你这等身法，既是机缘也是考验。',
    tags: ['combat', 'hunt'],
    minLayer: 5,
    maxRealm: 'core_formation',
    weight: 9,
    choices: [
      {
        id: 'hunt',
        text: '追猎斩杀',
        outcomes: [
          {
            weight: 70,
            log: '你猎得妖丹、功法残页与兽皮护腕。',
            cultivation: 22,
            stones: 10,
            artId: 'rain_of_arrows',
            artFragment: true,
            artGrade: 'mysterious',
            equipId: 'beast_bracer',
            equipGrade: 'yellow',
            skillXp: 18,
          },
          {
            weight: 30,
            log: '妖兽反扑，你负伤退走。',
            hp: -16,
            injury: 1,
          },
        ],
      },
      {
        id: 'erika',
        text: '以追猎本能设伏（艾瑞卡）',
        requireHero: 'erika_wind',
        outcomes: [
          {
            weight: 100,
            log: '完美猎杀！还悟得影袭之法。',
            cultivation: 30,
            artId: 'shadow_dash',
            artGrade: 'mysterious',
            skillXp: 25,
          },
        ],
      },
      {
        id: 'avoid',
        text: '避开锋芒',
        outcomes: [{ weight: 100, log: '你选择不冒险。' }],
      },
    ],
  },
  {
    id: 'rehan_rage',
    title: '血色比武',
    body: '坊市擂台悬赏生死战。围观者嘶吼，你的血液也在灼烧。',
    tags: ['combat', 'rage'],
    minLayer: 6,
    maxRealm: 'core_formation',
    weight: 8,
    choices: [
      {
        id: 'enter',
        text: '上台死斗',
        outcomes: [
          {
            weight: 55,
            log: '你浴血获胜，声名小噪。',
            cultivation: 28,
            stones: 30,
            karma: 8,
            skillXp: 20,
            artId: 'whirlwind',
            artFragment: true,
            artGrade: 'mysterious',
          },
          {
            weight: 45,
            log: '你险胜却重伤，几乎站不稳。',
            hp: -30,
            injury: 2,
            cultivation: 12,
            stones: 10,
          },
        ],
      },
      {
        id: 'rehan',
        text: '怒火焚身，暴气开战（雷恩）',
        requireHero: 'rehan_anger',
        outcomes: [
          {
            weight: 100,
            log: '怒火滔天，对手溃败。你悟得刚猛战技。',
            cultivation: 35,
            artId: 'hammer_of_ash',
            artGrade: 'mysterious',
            skillXp: 30,
            karma: 5,
          },
        ],
      },
      {
        id: 'watch',
        text: '只作旁观',
        outcomes: [{ weight: 100, log: '你冷眼看完一场杀戮。', daoHeart: -1 }],
      },
    ],
  },
  {
    id: 'spirit_spring',
    title: '山间灵泉',
    body: '清泉冒着淡淡灵气，正适合调息，也可能有人设下埋伏。',
    tags: ['cultivate', 'adventure'],
    maxRealm: 'foundation',
    weight: 11,
    choices: [
      {
        id: 'bathe',
        text: '在此调息三日',
        outcomes: [
          {
            weight: 75,
            log: '灵泉洗经伐髓，修为上涨，伤势略好。',
            cultivation: 20,
            hp: 15,
            injury: -1,
          },
          {
            weight: 25,
            log: '遭人偷袭，狼狈逃开。',
            hp: -14,
            stones: -5,
          },
        ],
      },
      {
        id: 'guard',
        text: '先以石肤护体再饮泉',
        requireFlag: 'art_stoneskin',
        outcomes: [
          {
            weight: 100,
            log: '防护妥当，你安然受益。',
            cultivation: 25,
            hp: 10,
            skillXp: 12,
          },
        ],
      },
    ],
  },
  {
    id: 'sect_invite',
    title: '外门招揽',
    body: '一名青衫修士递来令牌：「外门缺人打杂，有月例灵石，也可听讲基础功法。」',
    tags: ['sect', 'social'],
    maxRealm: 'qi_refining',
    weight: 10,
    choices: [
      {
        id: 'join',
        text: '加入打杂',
        outcomes: [
          {
            weight: 100,
            log: '你成为外门杂役，得薄俸与基础战吼传授。',
            stones: 20,
            flags: ['sect_outer'],
            artId: 'resurrection_warcry',
            artGrade: 'yellow',
          },
        ],
      },
      {
        id: 'refuse',
        text: '婉拒，愿做散修',
        outcomes: [
          {
            weight: 100,
            log: '你坚持自由，也少了靠山。',
            daoHeart: 2,
          },
        ],
      },
    ],
  },
  {
    id: 'demonic_script',
    title: '血字秘卷',
    body: '你捡到一卷以血书写的秘法，隐隐有魔性诱惑，也承诺捷径。',
    tags: ['demon', 'risk', 'loot'],
    minLayer: 7,
    maxRealm: 'core_formation',
    weight: 7,
    choices: [
      {
        id: 'learn',
        text: '修习魔功',
        outcomes: [
          {
            weight: 100,
            log: '你强行炼化，得腐蚀功法，道心蒙尘。',
            artId: 'shadow_shot',
            artGrade: 'mysterious',
            cultivation: 30,
            daoHeart: -12,
            karma: 10,
          },
        ],
      },
      {
        id: 'burn',
        text: '付之一炬',
        outcomes: [
          {
            weight: 100,
            log: '邪火散尽，你道心更坚，却也失去机缘。',
            daoHeart: 8,
            karma: -5,
          },
        ],
      },
      {
        id: 'sell',
        text: '卖给黑市',
        outcomes: [
          {
            weight: 100,
            log: '换来一笔脏钱。',
            stones: 40,
            karma: 3,
          },
        ],
      },
    ],
  },
]

export const EVENTS: GameEvent[] = [...BASE_EVENTS, ...STAGE_EVENTS, ...EXTRA_EVENTS]
