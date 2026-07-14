import { getHero } from '../content/heroes'
import { getOrigin } from '../content/origins'
import { LIFESPAN } from '../domain/realm'
import type { OwnedArt, PlayerState, TalentLoadout } from '../domain/types'
import { addAttrs } from './effects'
import { starterLoadout } from './equipment'
import { createRng } from './rng'
import { rollTalentLoadout } from './talentRoll'

export function createPlayer(opts: {
  seed: number
  heroId: string
  originId: string
  talent?: TalentLoadout
  mainArtId: string
}): PlayerState {
  const hero = getHero(opts.heroId)
  const origin = getOrigin(opts.originId)
  const rng = createRng(opts.seed)
  const talent = opts.talent ?? rollTalentLoadout(rng)

  const attrs = addAttrs(hero.baseAttrs, origin.attrDelta)

  const artIds = new Set([
    ...hero.startArtIds,
    ...(origin.startArtIds ?? []),
    opts.mainArtId,
  ])

  const arts: OwnedArt[] = [...artIds].map((id) => ({
    artId: id,
    grade: 'yellow' as const,
    skillLevel: 1,
    skillXp: 0,
    complete: true,
  }))

  const gear = starterLoadout(opts.heroId)
  const maxHp = 80 + attrs.con * 8
  const maxMana = 40 + attrs.int * 6

  return {
    seed: opts.seed,
    heroId: opts.heroId,
    originId: opts.originId,
    talent,
    realm: 'qi_refining',
    layer: 1,
    minor: 'early',
    cultivation: 0,
    year: 1,
    month: 1,
    age: origin.age,
    lifespan: LIFESPAN.qi_refining,
    hp: maxHp,
    maxHp,
    mana: maxMana,
    maxMana,
    attrs,
    daoHeart: 50 + attrs.will * 3,
    karma: 0,
    spiritStones: origin.spiritStones,
    injury: 0,
    heartDemonRisk: 0,
    pillResist: 0,
    resource: 0,
    caveLevel: 1,
    region: '青牛镇外围',
    arts,
    mainArtByRealm: { qi_refining: opts.mainArtId },
    inventory: gear.inventory,
    equipped: gear.equipped,
    flags: [],
    seenEventIds: [],
    log: [
      {
        year: 1,
        month: 1,
        text: `${hero.title} 踏入修仙之路。出身：${origin.name}。天道授纹：${talent.professionName}·${talent.core.name}。主修已定，身着简陋法器。`,
      },
    ],
    dead: false,
    won: false,
  }
}
