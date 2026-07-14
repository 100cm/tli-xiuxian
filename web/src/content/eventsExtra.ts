import type { GameEvent, MajorRealm } from '../domain/types'

/** 紧凑工厂：快速堆历练/探险事件 */
function ev(
  id: string,
  title: string,
  body: string,
  opts: {
    tags?: string[]
    minLayer?: number
    minRealm?: MajorRealm
    maxRealm?: MajorRealm
    weight?: number
    once?: boolean
    choices: GameEvent['choices']
  },
): GameEvent {
  return {
    id,
    title,
    body,
    tags: opts.tags ?? ['adventure'],
    minLayer: opts.minLayer,
    minRealm: opts.minRealm,
    maxRealm: opts.maxRealm,
    weight: opts.weight ?? 10,
    once: opts.once,
    choices: opts.choices,
  }
}

const leave = (log = '你离开此处。') => ({
  id: 'leave',
  text: '离开',
  outcomes: [{ weight: 100, log }],
})

/**
 * 大批量历练/探险向事件（补足池子多样性）
 * 合计与 BASE + STAGE 叠加后远超 50 种
 */
export const EXTRA_EVENTS: GameEvent[] = [
  // —— 炼气历练池 ——
  ev('qi_lost_child', '迷路孩童', '村口孩童哭着说进了后山，求你帮忙。', {
    tags: ['adventure', 'social', 'stage:qi_refining'],
    maxRealm: 'qi_refining',
    choices: [
      {
        id: 'help',
        text: '进山寻找',
        outcomes: [
          { weight: 70, log: '你找到孩童，家长重谢。', stones: 10, daoHeart: 4, cultivation: 6 },
          { weight: 30, log: '遇野兽，护住孩童自己受伤。', hp: -12, daoHeart: 6, cultivation: 8 },
        ],
      },
      leave('你事不关己。'),
    ],
  }),
  ev('qi_broken_shrine', '破庙一夜', '天色将晚，前方破庙可避雨，庙里似有烛火。', {
    tags: ['adventure', 'risk', 'stage:qi_refining'],
    maxRealm: 'qi_refining',
    choices: [
      {
        id: 'rest',
        text: '进庙过夜',
        outcomes: [
          { weight: 50, log: '安然一夜，清晨发现香案下有碎银。', stones: 8, hp: 8 },
          { weight: 30, log: '遇小贼，交手后将其赶走。', cultivation: 8, stones: 5 },
          { weight: 20, log: '闹鬼受惊，睡眠很差。', hp: -6, daoHeart: -2 },
        ],
      },
      leave('你选择野外扎营。'),
    ],
  }),
  ev('qi_river_ferry', '渡口纠纷', '渡口船家与散修争执船费，眼看要动手。', {
    tags: ['social', 'combat', 'stage:qi_refining'],
    maxRealm: 'foundation',
    choices: [
      {
        id: 'mediate',
        text: '上前劝架',
        outcomes: [
          { weight: 65, log: '双方罢休，船家免你船费并塞点灵石。', stones: 6, daoHeart: 3 },
          { weight: 35, log: '被迁怒，挨了一拳。', hp: -8 },
        ],
      },
      {
        id: 'side',
        text: '帮船家',
        outcomes: [
          { weight: 70, log: '散修退去，你得感谢。', stones: 12, karma: -1 },
          { weight: 30, log: '散修记恨你。', karma: 3, hp: -10 },
        ],
      },
      leave(),
    ],
  }),
  ev('qi_herb_thief', '药田贼影', '药农喊抓贼，有人刚偷了草药往林子里跑。', {
    tags: ['adventure', 'combat', 'stage:qi_refining'],
    minLayer: 3,
    maxRealm: 'qi_refining',
    choices: [
      {
        id: 'chase',
        text: '追贼',
        outcomes: [
          { weight: 60, log: '你截回草药，药农分你一株。', cultivation: 10, stones: 5, flags: ['herbs'] },
          { weight: 40, log: '追丢了，还摔了一跤。', hp: -6 },
        ],
      },
      leave('你懒得管。'),
    ],
  }),
  ev('qi_gambling_den', '赌石摊', '街边赌石，切开可能有灵晶，也可能是废石。', {
    tags: ['trade', 'risk', 'stage:qi_refining'],
    maxRealm: 'foundation',
    choices: [
      {
        id: 'bet',
        text: '花灵石赌一把',
        costStones: 15,
        outcomes: [
          { weight: 35, log: '切开有灵晶！', stones: 40 },
          { weight: 65, log: '废石，血本无归。', daoHeart: -1 },
        ],
      },
      {
        id: 'watch',
        text: '只看不赌',
        outcomes: [{ weight: 100, log: '你看穿庄家手脚，没上当。', daoHeart: 2 }],
      },
    ],
  }),
  ev('qi_wild_boar', '野猪冲阵', '山道上野猪受惊直冲而来，旁边还有采药人。', {
    tags: ['combat', 'adventure', 'stage:qi_refining'],
    minLayer: 2,
    maxRealm: 'qi_refining',
    choices: [
      {
        id: 'kill',
        text: '击杀野猪',
        outcomes: [
          { weight: 75, log: '野猪倒地，得兽肉与獠牙钱。', stones: 9, cultivation: 7 },
          { weight: 25, log: '被獠牙擦伤。', hp: -10, stones: 4 },
        ],
      },
      {
        id: 'save',
        text: '先护采药人',
        outcomes: [
          { weight: 100, log: '人无事，采药人赠药。', daoHeart: 5, hp: 10, cultivation: 5 },
        ],
      },
    ],
  }),
  ev('qi_old_book', '地摊残卷', '地摊一本发黄残卷，字迹像功法。', {
    tags: ['trade', 'loot', 'stage:qi_refining'],
    maxRealm: 'qi_refining',
    choices: [
      {
        id: 'buy',
        text: '买下',
        costStones: 12,
        outcomes: [
          {
            weight: 50,
            log: '竟是真残篇。',
            artId: 'stoneskin',
            artFragment: true,
            artGrade: 'yellow',
          },
          { weight: 50, log: '伪书。', daoHeart: -1 },
        ],
      },
      leave(),
    ],
  }),
  ev('qi_rain_night', '暴雨赶路', '暴雨如注，前方岔路一条进村，一条抄近路进林。', {
    tags: ['adventure', 'stage:qi_refining'],
    maxRealm: 'qi_refining',
    choices: [
      {
        id: 'village',
        text: '进村借宿',
        outcomes: [
          { weight: 80, log: '村民收留你，聊到附近秘闻。', hp: 6, cultivation: 4 },
          { weight: 20, log: '被敲竹杠。', stones: -5, hp: 4 },
        ],
      },
      {
        id: 'forest',
        text: '抄近路',
        outcomes: [
          { weight: 55, log: '顺利抄近，还捡到避雨猎人落下的钱袋。', stones: 7 },
          { weight: 45, log: '迷路湿身，受凉。', hp: -8 },
        ],
      },
    ],
  }),
  ev('qi_beggar_monk', '疯丐指路', '疯丐抓住你袖子：「左边死，右边生……」又改口。', {
    tags: ['adventure', 'risk', 'stage:qi_refining'],
    maxRealm: 'foundation',
    choices: [
      {
        id: 'left',
        text: '走左边',
        outcomes: [
          { weight: 40, log: '遇伏击，苦战。', hp: -14, cultivation: 9 },
          { weight: 60, log: '发现一处隐蔽灵泉。', cultivation: 14, hp: 5 },
        ],
      },
      {
        id: 'right',
        text: '走右边',
        outcomes: [
          { weight: 70, log: '平坦大路。', cultivation: 3 },
          { weight: 30, log: '也有惊喜：路旁灵草。', cultivation: 8, flags: ['herbs'] },
        ],
      },
      {
        id: 'ask',
        text: '再问清楚',
        requireAttr: { key: 'int', min: 4 },
        outcomes: [
          { weight: 100, log: '你听出他在说矿洞方位。', flags: ['mine_marked'], cultivation: 5 },
        ],
      },
    ],
  }),
  ev('qi_talent_show', '坊市比武凑热闹', '低阶擂台报名费不高，胜者有小奖。', {
    tags: ['combat', 'stage:qi_refining'],
    minLayer: 4,
    maxRealm: 'qi_refining',
    choices: [
      {
        id: 'join',
        text: '报名比武',
        costStones: 5,
        outcomes: [
          { weight: 55, log: '连胜拿奖。', stones: 20, cultivation: 12, skillXp: 10 },
          { weight: 45, log: '落败，丢点面子。', hp: -10, daoHeart: -1 },
        ],
      },
      leave('你只是路过。'),
    ],
  }),

  // —— 筑基历练 ——
  ev('f_array_repair', '残阵求修', '一户散修请你帮忙修复护宅小阵，出价不低。', {
    tags: ['social', 'adventure', 'stage:foundation'],
    minRealm: 'foundation',
    maxRealm: 'core_formation',
    choices: [
      {
        id: 'fix',
        text: '出手修阵',
        requireAttr: { key: 'int', min: 6 },
        outcomes: [
          { weight: 75, log: '阵成，你得酬劳与感悟。', stones: 30, cultivation: 18 },
          { weight: 25, log: '阵纹反噬。', hp: -12, cultivation: 8 },
        ],
      },
      {
        id: 'refuse',
        text: '不会阵法',
        outcomes: [{ weight: 100, log: '你婉拒。' }],
      },
    ],
  }),
  ev('f_beast_tide_edge', '兽潮边缘', '远山兽潮起，边缘有逃散灵兽与伤者。', {
    tags: ['combat', 'adventure', 'risk', 'stage:foundation'],
    minRealm: 'foundation',
    maxRealm: 'foundation',
    choices: [
      {
        id: 'hunt',
        text: '猎杀落单灵兽',
        outcomes: [
          {
            weight: 60,
            log: '收获兽核。',
            stones: 28,
            cultivation: 22,
            equipId: 'beast_bracer',
            equipGrade: 'yellow',
          },
          { weight: 40, log: '被兽群波及。', hp: -20, injury: 1 },
        ],
      },
      {
        id: 'rescue',
        text: '救人',
        outcomes: [
          { weight: 100, log: '救下散修，对方许诺日后报恩。', daoHeart: 6, karma: -3, flags: ['owe_favor'] },
        ],
      },
    ],
  }),
  ev('f_fake_immortal', '伪仙骗局', '有人自称上宗传人，招收记名弟子收灵石。', {
    tags: ['social', 'risk', 'trade', 'stage:foundation'],
    minRealm: 'foundation',
    maxRealm: 'foundation',
    choices: [
      {
        id: 'expose',
        text: '揭穿骗局',
        requireAttr: { key: 'int', min: 6 },
        outcomes: [
          { weight: 70, log: '众人醒悟，你得赞誉与薄礼。', stones: 20, daoHeart: 5 },
          { weight: 30, log: '对方同伙围你。', hp: -16 },
        ],
      },
      {
        id: 'join',
        text: '交灵石拜师',
        costStones: 30,
        outcomes: [
          { weight: 20, log: '竟是真的偏门传承！', cultivation: 25, artId: 'blink', artGrade: 'yellow' },
          { weight: 80, log: '人跑了。', daoHeart: -4 },
        ],
      },
      leave(),
    ],
  }),
  ev('f_sky_meteor', '陨星碎片', '夜空流星坠林，多人赶去争抢。', {
    tags: ['adventure', 'loot', 'combat', 'stage:foundation'],
    minRealm: 'foundation',
    maxRealm: 'core_formation',
    choices: [
      {
        id: 'race',
        text: '抢先赶到',
        outcomes: [
          {
            weight: 45,
            log: '你抢到一小块陨铁。',
            stones: 35,
            cultivation: 20,
            equipId: 'storage_ring',
            equipGrade: 'yellow',
          },
          { weight: 40, log: '混战中受伤，只得边角。', hp: -18, stones: 10 },
          { weight: 15, log: '什么也没捞到。' },
        ],
      },
      leave('你不参与争抢。'),
    ],
  }),
  ev('f_poison_marsh', '毒泽采药', '毒泽深处有奇花，据说可炼筑基辅助药。', {
    tags: ['adventure', 'risk', 'alchemy', 'stage:foundation'],
    minRealm: 'foundation',
    maxRealm: 'foundation',
    choices: [
      {
        id: 'pick',
        text: '深入采花',
        outcomes: [
          { weight: 50, log: '得花，也中了轻毒。', cultivation: 16, flags: ['herbs'], hp: -12 },
          { weight: 30, log: '顺利得花。', cultivation: 20, flags: ['herbs'], stones: 10 },
          { weight: 20, log: '迷途，几乎被毒虫围。', hp: -22, injury: 1 },
        ],
      },
      leave(),
    ],
  }),
  ev('f_duel_invite', '约战名帖', '同境修士送来约战帖，胜者可拿对方一件法器。', {
    tags: ['combat', 'stage:foundation'],
    minRealm: 'foundation',
    maxRealm: 'core_formation',
    choices: [
      {
        id: 'accept',
        text: '应战',
        outcomes: [
          {
            weight: 55,
            log: '你胜，得法器。',
            cultivation: 24,
            skillXp: 18,
            equipId: 'spirit_mirror',
            equipGrade: 'yellow',
          },
          { weight: 45, log: '你败，破财免灾。', hp: -20, stones: -15, daoHeart: -2 },
        ],
      },
      {
        id: 'decline',
        text: '拒战',
        outcomes: [{ weight: 100, log: '对方冷笑离去。', daoHeart: -1 }],
      },
    ],
  }),
  ev('f_ruin_stele', '残碑悟道', '荒原残碑上刻有筑基心法残句。', {
    tags: ['cultivate', 'adventure', 'stage:foundation'],
    minRealm: 'foundation',
    maxRealm: 'foundation',
    choices: [
      {
        id: 'study',
        text: '参悟残碑',
        outcomes: [
          { weight: 70, log: '有所得。', cultivation: 26, daoHeart: 3 },
          { weight: 30, log: '走火片刻。', hp: -10, cultivation: 8 },
        ],
      },
      leave(),
    ],
  }),
  ev('f_caravan_map', '商队藏宝图', '商队护卫醉后透露半张藏宝图，可买。', {
    tags: ['trade', 'adventure', 'stage:foundation'],
    minRealm: 'foundation',
    maxRealm: 'core_formation',
    choices: [
      {
        id: 'buy',
        text: '买下',
        costStones: 25,
        outcomes: [
          {
            weight: 60,
            log: '图是真的，你找到小窖藏。',
            stones: 60,
            cultivation: 12,
          },
          { weight: 40, log: '假图。', daoHeart: -2 },
        ],
      },
      leave(),
    ],
  }),

  // —— 结丹历练 ——
  ev('c_flame_mountain', '火脉试炼', '火山地火喷发期，结丹修士可淬体，风险极高。', {
    tags: ['adventure', 'cultivate', 'risk', 'stage:core_formation'],
    minRealm: 'core_formation',
    maxRealm: 'core_formation',
    choices: [
      {
        id: 'quench',
        text: '以体淬火',
        outcomes: [
          { weight: 50, log: '淬体成功。', cultivation: 40, hp: -15 },
          { weight: 50, log: '灼伤严重。', hp: -32, injury: 2, cultivation: 12 },
        ],
      },
      {
        id: 'collect',
        text: '只采火晶',
        outcomes: [
          { weight: 70, log: '得火晶售出。', stones: 45, cultivation: 15 },
          { weight: 30, log: '地火爆发，仓皇逃。', hp: -18 },
        ],
      },
    ],
  }),
  ev('c_mirror_lake', '镜湖倒影', '湖面倒映出你的金丹虚影，可观想加速凝实，或招来窥伺。', {
    tags: ['cultivate', 'risk', 'stage:core_formation'],
    minRealm: 'core_formation',
    maxRealm: 'core_formation',
    choices: [
      {
        id: 'gaze',
        text: '观想三日',
        outcomes: [
          { weight: 65, log: '金丹更凝。', cultivation: 38, daoHeart: 4 },
          { weight: 35, log: '被人偷袭打断。', hp: -20, cultivation: 10 },
        ],
      },
      leave('你不敢久留。'),
    ],
  }),
  ev('c_assassin', '黑夜刺客', '有人悬赏你的人头，刺客已至窗外。', {
    tags: ['combat', 'risk', 'stage:core_formation'],
    minRealm: 'core_formation',
    maxRealm: 'nascent_soul',
    choices: [
      {
        id: 'fight',
        text: '反杀',
        outcomes: [
          {
            weight: 55,
            log: '刺客伏诛，搜出雇主信物与灵石。',
            stones: 50,
            cultivation: 30,
            karma: 6,
            skillXp: 15,
          },
          { weight: 45, log: '两败俱伤，刺客逃。', hp: -28, injury: 1 },
        ],
      },
      {
        id: 'flee',
        text: '遁逃',
        requireAttr: { key: 'agi', min: 7 },
        outcomes: [{ weight: 100, log: '你全身而退。', cultivation: 8 }],
      },
    ],
  }),
  ev('c_alchemy_contest', '炼丹小会', '坊市办低阶丹会，可参赛赌名。', {
    tags: ['alchemy', 'social', 'stage:core_formation'],
    minRealm: 'core_formation',
    maxRealm: 'core_formation',
    choices: [
      {
        id: 'join',
        text: '参赛',
        requireHero: 'sage_licorice',
        outcomes: [
          {
            weight: 80,
            log: '赛琪手艺惊艳，夺魁。',
            stones: 70,
            cultivation: 25,
            daoHeart: 5,
          },
          { weight: 20, log: '发挥失常。', daoHeart: -2 },
        ],
      },
      {
        id: 'normal',
        text: '普通人参赛',
        outcomes: [
          { weight: 40, log: '勉强入围有赏。', stones: 25, cultivation: 12 },
          { weight: 60, log: '炸炉，丢脸。', hp: -8, stones: -10 },
        ],
      },
      leave(),
    ],
  }),
  ev('c_ancient_boat', '古舟靠岸', '一条无主古舟靠岸，舟内阵法未尽。', {
    tags: ['adventure', 'loot', 'risk', 'stage:core_formation'],
    minRealm: 'core_formation',
    maxRealm: 'nascent_soul',
    choices: [
      {
        id: 'board',
        text: '登舟',
        outcomes: [
          {
            weight: 50,
            log: '得舟中宝匣。',
            stones: 40,
            cultivation: 28,
            equipId: 'silk_glove',
            equipGrade: 'mysterious',
          },
          { weight: 50, log: '阵法启动，你被弹飞。', hp: -24, injury: 1 },
        ],
      },
      leave(),
    ],
  }),
  ev('c_dao_companion_tea', '论道茶会', '结丹同道办茶会，谈丹道与人心。', {
    tags: ['social', 'cultivate', 'stage:core_formation'],
    minRealm: 'core_formation',
    maxRealm: 'nascent_soul',
    choices: [
      {
        id: 'talk',
        text: '畅谈',
        outcomes: [
          { weight: 100, log: '相谈甚欢，互有印证。', cultivation: 22, daoHeart: 6, stones: 10 },
        ],
      },
      {
        id: 'silent',
        text: '静听',
        outcomes: [{ weight: 100, log: '你默默记下要点。', cultivation: 14 }],
      },
    ],
  }),
  ev('c_blood_arena', '血斗场邀请', '地下血斗场邀你下场，奖金极高。', {
    tags: ['combat', 'demon', 'stage:core_formation'],
    minRealm: 'core_formation',
    maxRealm: 'core_formation',
    choices: [
      {
        id: 'fight',
        text: '下场',
        outcomes: [
          {
            weight: 50,
            log: '连胜，奖金入袋。',
            stones: 90,
            cultivation: 35,
            karma: 12,
            skillXp: 20,
          },
          { weight: 50, log: '惨胜或惨败，重伤。', hp: -35, injury: 2, stones: 20 },
        ],
      },
      leave('你不想沾血。'),
    ],
  }),
  ev('c_ice_cave', '极寒洞天', '传闻洞内有助凝丹的寒髓。', {
    tags: ['adventure', 'cultivate', 'stage:core_formation'],
    minRealm: 'core_formation',
    maxRealm: 'core_formation',
    choices: [
      {
        id: 'enter',
        text: '入洞采髓',
        outcomes: [
          {
            weight: 55,
            log: '得寒髓，修为大进。',
            cultivation: 42,
            artId: 'frost_shield',
            artGrade: 'yellow',
          },
          { weight: 45, log: '寒气侵体。', hp: -26, cultivation: 12 },
        ],
      },
      leave(),
    ],
  }),

  // —— 元婴历练 ——
  ev('n_divination', '推演天机', '你偶得残破星盘，可推演近身危机。', {
    tags: ['insight', 'adventure', 'stage:nascent_soul'],
    minRealm: 'nascent_soul',
    maxRealm: 'soul_transformation',
    choices: [
      {
        id: 'cast',
        text: '推演',
        requireAttr: { key: 'int', min: 9 },
        outcomes: [
          { weight: 70, log: '你避开一次暗杀布局。', daoHeart: 5, cultivation: 20 },
          { weight: 30, log: '天机反噬，头痛欲裂。', hp: -15, daoHeart: -4 },
        ],
      },
      leave('你封存星盘。'),
    ],
  }),
  ev('n_clone_trouble', '一具傀儡', '市上出售近似你外貌的傀儡，有人要拿它顶罪。', {
    tags: ['social', 'risk', 'stage:nascent_soul'],
    minRealm: 'nascent_soul',
    maxRealm: 'nascent_soul',
    choices: [
      {
        id: 'destroy',
        text: '毁掉傀儡',
        outcomes: [
          { weight: 60, log: '隐患消除，卖家记恨。', daoHeart: 4, karma: 2 },
          { weight: 40, log: '引发冲突。', hp: -18, stones: -20 },
        ],
      },
      {
        id: 'buy',
        text: '买下自己控制',
        costStones: 60,
        outcomes: [
          { weight: 100, log: '你得一具可用傀儡，略增战力体感。', cultivation: 15, stones: 0 },
        ],
      },
    ],
  }),
  ev('n_space_fold', '折叠空间', '一处空间褶皱露出入口，内似有洞天。', {
    tags: ['adventure', 'loot', 'risk', 'stage:nascent_soul'],
    minRealm: 'nascent_soul',
    maxRealm: 'soul_transformation',
    choices: [
      {
        id: 'enter',
        text: '闪入',
        outcomes: [
          {
            weight: 50,
            log: '得洞天机缘。',
            cultivation: 48,
            equipId: 'mind_crown',
            equipGrade: 'mysterious',
          },
          { weight: 35, log: '空间乱流割伤元婴。', hp: -30, daoHeart: -5 },
          { weight: 15, log: '空手而归。', cultivation: 10 },
        ],
      },
      leave(),
    ],
  }),
  ev('n_preach', '开坛讲法', '有人请你开坛讲元婴心得，可收束修金。', {
    tags: ['social', 'cultivate', 'stage:nascent_soul'],
    minRealm: 'nascent_soul',
    maxRealm: 'nascent_soul',
    choices: [
      {
        id: 'yes',
        text: '开坛',
        outcomes: [
          { weight: 80, log: '讲法顺利，名利双收。', stones: 70, cultivation: 20, daoHeart: 4 },
          { weight: 20, log: '被挑刺，不欢而散。', daoHeart: -3, stones: 20 },
        ],
      },
      leave('你闭关谢客。'),
    ],
  }),
  ev('n_blood_moon', '血月异变', '血月当空，魔修活跃，正道清剿，两边都在拉人。', {
    tags: ['combat', 'demon', 'stage:nascent_soul'],
    minRealm: 'nascent_soul',
    maxRealm: 'soul_transformation',
    choices: [
      {
        id: 'righteous',
        text: '随正道清剿',
        outcomes: [
          {
            weight: 60,
            log: '杀魔有功。',
            cultivation: 36,
            karma: -6,
            stones: 40,
          },
          { weight: 40, log: '魔修反扑，你负伤。', hp: -28, injury: 1, cultivation: 15 },
        ],
      },
      {
        id: 'demon',
        text: '趁乱捞好处',
        outcomes: [
          {
            weight: 55,
            log: '捞到宝物。',
            stones: 80,
            karma: 10,
            equipId: 'blood_ring',
            equipGrade: 'mysterious',
          },
          { weight: 45, log: '被两边记恨。', hp: -22, karma: 8 },
        ],
      },
    ],
  }),
  ev('n_infant_fire', '养婴真火', '你需借天地火脉温养元婴，找一处安全火眼。', {
    tags: ['cultivate', 'adventure', 'stage:nascent_soul'],
    minRealm: 'nascent_soul',
    maxRealm: 'nascent_soul',
    choices: [
      {
        id: 'find',
        text: '寻火眼温养',
        outcomes: [
          { weight: 65, log: '温养成功。', cultivation: 44, daoHeart: 3 },
          { weight: 35, log: '火脉不稳，反噬。', hp: -24, cultivation: 12 },
        ],
      },
      leave('改日再寻。'),
    ],
  }),
  ev('n_trade_war', '商会火并', '两大商会火并，雇元婴强者镇场。', {
    tags: ['combat', 'trade', 'stage:nascent_soul'],
    minRealm: 'nascent_soul',
    maxRealm: 'nascent_soul',
    choices: [
      {
        id: 'hire',
        text: '接受雇佣',
        outcomes: [
          { weight: 70, log: '镇住场面，酬金丰厚。', stones: 100, cultivation: 18 },
          { weight: 30, log: '混战波及。', hp: -26, stones: 40 },
        ],
      },
      leave(),
    ],
  }),
  ev('n_memory_pearl', '记忆灵珠', '一颗灵珠含前人记忆，观之可悟，亦可能迷失。', {
    tags: ['insight', 'risk', 'loot', 'stage:nascent_soul'],
    minRealm: 'nascent_soul',
    maxRealm: 'soul_transformation',
    choices: [
      {
        id: 'view',
        text: '观想记忆',
        outcomes: [
          {
            weight: 55,
            log: '悟得功法片段。',
            cultivation: 40,
            artId: 'scorching_beam',
            artFragment: true,
            artGrade: 'mysterious',
          },
          { weight: 45, log: '险些迷失自我。', daoHeart: -10, hp: -12 },
        ],
      },
      {
        id: 'sell',
        text: '卖给收藏家',
        outcomes: [{ weight: 100, log: '换来巨款。', stones: 90 }],
      },
    ],
  }),

  // —— 化神历练 ——
  ev('s_law_fragment', '法则碎片雨', '天降细碎法则光，可炼化，可售予道统。', {
    tags: ['cultivate', 'loot', 'stage:soul_transformation'],
    minRealm: 'soul_transformation',
    maxRealm: 'soul_transformation',
    choices: [
      {
        id: 'refine',
        text: '炼化入体',
        outcomes: [
          { weight: 60, log: '神台稳固。', cultivation: 55, daoHeart: 6 },
          { weight: 40, log: '冲突，神台震痛。', hp: -28, cultivation: 15 },
        ],
      },
      {
        id: 'sell',
        text: '出售',
        outcomes: [{ weight: 100, log: '道统高价收购。', stones: 130 }],
      },
    ],
  }),
  ev('s_young_genius', '后辈请教', '一名结丹天才跪求点拨，或成善缘，或成隐患。', {
    tags: ['social', 'stage:soul_transformation'],
    minRealm: 'soul_transformation',
    maxRealm: 'soul_transformation',
    choices: [
      {
        id: 'teach',
        text: '点拨一二',
        outcomes: [
          { weight: 100, log: '后辈大礼致谢，你心境平和。', daoHeart: 8, karma: -4, stones: 40 },
        ],
      },
      {
        id: 'reject',
        text: '闭门不见',
        outcomes: [{ weight: 100, log: '你专心己道。' }],
      },
    ],
  }),
  ev('s_corpse_immortal', '尸化遗蜕', '前辈化神遗蜕有尸变征兆，需镇压或夺宝。', {
    tags: ['combat', 'risk', 'loot', 'stage:soul_transformation'],
    minRealm: 'soul_transformation',
    maxRealm: 'soul_transformation',
    choices: [
      {
        id: 'suppress',
        text: '镇压遗蜕',
        outcomes: [
          {
            weight: 65,
            log: '镇压成功，得遗宝。',
            cultivation: 50,
            daoHeart: 6,
            equipId: 'dao_heart_pendant',
            equipGrade: 'mysterious',
          },
          { weight: 35, log: '尸变反扑。', hp: -40, injury: 2 },
        ],
      },
      {
        id: 'loot',
        text: '只夺宝不镇压',
        outcomes: [
          {
            weight: 50,
            log: '夺宝成功，遗祸地方。',
            stones: 100,
            karma: 15,
            daoHeart: -8,
          },
          { weight: 50, log: '失败被尸气击伤。', hp: -35 },
        ],
      },
    ],
  }),
  ev('s_dream_dao', '大道梦境', '入定入梦，见未成之未来与已斩之可能。', {
    tags: ['cultivate', 'insight', 'stage:soul_transformation'],
    minRealm: 'soul_transformation',
    maxRealm: 'soul_transformation',
    choices: [
      {
        id: 'walk',
        text: '在梦中行走',
        outcomes: [
          { weight: 70, log: '梦醒大悟。', cultivation: 60, daoHeart: 10 },
          { weight: 30, log: '执念加深。', daoHeart: -8, cultivation: 20 },
        ],
      },
      {
        id: 'wake',
        text: '立即醒转',
        outcomes: [{ weight: 100, log: '你稳住心神。', daoHeart: 3 }],
      },
    ],
  }),
  ev('s_invite_war', '域外战书', '域外修士下战书，约战虚空，观战者云集。', {
    tags: ['combat', 'stage:soul_transformation'],
    minRealm: 'soul_transformation',
    maxRealm: 'soul_transformation',
    choices: [
      {
        id: 'accept',
        text: '应战',
        outcomes: [
          {
            weight: 50,
            log: '险胜，名动一方。',
            cultivation: 55,
            stones: 80,
            skillXp: 30,
            daoHeart: 5,
          },
          { weight: 50, log: '惨胜或落败，重伤。', hp: -45, injury: 2, cultivation: 15 },
        ],
      },
      {
        id: 'decline',
        text: '拒战',
        outcomes: [{ weight: 100, log: '有人笑你怯战。', daoHeart: -2 }],
      },
    ],
  }),
  ev('s_world_tree', '世界树苗', '一株疑似世界树幼苗待认主，需神念灌养。', {
    tags: ['adventure', 'cultivate', 'stage:soul_transformation'],
    minRealm: 'soul_transformation',
    maxRealm: 'soul_transformation',
    once: true,
    choices: [
      {
        id: 'bond',
        text: '灌养认主',
        outcomes: [
          {
            weight: 60,
            log: '树苗认你，反哺灵气。',
            cultivation: 70,
            daoHeart: 8,
            equipId: 'spirit_jade',
            equipGrade: 'mysterious',
          },
          { weight: 40, log: '灌养失败，神念受损。', hp: -30, daoHeart: -6 },
        ],
      },
      leave('你不敢轻染因果。'),
    ],
  }),

  // —— 跨阶段通用历练（量大管饱） ——
  ev('g_storm_chase', '追风暴', '灵气风暴扫过荒原，边缘可采气，中心九死一生。', {
    tags: ['adventure', 'cultivate', 'risk'],
    minRealm: 'foundation',
    maxRealm: 'nascent_soul',
    choices: [
      {
        id: 'edge',
        text: '边缘采气',
        outcomes: [
          { weight: 80, log: '采气有成。', cultivation: 28 },
          { weight: 20, log: '被卷到边缘内。', hp: -16, cultivation: 12 },
        ],
      },
      {
        id: 'center',
        text: '冲向中心',
        outcomes: [
          { weight: 35, log: '豪赌成功。', cultivation: 50, stones: 20 },
          { weight: 65, log: '重伤。', hp: -30, injury: 2 },
        ],
      },
    ],
  }),
  ev('g_mysterious_merchant', '蒙面行商', '蒙面人出售「不知名玉盒」，只收灵石不讲来历。', {
    tags: ['trade', 'risk'],
    minRealm: 'qi_refining',
    maxRealm: 'soul_transformation',
    choices: [
      {
        id: 'buy',
        text: '买下',
        costStones: 35,
        outcomes: [
          {
            weight: 40,
            log: '盒中有宝。',
            equipId: 'wind_boots',
            equipGrade: 'yellow',
            cultivation: 10,
          },
          { weight: 40, log: '空盒。' },
          { weight: 20, log: '盒中有邪物，伤神。', daoHeart: -6, hp: -8 },
        ],
      },
      leave(),
    ],
  }),
  ev('g_spirit_vein_dispute', '灵脉争夺', '一处小灵脉被两伙人争夺，两边都喊你帮忙。', {
    tags: ['combat', 'social'],
    minRealm: 'foundation',
    maxRealm: 'core_formation',
    choices: [
      {
        id: 'a',
        text: '帮甲方',
        outcomes: [
          { weight: 60, log: '甲方胜，分你灵石。', stones: 40, cultivation: 15 },
          { weight: 40, log: '混战受伤。', hp: -18, stones: 10 },
        ],
      },
      {
        id: 'b',
        text: '帮乙方',
        outcomes: [
          { weight: 60, log: '乙方胜，分你灵石。', stones: 40, cultivation: 15 },
          { weight: 40, log: '混战受伤。', hp: -18, stones: 10 },
        ],
      },
      {
        id: 'both',
        text: '两边都骗',
        outcomes: [
          { weight: 30, log: '成功卷走定金。', stones: 50, karma: 8, daoHeart: -5 },
          { weight: 70, log: '败露被围殴。', hp: -25, karma: 5 },
        ],
      },
    ],
  }),
  ev('g_lonely_grave', '无主孤坟', '新起的坟，碑上无字，夜间有哭声。', {
    tags: ['adventure', 'risk', 'demon'],
    minRealm: 'qi_refining',
    maxRealm: 'foundation',
    choices: [
      {
        id: 'dig',
        text: '掘坟一探究竟',
        outcomes: [
          {
            weight: 45,
            log: '得葬物。',
            stones: 22,
            equipId: 'stone_pendant',
            equipGrade: 'mortal',
            karma: 5,
          },
          { weight: 55, log: '惊动怨灵。', hp: -14, daoHeart: -3 },
        ],
      },
      {
        id: 'pray',
        text: '祭拜超度',
        outcomes: [{ weight: 100, log: '哭声止，你心安。', daoHeart: 5, karma: -2 }],
      },
    ],
  }),
  ev('g_map_fragment', '残破地图', '你捡到半张秘境地图，缺了关键一角。', {
    tags: ['adventure', 'loot'],
    minRealm: 'qi_refining',
    maxRealm: 'core_formation',
    choices: [
      {
        id: 'seek',
        text: '按图寻找',
        outcomes: [
          { weight: 50, log: '找到小机缘。', cultivation: 16, stones: 15 },
          { weight: 50, log: '白跑一趟。', cultivation: 4 },
        ],
      },
      {
        id: 'sell',
        text: '卖掉地图',
        outcomes: [{ weight: 100, log: '卖了点钱。', stones: 18 }],
      },
    ],
  }),
  ev('g_drunken_immortal', '醉仙居', '酒楼号称「一醉三年梦」，酒里疑有幻药。', {
    tags: ['social', 'risk', 'trade'],
    minRealm: 'foundation',
    maxRealm: 'nascent_soul',
    choices: [
      {
        id: 'drink',
        text: '饮一杯',
        costStones: 20,
        outcomes: [
          { weight: 50, log: '酒中有益，修为上涨。', cultivation: 24, daoHeart: 2 },
          { weight: 50, log: '大醉三日，财物略少。', stones: -10, hp: 5 },
        ],
      },
      leave('你滴酒不沾。'),
    ],
  }),
  ev('g_spirit_beast_egg', '灵兽蛋', '摊位卖「疑似灵兽蛋」，保温阵还在转。', {
    tags: ['trade', 'adventure'],
    minRealm: 'foundation',
    maxRealm: 'core_formation',
    choices: [
      {
        id: 'buy',
        text: '买下孵化',
        costStones: 45,
        outcomes: [
          { weight: 40, log: '孵出灵兽幼体，卖了个好价钱。', stones: 90, cultivation: 10 },
          { weight: 40, log: '假蛋。', daoHeart: -2 },
          { weight: 20, log: '孵出食人怪虫，击杀之。', hp: -16, cultivation: 12 },
        ],
      },
      leave(),
    ],
  }),
  ev('g_thunder_pool', '雷池边缘', '天然雷池边缘可淬体，再往里则危险倍增。', {
    tags: ['cultivate', 'risk', 'adventure'],
    minRealm: 'core_formation',
    maxRealm: 'soul_transformation',
    choices: [
      {
        id: 'edge',
        text: '边缘淬体',
        outcomes: [
          { weight: 70, log: '体魄增强。', cultivation: 32, hp: -10 },
          { weight: 30, log: '雷丝缠身。', hp: -22, cultivation: 12 },
        ],
      },
      {
        id: 'deep',
        text: '深入雷池',
        outcomes: [
          { weight: 30, log: '浴火重生般精进。', cultivation: 55 },
          { weight: 70, log: '重创。', hp: -40, injury: 2 },
        ],
      },
    ],
  }),
  ev('g_wanted_board', '悬赏栏', '城门悬赏栏贴着多个任务，可接一桩。', {
    tags: ['combat', 'social', 'adventure'],
    minRealm: 'qi_refining',
    maxRealm: 'nascent_soul',
    choices: [
      {
        id: 'beast',
        text: '接猎妖悬赏',
        outcomes: [
          { weight: 65, log: '完成悬赏。', stones: 30, cultivation: 14, karma: 2 },
          { weight: 35, log: '任务比描述危险。', hp: -16, stones: 10 },
        ],
      },
      {
        id: 'escort',
        text: '接护送悬赏',
        outcomes: [
          { weight: 70, log: '平安送达。', stones: 28, daoHeart: 2 },
          { weight: 30, log: '遇劫。', hp: -14, stones: 8 },
        ],
      },
      leave('你一个也不接。'),
    ],
  }),
  ev('g_mirror_me', '镜中我', '古镜映出另一个选择下的你，伸手似要换位。', {
    tags: ['risk', 'insight', 'adventure'],
    minRealm: 'foundation',
    maxRealm: 'soul_transformation',
    choices: [
      {
        id: 'touch',
        text: '触碰镜面',
        outcomes: [
          { weight: 40, log: '你汲取了「另一个自己」的一丝感悟。', cultivation: 35, daoHeart: -3 },
          { weight: 40, log: '心神错乱片刻。', daoHeart: -8, hp: -10 },
          { weight: 20, log: '镜碎，得镜屑材料。', stones: 25 },
        ],
      },
      {
        id: 'smash',
        text: '打碎古镜',
        outcomes: [{ weight: 100, log: '隐患消除。', daoHeart: 4 }],
      },
    ],
  }),
  ev('g_silent_village', '无声村落', '整村无人，灶上饭菜尚温，地上有拖行痕迹。', {
    tags: ['adventure', 'risk', 'demon'],
    minRealm: 'qi_refining',
    maxRealm: 'core_formation',
    choices: [
      {
        id: 'invest',
        text: '调查',
        outcomes: [
          {
            weight: 50,
            log: '找出邪修据点并摧毁，救出少量村民。',
            daoHeart: 8,
            karma: -5,
            cultivation: 18,
            stones: 15,
          },
          { weight: 50, log: '中埋伏。', hp: -20, injury: 1 },
        ],
      },
      leave('你快速离开并报官。'),
    ],
  }),
  ev('g_floating_island', '浮空岛影', '云中浮岛一角露出，有人架梯攀登。', {
    tags: ['adventure', 'loot'],
    minRealm: 'core_formation',
    maxRealm: 'soul_transformation',
    choices: [
      {
        id: 'climb',
        text: '攀登',
        outcomes: [
          {
            weight: 55,
            log: '岛上有遗物。',
            cultivation: 36,
            equipId: 'cloud_robe',
            equipGrade: 'yellow',
          },
          { weight: 45, log: '摔落半空，勉强自救。', hp: -28, injury: 1 },
        ],
      },
      leave(),
    ],
  }),
  ev('g_time_hourglass', '时光沙漏', '一枚沙漏倒转时，你感到周围时间变慢。', {
    tags: ['insight', 'cultivate', 'risk'],
    minRealm: 'nascent_soul',
    maxRealm: 'soul_transformation',
    choices: [
      {
        id: 'use',
        text: '借沙漏修炼',
        outcomes: [
          { weight: 60, log: '一时精进神速。', cultivation: 52 },
          { weight: 40, log: '时流速乱，神识受损。', hp: -20, daoHeart: -5, cultivation: 15 },
        ],
      },
      {
        id: 'store',
        text: '收起不碰',
        outcomes: [{ weight: 100, log: '你封印沙漏。', daoHeart: 3 }],
      },
    ],
  }),
  ev('g_black_market_list', '黑名单', '你发现自己的名字出现在黑市杀手名单上。', {
    tags: ['risk', 'combat', 'social'],
    minRealm: 'foundation',
    maxRealm: 'nascent_soul',
    choices: [
      {
        id: 'buy_out',
        text: '花钱消名',
        costStones: 40,
        outcomes: [{ weight: 100, log: '名单上除名。', daoHeart: 2 }],
      },
      {
        id: 'hunt',
        text: '反杀接头人',
        outcomes: [
          {
            weight: 55,
            log: '接头人伏诛，名单烧毁。',
            stones: 25,
            karma: 6,
            cultivation: 16,
          },
          { weight: 45, log: '反被埋伏。', hp: -22, injury: 1 },
        ],
      },
      leave('你改变路线躲避。'),
    ],
  }),
  ev('g_rainbow_bridge', '虹桥横空', '雨后虹桥凝实可走，桥对面似有仙音。', {
    tags: ['adventure', 'cultivate'],
    minRealm: 'qi_refining',
    maxRealm: 'soul_transformation',
    choices: [
      {
        id: 'cross',
        text: '踏上虹桥',
        outcomes: [
          { weight: 55, log: '桥上感悟灵韵。', cultivation: 20, daoHeart: 3 },
          { weight: 30, log: '虹桥消散，你坠落受伤。', hp: -15 },
          { weight: 15, log: '遇桥上遗落灵物。', stones: 20, cultivation: 12 },
        ],
      },
      leave('你只是看风景。'),
    ],
  }),
  ev('g_echo_cave', '回音洞窟', '洞窟会放大心声，久留易心魔，短悟却有奇效。', {
    tags: ['cultivate', 'risk'],
    minRealm: 'foundation',
    maxRealm: 'nascent_soul',
    choices: [
      {
        id: 'short',
        text: '短坐一刻',
        outcomes: [
          { weight: 80, log: '心境明朗。', cultivation: 18, daoHeart: 5 },
          { weight: 20, log: '被自己心声吓到。', daoHeart: -3 },
        ],
      },
      {
        id: 'long',
        text: '强行久关',
        outcomes: [
          { weight: 40, log: '大悟。', cultivation: 40, daoHeart: 2 },
          { weight: 60, log: '心魔滋生。', daoHeart: -12, hp: -10 },
        ],
      },
    ],
  }),
  ev('g_star_iron', '星铁坠落', '一块星铁落入山谷，引多方争夺。', {
    tags: ['combat', 'loot', 'adventure'],
    minRealm: 'core_formation',
    maxRealm: 'soul_transformation',
    choices: [
      {
        id: 'grab',
        text: '抢星铁',
        outcomes: [
          {
            weight: 40,
            log: '得手。',
            stones: 70,
            equipId: 'flame_spear',
            equipGrade: 'mysterious',
            karma: 5,
          },
          { weight: 60, log: '混战重伤。', hp: -32, injury: 1 },
        ],
      },
      {
        id: 'wait',
        text: '等两败俱伤再取',
        outcomes: [
          { weight: 50, log: '渔翁得利。', stones: 50, cultivation: 12 },
          { weight: 50, log: '被第三方盯上。', hp: -18 },
        ],
      },
    ],
  }),
]

