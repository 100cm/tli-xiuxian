import { CORE_TALENTS, NODE_TALENTS, PROFESSIONS } from '../content/talents'
import type { TalentDef, TalentLoadout } from '../domain/types'
import type { Rng } from './rng'

export function rollTalentLoadout(rng: Rng): TalentLoadout {
  // 新神 3%
  const useNewGod = rng.next() < 0.03
  const normal = PROFESSIONS.filter((p) => p.id !== 'new_god')
  const profession = useNewGod
    ? PROFESSIONS.find((p) => p.id === 'new_god')!
    : rng.pick([...normal])

  const cores = CORE_TALENTS.filter((c) => c.professionId === profession.id)
  const fallbackCores = cores.length
    ? cores
    : CORE_TALENTS.filter((c) => c.professionId !== 'new_god')

  // 70% 同神 / 25% 其它 / 5% 跨（已在池混合）— 简化：优先本神
  let core: TalentDef
  if (rng.next() < 0.7 && cores.length) {
    core = rng.pick(cores)
  } else if (rng.next() < 0.8) {
    core = rng.pick(fallbackCores)
  } else {
    core = rng.pick(CORE_TALENTS)
  }

  const nodes: TalentDef[] = []
  const used = new Set<string>([core.id])

  for (let i = 0; i < 3; i++) {
    const pool = NODE_TALENTS.filter((n) => !used.has(n.id)).map((n) => ({
      ...n,
      weight:
        (n.weight ?? 5) *
        (n.kind === 'small' ? 1.2 : n.kind === 'medium' ? 0.8 : 0.35),
    }))
    const pick = rng.weighted(pool)
    used.add(pick.id)
    nodes.push(pick)
  }

  return {
    professionId: profession.id,
    professionName: profession.name,
    core,
    nodes,
  }
}

export function collectTalentEffects(loadout: TalentLoadout) {
  return [loadout.core, ...loadout.nodes].flatMap((t) => t.effects)
}

export function hasTalentRule(loadout: TalentLoadout, ruleId: string): boolean {
  return collectTalentEffects(loadout).some((e) => e.type === 'rule' && e.id === ruleId)
}
