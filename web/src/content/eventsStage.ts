import type { GameEvent } from '../domain/types'

/**
 * 分阶段奇遇：minRealm/maxRealm 控制出现区间
 * 材料事件：foundation_pill / core_materials / nascent_item / soul_item
 */
export const STAGE_EVENTS: GameEvent[] = [
  // ════════════ 炼气专属 ════════════
  {
    id: 'qi_spirit_chicken',
    title: '山民献鸡',
    body: '山民说家里鸡夜里会发光，疑是灵禽，求你去看。',
    tags: ['adventure', 'social', 'stage:qi_refining'],
    maxRealm: 'qi_refining',
    weight: 11,
    choices: [
      {
        id: 'check',
        text: '跟去察看',
        outcomes: [
          { weight: 60, log: '果然是低阶灵禽，你得些灵血与灵石。', stones: 12, cultivation: 8 },
          { weight: 40, log: '只是普通鸡，闹了笑话，倒也吃了顿好的。', daoHeart: 2, hp: 5 },
        ],
      },
      {
        id: 'refuse',
        text: '婉拒',
        outcomes: [{ weight: 100, log: '你继续赶路。' }],
      },
    ],
  },
  {
    id: 'qi_mine_collapse',
    title: '废矿异响',
    body: '废弃矿洞传来轻微灵气波动，或是矿脉残留，或是妖物作祟。',
    tags: ['adventure', 'risk', 'loot', 'stage:qi_refining'],
    minLayer: 5,
    maxRealm: 'qi_refining',
    weight: 12,
    choices: [
      {
        id: 'enter',
        text: '入洞探查',
        outcomes: [
          {
            weight: 50,
            log: '你挖到劣质灵石矿与一件旧物。',
            stones: 18,
            cultivation: 10,
            equipId: 'copper_ring',
            equipGrade: 'mortal',
          },
          { weight: 35, log: '洞壁塌落，你狼狈逃出。', hp: -14, injury: 1 },
          { weight: 15, log: '遇矿洞 Gu 虫，中毒轻伤。', hp: -10, daoHeart: -2 },
        ],
      },
      {
        id: 'seal',
        text: '封洞离开',
        outcomes: [{ weight: 100, log: '你不冒险，做了标记。', flags: ['mine_marked'] }],
      },
    ],
  },
  {
    id: 'qi_lecture',
    title: '散修讲法',
    body: '树下有人义务讲解炼气口诀，听者寥寥。',
    tags: ['cultivate', 'social', 'stage:qi_refining'],
    maxRealm: 'qi_refining',
    weight: 10,
    choices: [
      {
        id: 'listen',
        text: '坐下听讲',
        outcomes: [
          { weight: 80, log: '你理顺几处瓶颈，修为精进。', cultivation: 16, daoHeart: 3 },
          { weight: 20, log: '讲得平平，收获有限。', cultivation: 5 },
        ],
      },
      {
        id: 'challenge',
        text: '请教辩难',
        requireAttr: { key: 'int', min: 5 },
        outcomes: [
          {
            weight: 70,
            log: '对方赞你悟性，赠送一瓶回气丹等价灵石。',
            stones: 15,
            cultivation: 12,
          },
          { weight: 30, log: '言辞冲撞，不欢而散。', daoHeart: -2 },
        ],
      },
    ],
  },

  // ════════════ 筑基专属 ════════════
  {
    id: 'found_cave_mansion',
    title: '前辈洞府',
    body: '你感应到一处残破洞府禁制松动，似是筑基前辈坐化之地。',
    tags: ['adventure', 'loot', 'risk', 'stage:foundation'],
    minRealm: 'foundation',
    maxRealm: 'foundation',
    weight: 13,
    choices: [
      {
        id: 'break',
        text: '破禁而入',
        outcomes: [
          {
            weight: 55,
            log: '你得遗物与功法残篇，也惊动残留杀阵。',
            cultivation: 28,
            artId: 'whirlwind',
            artFragment: true,
            artGrade: 'mysterious',
            equipId: 'bronze_helm',
            equipGrade: 'yellow',
            hp: -12,
          },
          { weight: 45, log: '禁制反噬，你重伤退出。', hp: -28, injury: 2 },
        ],
      },
      {
        id: 'slow',
        text: '三日解禁',
        outcomes: [
          {
            weight: 85,
            log: '稳妥得一份遗产。',
            cultivation: 22,
            stones: 35,
            equipId: 'spirit_jade',
            equipGrade: 'yellow',
          },
          { weight: 15, log: '被人捷足先登，只剩残渣。', stones: 5 },
        ],
      },
    ],
  },
  {
    id: 'found_sect_trial',
    title: '宗门外门试炼',
    body: '附近宗门招收外门执事，试炼为猎杀凶兽与阵法通关。',
    tags: ['sect', 'combat', 'stage:foundation'],
    minRealm: 'foundation',
    maxRealm: 'core_formation',
    weight: 11,
    choices: [
      {
        id: 'join',
        text: '参加试炼',
        outcomes: [
          {
            weight: 65,
            log: '你通过试炼，得贡献兑换的资源。',
            cultivation: 30,
            stones: 40,
            flags: ['sect_outer'],
          },
          { weight: 35, log: '试炼中受伤，勉强合格。', hp: -18, cultivation: 15, stones: 15 },
        ],
      },
      {
        id: 'skip',
        text: '不感兴趣',
        outcomes: [{ weight: 100, log: '你继续散修生涯。' }],
      },
    ],
  },
  {
    id: 'found_core_auction',
    title: '坊市结丹拍品',
    body: '拍卖行亮出「疑似结丹辅材」，起拍价不低，水很深。',
    tags: ['trade', 'breakthrough', 'stage:foundation'],
    minRealm: 'foundation',
    maxRealm: 'foundation',
    weight: 12,
    choices: [
      {
        id: 'bid',
        text: '砸灵石竞拍',
        costStones: 70,
        outcomes: [
          { weight: 55, log: '你拍下真材！', flags: ['core_materials'] },
          { weight: 45, log: '买到掺假货，气得半死。', daoHeart: -6, hp: -5 },
        ],
      },
      {
        id: 'steal_info',
        text: '暗中打听货源',
        requireAttr: { key: 'luck', min: 5 },
        outcomes: [
          {
            weight: 70,
            log: '你截胡到一批边角料，勉强凑成结丹材料。',
            flags: ['core_materials'],
            karma: 3,
          },
          { weight: 30, log: '被发现，挨了一顿追杀。', hp: -20, injury: 1 },
        ],
      },
      {
        id: 'leave',
        text: '离开',
        outcomes: [{ weight: 100, log: '你量力而行。' }],
      },
    ],
  },
  {
    id: 'found_inner_demon',
    title: '筑基心魔夜',
    body: '月圆之夜，你修炼时眼前出现故人幻影，心魔滋生。',
    tags: ['cultivate', 'risk', 'stage:foundation'],
    minRealm: 'foundation',
    maxRealm: 'foundation',
    weight: 9,
    choices: [
      {
        id: 'face',
        text: '直面心魔',
        outcomes: [
          { weight: 55, log: '你斩破幻影，道心更坚。', daoHeart: 10, cultivation: 25 },
          { weight: 45, log: '心神受创。', daoHeart: -12, hp: -10 },
        ],
      },
      {
        id: 'meditate',
        text: '定神收功',
        outcomes: [{ weight: 100, log: '你稳住气息，逃过一劫。', daoHeart: 3, cultivation: 8 }],
      },
    ],
  },

  // ════════════ 结丹专属 ════════════
  {
    id: 'core_golden_tide',
    title: '金丹潮汐',
    body: '天地灵气如潮，结丹修士在秘境入口争夺「潮心」。',
    tags: ['adventure', 'combat', 'loot', 'stage:core_formation'],
    minRealm: 'core_formation',
    maxRealm: 'core_formation',
    weight: 14,
    choices: [
      {
        id: 'rush',
        text: '抢夺潮心',
        outcomes: [
          {
            weight: 45,
            log: '你夺得一缕潮心，修为大进，亦结仇家。',
            cultivation: 45,
            karma: 8,
            equipId: 'flame_spear',
            equipGrade: 'mysterious',
          },
          { weight: 40, log: '被围攻，带伤逃出。', hp: -30, injury: 2, cultivation: 10 },
          { weight: 15, log: '险死还生，只得边角灵气。', cultivation: 20, hp: -15 },
        ],
      },
      {
        id: 'edge',
        text: '边缘采气',
        outcomes: [
          { weight: 80, log: '稳妥收益。', cultivation: 28, stones: 25 },
          { weight: 20, log: '余波扫到，轻伤。', cultivation: 12, hp: -12 },
        ],
      },
    ],
  },
  {
    id: 'core_nascent_rumor',
    title: '婴变灵果消息',
    body: '有人低语：万兽山出现能助婴变的灵果，已有结丹老怪盯上。',
    tags: ['breakthrough', 'adventure', 'stage:core_formation'],
    minRealm: 'core_formation',
    maxRealm: 'core_formation',
    weight: 13,
    choices: [
      {
        id: 'go',
        text: '深入万兽山',
        outcomes: [
          {
            weight: 50,
            log: '你得果！并带出兽核若干。',
            flags: ['nascent_item'],
            cultivation: 35,
            stones: 30,
          },
          { weight: 50, log: '被兽潮冲散，无功而返。', hp: -22, injury: 1 },
        ],
      },
      {
        id: 'buy',
        text: '黑市高价求购',
        costStones: 100,
        outcomes: [
          { weight: 60, log: '买到真果。', flags: ['nascent_item'] },
          { weight: 40, log: '假货，血本无归。', daoHeart: -5 },
        ],
      },
      {
        id: 'wait',
        text: '再观望',
        outcomes: [{ weight: 100, log: '你记下线索。' }],
      },
    ],
  },
  {
    id: 'core_dao_debate',
    title: '丹道论法',
    body: '数名结丹修士论道，请旁听者亦可插话，胜者有厚礼。',
    tags: ['social', 'cultivate', 'stage:core_formation'],
    minRealm: 'core_formation',
    maxRealm: 'nascent_soul',
    weight: 10,
    choices: [
      {
        id: 'join',
        text: '参与论道',
        requireAttr: { key: 'int', min: 7 },
        outcomes: [
          {
            weight: 70,
            log: '你言出有物，获赠灵液与声望。',
            cultivation: 40,
            stones: 50,
            daoHeart: 5,
            equipId: 'mind_crown',
            equipGrade: 'mysterious',
          },
          { weight: 30, log: '被驳得无话，面上无光。', daoHeart: -4 },
        ],
      },
      {
        id: 'listen',
        text: '只听不语',
        outcomes: [{ weight: 100, log: '你暗自印证功法。', cultivation: 18 }],
      },
    ],
  },
  {
    id: 'core_ghost_market',
    title: '鬼市一夜',
    body: '子时鬼市开张，光怪陆离，专做见不得光的买卖。',
    tags: ['trade', 'demon', 'risk', 'stage:core_formation'],
    minRealm: 'core_formation',
    maxRealm: 'nascent_soul',
    weight: 10,
    choices: [
      {
        id: 'browse',
        text: '进市淘宝',
        costStones: 40,
        outcomes: [
          {
            weight: 50,
            log: '淘到好货。',
            equipId: 'blood_ring',
            equipGrade: 'mysterious',
            cultivation: 15,
          },
          { weight: 30, log: '被骗。', daoHeart: -3 },
          { weight: 20, log: '遇袭，夺路而逃。', hp: -18, injury: 1 },
        ],
      },
      {
        id: 'leave',
        text: '不进鬼市',
        outcomes: [{ weight: 100, log: '你远离是非。', daoHeart: 2 }],
      },
    ],
  },

  // ════════════ 元婴专属 ════════════
  {
    id: 'nascent_spirit_sea',
    title: '神识海试炼',
    body: '一处上古遗迹以神识为桥，元婴修士可渡，失败则神识受损。',
    tags: ['adventure', 'risk', 'stage:nascent_soul'],
    minRealm: 'nascent_soul',
    maxRealm: 'nascent_soul',
    weight: 14,
    choices: [
      {
        id: 'cross',
        text: '以神识渡桥',
        requireAttr: { key: 'int', min: 9 },
        outcomes: [
          {
            weight: 60,
            log: '你渡桥成功，得化神相关感悟残篇与宝物。',
            cultivation: 55,
            flags: ['soul_item'],
            equipId: 'dao_heart_pendant',
            equipGrade: 'mysterious',
          },
          { weight: 40, log: '神识受创，退回。', hp: -25, daoHeart: -8, cultivation: 10 },
        ],
      },
      {
        id: 'guard',
        text: '在外围护道友（有赏）',
        outcomes: [
          { weight: 75, log: '得一笔酬劳。', stones: 80, cultivation: 20 },
          { weight: 25, log: '遗迹异变，你被波及。', hp: -20 },
        ],
      },
    ],
  },
  {
    id: 'nascent_avatar_war',
    title: '元婴法相争锋',
    body: '两名元婴修士法相争斗，余波能毁城。有人出高价请你搅局。',
    tags: ['combat', 'risk', 'stage:nascent_soul'],
    minRealm: 'nascent_soul',
    maxRealm: 'nascent_soul',
    weight: 11,
    choices: [
      {
        id: 'interfere',
        text: '介入搅局',
        outcomes: [
          {
            weight: 40,
            log: '你浑水摸鱼，得双方掉落灵材。',
            stones: 90,
            cultivation: 40,
            karma: 10,
            equipId: 'iron_scale',
            equipGrade: 'mysterious',
          },
          { weight: 40, log: '被余波击中。', hp: -40, injury: 2 },
          { weight: 20, log: '双方停手追杀你，你遁逃。', hp: -15, karma: 5 },
        ],
      },
      {
        id: 'evacuate',
        text: '疏散凡人',
        outcomes: [
          { weight: 100, log: '功德无形，道心稳固。', daoHeart: 12, karma: -8, cultivation: 15 },
        ],
      },
    ],
  },
  {
    id: 'nascent_soul_dream',
    title: '元婴入梦',
    body: '入定中，元婴离体入一重梦境古战场，杀机与机缘并存。',
    tags: ['cultivate', 'adventure', 'stage:nascent_soul'],
    minRealm: 'nascent_soul',
    maxRealm: 'soul_transformation',
    weight: 12,
    choices: [
      {
        id: 'kill',
        text: '在梦中杀伐夺宝',
        outcomes: [
          {
            weight: 55,
            log: '你带回一缕化神神念！',
            flags: ['soul_item'],
            cultivation: 50,
            karma: 6,
          },
          { weight: 45, log: '梦中身死，现实重伤。', hp: -35, injury: 2, daoHeart: -6 },
        ],
      },
      {
        id: 'observe',
        text: '观战悟道',
        outcomes: [
          { weight: 100, log: '你悟得一丝法则，修为上涨。', cultivation: 35, daoHeart: 5 },
        ],
      },
    ],
  },
  {
    id: 'nascent_alliance',
    title: '元婴联盟邀约',
    body: '地方元婴联盟邀你加入，共享情报与秘境名额，但需服从调遣。',
    tags: ['social', 'sect', 'stage:nascent_soul'],
    minRealm: 'nascent_soul',
    maxRealm: 'soul_transformation',
    weight: 9,
    choices: [
      {
        id: 'join',
        text: '加入联盟',
        outcomes: [
          {
            weight: 100,
            log: '你成为盟员，得资源与情报。',
            stones: 60,
            cultivation: 25,
            flags: ['alliance'],
          },
        ],
      },
      {
        id: 'no',
        text: '保持独立',
        outcomes: [{ weight: 100, log: '你拒绝束缚。', daoHeart: 3 }],
      },
    ],
  },

  // ════════════ 化神专属 ════════════
  {
    id: 'soul_void_crack',
    title: '虚空裂隙',
    body: '天际裂开缝隙，化神神念可探入其中，或得大道碎片，或神魂永寂。',
    tags: ['adventure', 'risk', 'stage:soul_transformation'],
    minRealm: 'soul_transformation',
    maxRealm: 'soul_transformation',
    weight: 15,
    choices: [
      {
        id: 'probe',
        text: '神念探入',
        outcomes: [
          {
            weight: 50,
            log: '你夺得大道碎片，修为暴涨。',
            cultivation: 70,
            equipId: 'fire_gourd',
            equipGrade: 'mysterious',
          },
          { weight: 35, log: '神念被撕扯，险些溃散。', hp: -45, daoHeart: -10, injury: 2 },
          { weight: 15, log: '无功而返，但眼界大开。', cultivation: 25, daoHeart: 6 },
        ],
      },
      {
        id: 'seal',
        text: '协助封裂',
        outcomes: [
          {
            weight: 100,
            log: '你立下功德，道心空明。',
            daoHeart: 15,
            karma: -12,
            cultivation: 30,
          },
        ],
      },
    ],
  },
  {
    id: 'soul_law_rain',
    title: '法则雨',
    body: '天降法则之雨，化神修士可沐浴感悟，亦可能被法则灼伤神台。',
    tags: ['cultivate', 'stage:soul_transformation'],
    minRealm: 'soul_transformation',
    maxRealm: 'soul_transformation',
    weight: 13,
    choices: [
      {
        id: 'bath',
        text: '以身浴法',
        outcomes: [
          { weight: 60, log: '感悟如潮，逼近圆满。', cultivation: 65, daoHeart: 8 },
          { weight: 40, log: '神台被灼，痛苦万分。', hp: -30, cultivation: 15, daoHeart: -5 },
        ],
      },
      {
        id: 'half',
        text: '以法器引雨',
        outcomes: [
          { weight: 85, log: '稳妥汲取。', cultivation: 40 },
          { weight: 15, log: '法器受损，收益一般。', cultivation: 20, stones: -10 },
        ],
      },
    ],
  },
  {
    id: 'soul_old_monster',
    title: '化神老怪传功',
    body: '一位将死的化神老怪寻继承人，要考校道心与战力。',
    tags: ['social', 'combat', 'loot', 'stage:soul_transformation'],
    minRealm: 'soul_transformation',
    maxRealm: 'soul_transformation',
    weight: 11,
    once: true,
    choices: [
      {
        id: 'accept',
        text: '接受考校',
        outcomes: [
          {
            weight: 55,
            log: '你通过考校，得传承与重宝。',
            cultivation: 80,
            stones: 120,
            equipId: 'cloud_step',
            equipGrade: 'mysterious',
            artId: 'scorching_beam',
            artGrade: 'mysterious',
          },
          { weight: 45, log: '战力不足，被一掌震退，仍得薄礼。', hp: -35, stones: 40, cultivation: 20 },
        ],
      },
      {
        id: 'decline',
        text: '不敢承受因果',
        outcomes: [{ weight: 100, log: '老怪叹息离去。', daoHeart: 5 }],
      },
    ],
  },
  {
    id: 'soul_heart_final',
    title: '神台问心',
    body: '化神之路尽头是问心。你看见一生杀孽、恩仇与选择在神台前重演。',
    tags: ['cultivate', 'breakthrough', 'stage:soul_transformation'],
    minRealm: 'soul_transformation',
    maxRealm: 'soul_transformation',
    weight: 10,
    choices: [
      {
        id: 'accept_all',
        text: '尽数承担',
        outcomes: [
          {
            weight: 100,
            log: '你道心通透，离证道仅一步之遥。',
            daoHeart: 20,
            cultivation: 50,
            karma: -5,
          },
        ],
      },
      {
        id: 'deny',
        text: '斩断执念',
        outcomes: [
          {
            weight: 70,
            log: '你斩念成功，亦失却部分温情。',
            cultivation: 40,
            daoHeart: 5,
          },
          { weight: 30, log: '斩念失败，心神震荡。', daoHeart: -15, hp: -20 },
        ],
      },
    ],
  },

  // ════════════ 跨多境但分档 ════════════
  {
    id: 'mid_secret_realm',
    title: '中型秘境开启',
    body: '一处限筑基至结丹的秘境开启，内有灵药与古宝。',
    tags: ['adventure', 'loot', 'combat'],
    minRealm: 'foundation',
    maxRealm: 'core_formation',
    weight: 12,
    choices: [
      {
        id: 'enter',
        text: '进入秘境',
        outcomes: [
          {
            weight: 50,
            log: '满载而归。',
            cultivation: 35,
            stones: 45,
            equipId: 'qingfeng_sword',
            equipGrade: 'yellow',
          },
          { weight: 35, log: '遇强敌，苦战得小利。', cultivation: 18, hp: -22, stones: 15 },
          { weight: 15, log: '迷路，几乎困死。', hp: -18, cultivation: 5 },
        ],
      },
      {
        id: 'sell_slot',
        text: '倒卖名额',
        outcomes: [{ weight: 100, log: '赚一笔。', stones: 50, karma: 2 }],
      },
    ],
  },
  {
    id: 'god_relic_ruin',
    title: '崩毁神藏',
    body: '远古神藏裂开一道缝：紫金匣中隐约可见戒面星砂与半张笑唇。守护残影仍在，夺宝九死一生。',
    tags: ['adventure', 'risk', 'loot', 'combat'],
    minRealm: 'core_formation',
    maxRealm: 'soul_transformation',
    weight: 6,
    choices: [
      {
        id: 'seize_eternity',
        text: '夺「永恒」',
        hint: '神级戒指，极险',
        requireAttr: { key: 'will', min: 8 },
        outcomes: [
          {
            weight: 42,
            log: '残影溃散，星砂戒「永恒」入手！',
            equipId: 'eternity',
            equipGrade: 'immortal',
            cultivation: 30,
            daoHeart: 6,
            hp: -15,
          },
          {
            weight: 38,
            log: '力战得戒，身受重创。',
            equipId: 'eternity',
            equipGrade: 'immortal',
            hp: -40,
            injury: 2,
            daoHeart: -3,
          },
          {
            weight: 20,
            log: '残影反噬，宝匣合拢，你险些葬身。',
            hp: -45,
            injury: 3,
            daoHeart: -8,
          },
        ],
      },
      {
        id: 'seize_mouth',
        text: '夺「伦哥哥的嘴」',
        hint: '神级副宝，嘴遁开挂',
        requireAttr: { key: 'luck', min: 7 },
        outcomes: [
          {
            weight: 45,
            log: '你凭气运摸到唇形奇物，残影竟愣了一下——「伦哥哥的嘴」入手。',
            equipId: 'lun_ge_mouth',
            equipGrade: 'immortal',
            stones: 40,
          },
          {
            weight: 35,
            log: '嘴遁成功，带着奇物滚出神藏，皮外伤而已。',
            equipId: 'lun_ge_mouth',
            equipGrade: 'immortal',
            hp: -12,
            injury: 1,
          },
          {
            weight: 20,
            log: '嘴遁失败，被残影扇飞。',
            hp: -38,
            injury: 2,
            karma: 2,
          },
        ],
      },
      {
        id: 'both_gamble',
        text: '贪婪：两件都要',
        hint: '成功率更低，成功则神级套',
        requireAttr: { key: 'luck', min: 9 },
        outcomes: [
          {
            weight: 22,
            log: '天降横财！两件神级至宝尽入囊中。',
            equipId: 'eternity',
            equipGrade: 'immortal',
            equipId2: 'lun_ge_mouth',
            equipGrade2: 'immortal',
            daoHeart: 10,
            karma: 5,
          },
          {
            weight: 48,
            log: '贪念引动反噬，只抢出一件，还受重伤。',
            equipId: 'eternity',
            equipGrade: 'immortal',
            hp: -50,
            injury: 3,
            daoHeart: -6,
          },
          {
            weight: 30,
            log: '神藏崩塌，你空手逃出，半条命没了。',
            hp: -55,
            injury: 3,
            daoHeart: -12,
          },
        ],
      },
      {
        id: 'leave',
        text: '不敢妄动，退去',
        outcomes: [{ weight: 100, log: '你记下方位，改日再来——或去坊市神藏阁买。' }],
      },
    ],
  },
  {
    id: 'high_star_sea',
    title: '外海风云',
    body: '结丹以上修士组队出海，寻海外仙岛残迹。',
    tags: ['adventure', 'risk', 'loot'],
    minRealm: 'core_formation',
    maxRealm: 'soul_transformation',
    weight: 11,
    choices: [
      {
        id: 'sail',
        text: '随船出海',
        outcomes: [
          {
            weight: 55,
            log: '岛上有收获。',
            cultivation: 42,
            stones: 55,
            artId: 'blizzard',
            artFragment: true,
            artGrade: 'mysterious',
          },
          { weight: 30, log: '遇海兽，船毁人伤。', hp: -32, injury: 2 },
          { weight: 15, log: '无功而返。', cultivation: 10 },
        ],
      },
      {
        id: 'no',
        text: '不上船',
        outcomes: [{ weight: 100, log: '你留在大陆。' }],
      },
    ],
  },
  {
    id: 'any_merchant_caravan',
    title: '跨境商队',
    body: '大型商队招聘护卫，按境界付酬，路途漫长。',
    tags: ['social', 'combat', 'trade'],
    minRealm: 'foundation',
    maxRealm: 'nascent_soul',
    weight: 9,
    choices: [
      {
        id: 'escort',
        text: '护送一程',
        outcomes: [
          {
            weight: 70,
            log: '平安送达，报酬丰厚。',
            stones: 55,
            cultivation: 22,
          },
          { weight: 30, log: '遇劫匪，恶战。', stones: 25, hp: -20, cultivation: 15, karma: 4 },
        ],
      },
      {
        id: 'rob',
        text: '反而劫道',
        outcomes: [
          {
            weight: 40,
            log: '得手。',
            stones: 100,
            karma: 20,
            daoHeart: -10,
          },
          { weight: 60, log: '反被杀散。', hp: -35, injury: 2, karma: 5 },
        ],
      },
    ],
  },
  {
    id: 'any_heavenly_sign',
    title: '天象示警',
    body: '夜空异象，高境界修士隐约感到大道变动，低境者只觉心悸。',
    tags: ['cultivate', 'insight'],
    minRealm: 'foundation',
    maxRealm: 'soul_transformation',
    weight: 8,
    choices: [
      {
        id: 'watch',
        text: '观天悟道',
        outcomes: [
          { weight: 70, log: '你有所悟。', cultivation: 25, daoHeart: 4 },
          { weight: 30, log: '只觉茫然。', cultivation: 5 },
        ],
      },
      {
        id: 'ignore',
        text: '倒头就睡',
        outcomes: [{ weight: 100, log: '你错过一丝机缘。' }],
      },
    ],
  },
]
