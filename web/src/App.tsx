import { useEffect, useState } from 'react'
import { HEROES } from './content/heroes'
import { ORIGINS } from './content/origins'
import { getArt, GRADE_NAMES, getEnabledArts } from './content/arts'
import {
  DUAL_PARTNERS,
  type DualPartnerId,
  type DualPayMode,
} from './content/dualCultivation'
import { DOLL_LAYOUT, getEquipDef, SLOT_NAME } from './content/equipment'
import { getHero } from './content/heroes'
import {
  getDualCultCostForState,
  getDualCultLifeCostForState,
} from './systems/actions'
import {
  allInOddsPreview,
  BET_PRESETS,
  type GambleBetKind,
} from './systems/gamble'
import {
  cultivationNeed,
  formatRealm,
  getCultivationTip,
} from './domain/realm'
import type { EquipSlot, TalentDef, TalentEffect, TalentLoadout } from './domain/types'
import { displayAttrs, hasChoiceFlag, withGearDefaults } from './systems/effects'
import { canPickChoice } from './systems/actions'
import { getEquippedItem, sellPriceOfItem } from './systems/equipment'
import { useGameStore } from './store/gameStore'
import './App.css'

const ATTR_CN: Record<string, string> = {
  str: '攻',
  agi: '敏',
  int: '智',
  con: '体',
  luck: '运',
  will: '志',
}

const KIND_CN: Record<TalentDef['kind'], string> = {
  core: '核心天赋',
  small: '小型灵纹',
  medium: '中型灵纹',
  legendary_medium: '传奇灵纹',
}

const RULE_CN: Record<string, string> = {
  execute_low_hp: '战斗中可对残血敌人追加斩杀检定',
  explore_faster: '探险耗时减少 1 月（至少 1 月）',
  extreme_rolls: '检定结果更极端（大成/大败更常见）',
  second_wind: '本局首次致死改为保留 1 点气血（仅一次）',
  minion_options: '解锁机关/傀儡类战斗与事件选项',
}

function formatTalentEffect(e: TalentEffect): string {
  if (e.type === 'attr' && e.key && e.value != null) {
    const n = ATTR_CN[e.key] ?? e.key
    return `${n} ${e.value > 0 ? '+' : ''}${e.value}`
  }
  if (e.type === 'cultivateMult' && e.value != null) {
    return `闭关修为效率 ${e.value > 0 ? '+' : ''}${Math.round(e.value * 100)}%`
  }
  if (e.type === 'checkBonus' && e.tags && e.value != null) {
    return `检定加成（${e.tags.join('、')}）${e.value > 0 ? '+' : ''}${e.value}`
  }
  if (e.type === 'eventWeight' && e.tags && e.mult != null) {
    return `事件权重（${e.tags.join('、')}）×${e.mult.toFixed(2)}`
  }
  if (e.type === 'combat' && e.key && e.value != null) {
    return `战斗·${e.key} +${e.value}`
  }
  if (e.type === 'rule' && e.id) {
    return RULE_CN[e.id] ?? `特殊规则：${e.id}`
  }
  return e.type
}

function TalentDetailModal({
  loadout,
  focusId,
  onClose,
}: {
  loadout: TalentLoadout
  focusId?: string
  onClose: () => void
}) {
  const items: TalentDef[] = [loadout.core, ...loadout.nodes]
  return (
    <div className="modal-mask" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-sheet panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>天赋盘</h2>
          <button type="button" className="btn btn-mini" onClick={onClose}>
            关闭
          </button>
        </div>
        <p className="muted modal-sub">
          神系：{loadout.professionName} · 开局随机锁定，本局不可更换
        </p>
        <div className="modal-body">
          {items.map((t) => (
            <div
              key={t.id}
              className={`talent-detail-card ${focusId === t.id ? 'focus' : ''}`}
            >
              <div className="talent-detail-title">
                <strong>{t.name}</strong>
                <span className="tag">{KIND_CN[t.kind]}</span>
                {t.professionName !== '通用' && (
                  <span className="tag">{t.professionName}</span>
                )}
              </div>
              <p className="talent-detail-desc">{t.description}</p>
              <ul className="talent-effect-list">
                {t.effects.map((e, i) => (
                  <li key={i}>{formatTalentEffect(e)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Toast() {
  const toast = useGameStore((s) => s.toast)
  if (!toast.length) return null
  return (
    <div className="toast">
      {toast.map((t, i) => (
        <div key={i}>{t}</div>
      ))}
    </div>
  )
}

const cardBtnStyle = {
  border: '1px solid var(--gold-dim)',
  background: 'transparent',
  color: 'inherit',
} as const

function TitleScreen() {
  const startNew = useGameStore((s) => s.startNew)
  const tryLoad = useGameStore((s) => s.tryLoad)
  return (
    <div className="title-hero panel">
      <h1>火炬修仙转</h1>
      <p className="sub">一命 · 年历 · 竖屏单机</p>
      <p className="muted title-desc">
        选英雄、天道天赋、主修功法。闭关探险斗法，炼气→筑基→结丹→元婴→化神证道。一命无轮回。
      </p>
      <div className="btn-row">
        <button type="button" className="btn btn-primary" onClick={startNew}>
          新开一局
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            if (!tryLoad()) alert('没有进行中的存档')
          }}
        >
          继续游戏
        </button>
      </div>
    </div>
  )
}

function HeroScreen() {
  const selectHero = useGameStore((s) => s.selectHero)
  return (
    <div className="screen-fill">
      <div className="section-head">
        <h2>选择英雄</h2>
        <p className="muted" style={{ margin: '2px 0 0', fontSize: '0.72rem' }}>
          火炬 wiki 全形态 · {HEROES.length} 位
        </p>
      </div>
      <div className="hero-pick-grid">
        {HEROES.map((h) => (
          <button
            type="button"
            key={h.id}
            className="hero-pick-card panel"
            onClick={() => selectHero(h.id)}
          >
            <img className="hero-pick-avatar" src={h.portrait} alt={h.title} loading="lazy" />
            <div className="hero-pick-body">
              <h3>{h.name}</h3>
              <div className="hero-pick-path">{h.pathName}</div>
              <p>
                {h.description} 攻{h.baseAttrs.str}敏{h.baseAttrs.agi}智{h.baseAttrs.int}体
                {h.baseAttrs.con}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function OriginScreen() {
  const selectOrigin = useGameStore((s) => s.selectOrigin)
  return (
    <div className="screen-fill">
      <div className="section-head">
        <h2>选择出身</h2>
      </div>
      <div className="card-grid fit-cards">
        {ORIGINS.map((o) => (
          <button type="button" key={o.id} className="card panel" onClick={() => selectOrigin(o.id)} style={cardBtnStyle}>
            <h3>
              {o.name}
              <span className="muted"> · 岁{o.age} 石{o.spiritStones}</span>
            </h3>
            <p>{o.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function TalentScreen() {
  const draft = useGameStore((s) => s.draft)
  const confirmTalent = useGameStore((s) => s.confirmTalent)
  const t = draft.talent
  if (!t) return null
  return (
    <div className="screen-fill panel panel-pad">
      <h2>天道授纹</h2>
      <p className="muted">随机锁定，不可重掷。</p>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', margin: '8px 0', fontSize: '0.82rem' }}>
        <div>
          <strong style={{ color: 'var(--gold)' }}>{t.professionName}</strong> · {t.core.name}
        </div>
        <p className="muted" style={{ margin: '4px 0' }}>
          {t.core.description}
        </p>
        <div className="muted">
          灵纹：{t.nodes.map((n) => n.name).join('、')}
        </div>
      </div>
      <button type="button" className="btn btn-primary btn-block" style={{ textAlign: 'center' }} onClick={confirmTalent}>
        承受此纹，立主修
      </button>
    </div>
  )
}

function MainArtScreen() {
  const draft = useGameStore((s) => s.draft)
  const selectMainArt = useGameStore((s) => s.selectMainArt)
  const beginPlay = useGameStore((s) => s.beginPlay)
  const hero = draft.heroId ? getHero(draft.heroId) : null
  const candidates = hero
    ? hero.startArtIds
        .map((id) => getArt(id))
        .filter(Boolean)
        .concat(
          getEnabledArts()
            .filter((a) => a.baseGrade === 'yellow' && !hero.startArtIds.includes(a.id))
            .slice(0, 4),
        )
    : []
  const seen = new Set<string>()
  const list = candidates.filter((a) => {
    if (!a || seen.has(a.id)) return false
    seen.add(a.id)
    return true
  })

  return (
    <div className="screen-fill">
      <div className="section-head">
        <h2>立炼气主修</h2>
      </div>
      <div className="card-grid fit-cards">
        {list.map((a) =>
          a ? (
            <button
              type="button"
              key={a.id}
              className={`card panel ${draft.mainArtId === a.id ? 'selected' : ''}`}
              onClick={() => selectMainArt(a.id)}
              style={cardBtnStyle}
            >
              <h3>{a.name}</h3>
              <p>{a.description}</p>
            </button>
          ) : null,
        )}
      </div>
      <button
        type="button"
        className="btn btn-primary btn-block"
        style={{ marginTop: 6, textAlign: 'center', flexShrink: 0 }}
        disabled={!draft.mainArtId}
        onClick={beginPlay}
      >
        踏入修仙界
      </button>
    </div>
  )
}

function formatEquipEffectLine(e: {
  type: string
  key?: string
  value?: number
  tags?: string[]
}): string {
  if (e.type === 'attr' && e.key && e.value != null) {
    return `${ATTR_CN[e.key] ?? e.key} ${e.value > 0 ? '+' : ''}${e.value}`
  }
  if (e.type === 'cultivateMult' && e.value != null) {
    return `闭关效率 ${e.value > 0 ? '+' : ''}${Math.round(e.value * 100)}%`
  }
  if (e.type === 'checkBonus' && e.tags && e.value != null) {
    return `检定（${e.tags.join('、')}）+${e.value}`
  }
  if (e.type === 'maxHp' && e.value != null) return `气血上限 +${e.value}`
  if (e.type === 'combat' && e.key && e.value != null) return `战斗·${e.key} +${e.value}`
  return e.type
}

function GearModal({
  slot,
  onClose,
}: {
  slot: EquipSlot | 'bag'
  onClose: () => void
}) {
  const raw = useGameStore((s) => s.player)!
  const player = withGearDefaults(raw)
  const equipFromBag = useGameStore((s) => s.equipFromBag)
  const unequip = useGameStore((s) => s.unequip)
  const sellEquip = useGameStore((s) => s.sellEquip)
  const [sellTip, setSellTip] = useState('')

  const doSell = (uid: string, name: string) => {
    const price = sellEquip(uid)
    if (price > 0) setSellTip(`已出售【${name}】，灵石 +${price}`)
  }

  if (slot === 'bag') {
    const bag = player.inventory.filter(
      (i) => !Object.values(player.equipped).includes(i.uid),
    )
    return (
      <div className="modal-mask" onClick={onClose} role="dialog" aria-modal="true">
        <div className="modal-sheet panel" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <h2>行囊 · 未装备</h2>
            <button type="button" className="btn btn-mini" onClick={onClose}>
              关闭
            </button>
          </div>
          <p className="muted modal-sub">
            多余装备可出售换灵石（回收价低于坊市）。灵石 {player.spiritStones}
            {sellTip ? ` · ${sellTip}` : ''}
          </p>
          <div className="modal-body">
            {bag.length === 0 && (
              <p className="muted">{sellTip || '行囊空空，去探险寻宝吧。'}</p>
            )}
            {bag.map((item) => {
              const def = getEquipDef(item.defId)
              if (!def) return null
              const price = sellPriceOfItem(item)
              return (
                <div key={item.uid} className="talent-detail-card">
                  <div className="talent-detail-title">
                    <strong>{def.name}</strong>
                    <span className="tag">{SLOT_NAME[def.slot]}</span>
                    <span className="tag">{GRADE_NAMES[item.grade]}阶</span>
                    <span className="tag">售 {price} 石</span>
                  </div>
                  <p className="talent-detail-desc">{def.description}</p>
                  <ul className="talent-effect-list">
                    {def.effects.map((ef, i) => (
                      <li key={i}>{formatEquipEffectLine(ef)}</li>
                    ))}
                  </ul>
                  <div className="gear-btn-row">
                    <button
                      type="button"
                      className="btn btn-mini"
                      onClick={() => equipFromBag(item.uid)}
                    >
                      装备
                    </button>
                    <button
                      type="button"
                      className="btn btn-mini btn-sell"
                      onClick={() => doSell(item.uid, def.name)}
                    >
                      出售 +{price}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const worn = getEquippedItem(player, slot)
  const wornDef = worn ? getEquipDef(worn.defId) : undefined
  const candidates = player.inventory.filter((i) => {
    const d = getEquipDef(i.defId)
    return d?.slot === slot
  })

  return (
    <div className="modal-mask" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-sheet panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{SLOT_NAME[slot]}</h2>
          <button type="button" className="btn btn-mini" onClick={onClose}>
            关闭
          </button>
        </div>
        <p className="muted modal-sub">
          灵石 {player.spiritStones}
          {sellTip ? ` · ${sellTip}` : ''}
        </p>
        <div className="modal-body">
          <div className="talent-detail-card focus">
            <div className="talent-detail-title">
              <strong>{wornDef ? wornDef.name : '（空）'}</strong>
              {worn && <span className="tag">{GRADE_NAMES[worn.grade]}阶</span>}
              {worn && <span className="tag">售 {sellPriceOfItem(worn)} 石</span>}
            </div>
            {wornDef && worn ? (
              <>
                <p className="talent-detail-desc">{wornDef.description}</p>
                <ul className="talent-effect-list">
                  {wornDef.effects.map((ef, i) => (
                    <li key={i}>{formatEquipEffectLine(ef)}</li>
                  ))}
                </ul>
                <div className="gear-btn-row">
                  <button type="button" className="btn btn-mini" onClick={() => unequip(slot)}>
                    卸下
                  </button>
                  <button
                    type="button"
                    className="btn btn-mini btn-sell"
                    onClick={() => doSell(worn.uid, wornDef.name)}
                  >
                    卸下并出售 +{sellPriceOfItem(worn)}
                  </button>
                </div>
              </>
            ) : (
              <p className="muted">该部位尚未装备。可从下方选择穿戴。</p>
            )}
          </div>
          <p className="muted" style={{ margin: '8px 0 4px' }}>
            可装备 / 可出售（{SLOT_NAME[slot]}）
          </p>
          {candidates.map((item) => {
            const def = getEquipDef(item.defId)!
            const on = player.equipped[slot] === item.uid
            const price = sellPriceOfItem(item)
            return (
              <div key={item.uid} className={`talent-detail-card ${on ? 'focus' : ''}`}>
                <div className="talent-detail-title">
                  <strong>{def.name}</strong>
                  <span className="tag">{GRADE_NAMES[item.grade]}阶</span>
                  {on && <span className="tag">穿戴中</span>}
                  <span className="tag">售 {price} 石</span>
                </div>
                <p className="talent-detail-desc">{def.description}</p>
                <ul className="talent-effect-list">
                  {def.effects.map((ef, i) => (
                    <li key={i}>{formatEquipEffectLine(ef)}</li>
                  ))}
                </ul>
                <div className="gear-btn-row">
                  {!on && (
                    <button
                      type="button"
                      className="btn btn-mini"
                      onClick={() => equipFromBag(item.uid)}
                    >
                      装备
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-mini btn-sell"
                    onClick={() => doSell(item.uid, def.name)}
                  >
                    出售 +{price}
                  </button>
                </div>
              </div>
            )
          })}
          {candidates.length === 0 && <p className="muted">没有该部位的装备。</p>}
        </div>
      </div>
    </div>
  )
}

function GearDoll({
  onSlot,
  onBag,
}: {
  onSlot: (s: EquipSlot) => void
  onBag: () => void
}) {
  const raw = useGameStore((s) => s.player)!
  const player = withGearDefaults(raw)
  const bagCount = player.inventory.filter(
    (i) => !Object.values(player.equipped).includes(i.uid),
  ).length

  return (
    <div className="gear-panel panel">
      <div className="gear-panel-head">
        <span className="play-actions-title">装备 · 八部位</span>
        <button type="button" className="btn btn-mini" onClick={onBag}>
          行囊{bagCount > 0 ? `(${bagCount})` : ''}
        </button>
      </div>
      <div className="gear-doll">
        {DOLL_LAYOUT.map((row, ri) => (
          <div className="gear-row" key={ri}>
            {row.map((slot, ci) => {
              if (!slot) {
                if (ri === 1 && ci === 1) {
                  // center body is already in layout as body
                }
                return <div className="gear-slot gear-slot-empty" key={`${ri}-${ci}`} />
              }
              const item = getEquippedItem(player, slot)
              const def = item ? getEquipDef(item.defId) : undefined
              return (
                <button
                  type="button"
                  key={slot}
                  className={`gear-slot ${item ? 'filled' : ''}`}
                  onClick={() => onSlot(slot)}
                  title={def ? `${SLOT_NAME[slot]}：${def.name}` : `${SLOT_NAME[slot]}（空）`}
                >
                  <span className="gear-slot-label">{SLOT_NAME[slot]}</span>
                  <span className="gear-slot-name">
                    {def ? def.name : '—'}
                  </span>
                  {item && (
                    <span className="gear-slot-grade">{GRADE_NAMES[item.grade]}</span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function GambleModal({ onClose }: { onClose: () => void }) {
  const player = withGearDefaults(useGameStore((s) => s.player)!)
  const performGambleBet = useGameStore((s) => s.performGambleBet)
  const performGambleAllIn = useGameStore((s) => s.performGambleAllIn)
  const [stake, setStake] = useState(() =>
    Math.min(50, Math.max(5, Math.floor(player.spiritStones / 4) || 5)),
  )
  const [allInStake, setAllInStake] = useState(() => player.spiritStones)
  const stones = player.spiritStones

  const clampBet = (n: number) => Math.max(5, Math.min(stones, Math.floor(n)))
  const clampAllIn = (n: number) => Math.max(20, Math.min(stones, Math.floor(n)))

  const doBet = (kind: GambleBetKind) => {
    const s = clampBet(stake)
    if (s > stones) return
    performGambleBet(s, kind)
    onClose()
  }

  const doAllIn = (amount: number) => {
    const s = clampAllIn(amount)
    if (s > stones || s < 20) return
    performGambleAllIn(s)
    onClose()
  }

  return (
    <div className="modal-mask" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-sheet panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>赌坊</h2>
          <button type="button" className="btn btn-mini" onClick={onClose}>
            关闭
          </button>
        </div>
        <p className="muted modal-sub">
          庄家抽水，长期必亏。灵石{' '}
          <strong style={{ color: 'var(--gold)' }}>{stones}</strong>
          。对赌 1 月 · 梭哈赌宝 2 月。
        </p>
        <div className="modal-body">
          <div className="talent-detail-card">
            <div className="talent-detail-title">
              <strong>灵石对赌</strong>
              <span className="tag">猜大小 / 气运</span>
            </div>
            <p className="talent-detail-desc">
              猜大/小约 1.85 倍返还，气运约 2.4 倍但更难中。胜率不到一半，多赌多输。
            </p>
            <div className="gamble-presets">
              {BET_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`btn btn-mini ${stake === p ? 'btn-primary' : ''}`}
                  disabled={stones < p}
                  onClick={() => setStake(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="btn btn-mini"
                disabled={stones < 5}
                onClick={() => setStake(Math.floor(stones / 2))}
              >
                半仓
              </button>
              <button
                type="button"
                className="btn btn-mini"
                disabled={stones < 5}
                onClick={() => setStake(stones)}
              >
                全押
              </button>
            </div>
            <label className="gamble-stake-label">
              注额
              <input
                type="number"
                min={5}
                max={stones}
                value={stake}
                className="gamble-input"
                onChange={(e) => setStake(Number(e.target.value) || 5)}
              />
            </label>
            <div className="dual-pay-row">
              <button
                type="button"
                className="btn btn-primary btn-mini"
                disabled={stones < 5 || stake < 5}
                onClick={() => doBet('high')}
              >
                猜大
              </button>
              <button
                type="button"
                className="btn btn-primary btn-mini"
                disabled={stones < 5 || stake < 5}
                onClick={() => doBet('low')}
              >
                猜小
              </button>
              <button
                type="button"
                className="btn btn-mini btn-life-pay"
                disabled={stones < 5 || stake < 5}
                onClick={() => doBet('lucky')}
              >
                赌气运·高赔
              </button>
            </div>
          </div>

          <div className="talent-detail-card">
            <div className="talent-detail-title">
              <strong>梭哈赌宝</strong>
              <span className="tag">押石换装</span>
            </div>
            <p className="talent-detail-desc">
              灵石砸进宝匣换随机法器。押得越多，黄/玄/神级概率越高，但空匣与凡货仍是主流——一般都是亏的。
            </p>
            <p className="muted" style={{ fontSize: '0.72rem', margin: '4px 0 8px' }}>
              {allInOddsPreview(Math.max(20, Math.min(stones, allInStake)))}
            </p>
            <div className="gamble-presets">
              <button
                type="button"
                className="btn btn-mini"
                disabled={stones < 20}
                onClick={() => setAllInStake(Math.max(20, Math.floor(stones * 0.25)))}
              >
                1/4
              </button>
              <button
                type="button"
                className="btn btn-mini"
                disabled={stones < 20}
                onClick={() => setAllInStake(Math.max(20, Math.floor(stones * 0.5)))}
              >
                半梭
              </button>
              <button
                type="button"
                className="btn btn-mini"
                disabled={stones < 20}
                onClick={() => setAllInStake(stones)}
              >
                全梭
              </button>
            </div>
            <label className="gamble-stake-label">
              梭哈额
              <input
                type="number"
                min={20}
                max={stones}
                value={allInStake}
                className="gamble-input"
                onChange={(e) => setAllInStake(Number(e.target.value) || 20)}
              />
            </label>
            <div className="dual-pay-row">
              <button
                type="button"
                className="btn btn-primary btn-mini"
                disabled={stones < 20}
                onClick={() => doAllIn(allInStake)}
              >
                开匣·押 {Math.min(stones, Math.max(20, allInStake))} 石
              </button>
              <button
                type="button"
                className="btn btn-mini btn-life-pay"
                disabled={stones < 20}
                onClick={() => doAllIn(stones)}
              >
                梭哈全部 {stones} 石
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DualCultModal({ onClose }: { onClose: () => void }) {
  const player = withGearDefaults(useGameStore((s) => s.player)!)
  const performDualCult = useGameStore((s) => s.performDualCult)
  const remainLife = Math.max(0, player.lifespan - player.age)

  const run = (id: DualPartnerId, mode: DualPayMode) => {
    performDualCult(id, mode)
    onClose()
  }

  return (
    <div className="modal-mask" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-sheet panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>双修 · 择天尊</h2>
          <button type="button" className="btn btn-mini" onClick={onClose}>
            关闭
          </button>
        </div>
        <p className="muted modal-sub">
          耗时 3 月 · 可付灵石或折寿 · 疗伤回血 · 修为与功法精进。当前灵石{' '}
          <strong style={{ color: 'var(--gold)' }}>{player.spiritStones}</strong>
          ，余寿约 <strong style={{ color: 'var(--gold)' }}>{remainLife.toFixed(1)}</strong> 年
          （上限 {player.lifespan} / 虚岁 {player.age.toFixed(1)}）
        </p>
        <div className="modal-body">
          {DUAL_PARTNERS.map((p) => {
            const stoneCost = getDualCultCostForState(player, p.id)
            const lifeCost = getDualCultLifeCostForState(player, p.id)
            const canStone = player.spiritStones >= stoneCost
            // 三月后还要活着，并至少留半年余量
            const canLife = player.lifespan - (player.age + 3 / 12) >= lifeCost + 0.5
            const canAny = canStone || canLife
            const short = p.name.replace('天尊', '')
            return (
              <div key={p.id} className={`talent-detail-card ${canAny ? '' : 'dim'}`}>
                <div className="talent-detail-title">
                  <strong>{p.name}</strong>
                  <span className="tag">{p.gradeName}</span>
                  <span className="tag">{p.style}</span>
                </div>
                <p className="talent-detail-desc">{p.title}</p>
                <p className="talent-detail-desc">{p.blurb}</p>
                <ul className="talent-effect-list">
                  <li>灵石代价：{stoneCost}</li>
                  <li>折寿代价：{lifeCost} 年（永久缩短寿元上限）</li>
                  <li>修为收益：约 ×{p.cultMult.toFixed(2)}（折寿略高）</li>
                  <li>功法熟练：约 ×{p.artXpMult.toFixed(2)}</li>
                  <li>
                    疗伤：回血约 {Math.round(p.healHpPct * 100)}% 上限，伤势 -{p.healInjury}
                  </li>
                </ul>
                <div className="dual-pay-row">
                  <button
                    type="button"
                    className="btn btn-primary btn-mini"
                    disabled={!canStone}
                    onClick={() => run(p.id as DualPartnerId, 'stones')}
                  >
                    {canStone ? `灵石·与${short}` : '灵石不足'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-mini btn-life-pay"
                    disabled={!canLife}
                    title="以寿元上限换取双修，不可逆"
                    onClick={() => run(p.id as DualPartnerId, 'lifespan')}
                  >
                    {canLife ? `折寿${lifeCost}年·与${short}` : '寿元不足'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PlayScreen() {
  const player = withGearDefaults(useGameStore((s) => s.player)!)
  const doAction = useGameStore((s) => s.doAction)
  const setScreen = useGameStore((s) => s.setScreen)
  const actions = useGameStore((s) => s.getActionList)()
  const [talentOpen, setTalentOpen] = useState(false)
  const [talentFocus, setTalentFocus] = useState<string | undefined>()
  const [gearSlot, setGearSlot] = useState<EquipSlot | 'bag' | null>(null)
  const [dualOpen, setDualOpen] = useState(false)
  const [gambleOpen, setGambleOpen] = useState(false)
  const [attrOpen, setAttrOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [statusFocus, setStatusFocus] = useState<string | undefined>()
  const hero = getHero(player.heroId)
  const openStatus = (focus?: string) => {
    setStatusFocus(focus)
    setStatusOpen(true)
  }
  const attrs = displayAttrs(player)
  const need = cultivationNeed(player.realm, player.layer, player.minor)
  const pct = Math.min(100, Math.round((player.cultivation / need) * 100))
  const mainId = player.mainArtByRealm[player.realm]
  const mainArt = mainId ? getArt(mainId) : undefined
  const ownedMain = player.arts.find((a) => a.artId === mainId)
  const tip = getCultivationTip(
    player.realm,
    player.layer,
    player.minor,
    player.cultivation,
    player.flags,
  )
  const tipClass =
    tip.kind === 'ready'
      ? 'tip tip-ready'
      : tip.kind === 'blocked'
        ? 'tip tip-blocked'
        : tip.kind === 'auto'
          ? 'tip tip-auto'
          : 'tip tip-progress'

  const tipText = `${tip.title}：${tip.detail}`
  const mainLine = mainArt
    ? `${mainArt.name}·${ownedMain ? GRADE_NAMES[ownedMain.grade] : '?'}Lv${ownedMain?.skillLevel ?? 1}`
    : '无主修'

  const openTalent = (id?: string) => {
    setTalentFocus(id)
    setTalentOpen(true)
  }

  return (
    <div className="play-layout">
      <header className="play-head panel">
        <div className="play-head-top">
          <button
            type="button"
            className="play-avatar-btn"
            onClick={() => openStatus('hero')}
            title="点击查看人物与状态说明"
          >
            <img className="play-avatar" src={hero.portrait} alt={hero.name} />
          </button>
          <div className="play-head-main">
            <div className="play-head-row">
              <button type="button" className="play-name-btn" onClick={() => openStatus('hero')}>
                <span className="play-name">{hero.name}</span>
                <span className="play-path">{hero.pathName}</span>
              </button>
              <button type="button" className="stat-chip" onClick={() => openStatus('realm')}>
                {formatRealm(player.realm, player.layer, player.minor)}
              </button>
              <span className="play-meta">
                {player.year}年{player.month}月
              </span>
            </div>
            <div className="play-head-row play-head-sub">
              <button type="button" className="stat-chip" onClick={() => openStatus('life')}>
                寿{player.age.toFixed(0)}/{player.lifespan}
              </button>
              <button type="button" className="stat-chip" onClick={() => openStatus('stones')}>
                石{player.spiritStones}
              </button>
              <button type="button" className="stat-chip" onClick={() => openStatus('heart')}>
                心{player.daoHeart}
              </button>
              <button type="button" className="stat-chip" onClick={() => openStatus('karma')}>
                孽{player.karma}
              </button>
              {player.flags.includes('foundation_pill') && (
                <button type="button" className="stat-chip flag-ok" onClick={() => openStatus('flags')}>
                  筑基丹
                </button>
              )}
              {player.flags.includes('core_materials') && (
                <button type="button" className="stat-chip flag-ok" onClick={() => openStatus('flags')}>
                  结丹材
                </button>
              )}
              {player.flags.includes('nascent_item') && (
                <button type="button" className="stat-chip flag-ok" onClick={() => openStatus('flags')}>
                  婴变物
                </button>
              )}
              {player.flags.includes('soul_item') && (
                <button type="button" className="stat-chip flag-ok" onClick={() => openStatus('flags')}>
                  化神念
                </button>
              )}
              {player.injury > 0 && (
                <button type="button" className="stat-chip flag-bad" onClick={() => openStatus('injury')}>
                  伤{player.injury}
                </button>
              )}
              <button type="button" className="stat-chip stat-chip-hint" onClick={() => openStatus()}>
                说明
              </button>
            </div>
          </div>
        </div>
        <button type="button" className="status-row tight status-row-btn" onClick={() => openStatus('cult')}>
          <span className="status-label">修</span>
          <div className="bar">
            <i style={{ width: `${pct}%` }} />
          </div>
          <span className="status-num">
            {player.cultivation}/{need}
          </span>
        </button>
        <button type="button" className="status-row tight status-row-btn" onClick={() => openStatus('hp')}>
          <span className="status-label">血</span>
          <div className="bar hp">
            <i style={{ width: `${(player.hp / player.maxHp) * 100}%` }} />
          </div>
          <span className="status-num">
            {player.hp}/{player.maxHp}
          </span>
        </button>
        <button
          type="button"
          className="play-subline play-subline-btn"
          onClick={() => setAttrOpen(true)}
          title="点击查看属性说明"
        >
          主修 {mainLine} · 攻{attrs.str} 敏{attrs.agi} 智{attrs.int} 体{attrs.con} 运
          {attrs.luck} 志{attrs.will}
          <span className="subline-hint">· 点此说明</span>
        </button>
      </header>

      {/* 天赋条：可点击看详情 */}
      <div className="talent-strip panel">
        <button type="button" className="talent-chip talent-chip-god" onClick={() => openTalent()}>
          <span className="chip-k">神系</span>
          <span className="chip-v">{player.talent.professionName}</span>
        </button>
        <button
          type="button"
          className="talent-chip talent-chip-core"
          onClick={() => openTalent(player.talent.core.id)}
        >
          <span className="chip-k">核心</span>
          <span className="chip-v">{player.talent.core.name}</span>
        </button>
        {player.talent.nodes.map((n) => (
          <button
            type="button"
            key={n.id}
            className="talent-chip"
            onClick={() => openTalent(n.id)}
            title={n.description}
          >
            <span className="chip-k">纹</span>
            <span className="chip-v">{n.name.replace(/^小型天赋·|^中型天赋·|^传奇中型·/, '')}</span>
          </button>
        ))}
      </div>

      <div className={`${tipClass} tip-compact`} role="status" title={tipText}>
        {tipText}
      </div>

      <Toast />

      <GearDoll onSlot={(s) => setGearSlot(s)} onBag={() => setGearSlot('bag')} />

      <section className="play-actions">
        <div className="play-actions-bar">
          <span className="play-actions-title">行动</span>
          <div className="play-actions-nav">
            <button type="button" className="btn btn-mini" onClick={() => setScreen('arts')}>
              功法
            </button>
            <button type="button" className="btn btn-mini" onClick={() => setScreen('log')}>
              日志
            </button>
          </div>
        </div>
        <div className="grid-actions">
          {actions.map((a) => (
            <button
              type="button"
              key={a.id}
              className={`btn btn-action ${a.id === 'breakthrough' && !a.disabled ? 'btn-ready' : ''} ${a.id === 'dual_cult' ? 'btn-dual' : ''} ${a.id === 'gamble' ? 'btn-gamble' : ''}`}
              disabled={a.disabled}
              title={a.disabled ? a.reason : a.hint}
              onClick={() => {
                if (a.id === 'dual_cult') {
                  setDualOpen(true)
                  return
                }
                if (a.id === 'gamble') {
                  setGambleOpen(true)
                  return
                }
                doAction(a.id)
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </section>

      {talentOpen && (
        <TalentDetailModal
          loadout={player.talent}
          focusId={talentFocus}
          onClose={() => setTalentOpen(false)}
        />
      )}
      {gearSlot && <GearModal slot={gearSlot} onClose={() => setGearSlot(null)} />}
      {dualOpen && <DualCultModal onClose={() => setDualOpen(false)} />}
      {gambleOpen && <GambleModal onClose={() => setGambleOpen(false)} />}
      {attrOpen && (
        <AttrHelpModal attrs={attrs} base={player.attrs} onClose={() => setAttrOpen(false)} />
      )}
      {statusOpen && (
        <StatusHelpModal
          player={player}
          focusId={statusFocus}
          onClose={() => setStatusOpen(false)}
          onOpenAttrs={() => {
            setStatusOpen(false)
            setAttrOpen(true)
          }}
        />
      )}
    </div>
  )
}

function StatusHelpModal({
  player,
  focusId,
  onClose,
  onOpenAttrs,
}: {
  player: ReturnType<typeof withGearDefaults>
  focusId?: string
  onClose: () => void
  onOpenAttrs: () => void
}) {
  useEffect(() => {
    if (!focusId) return
    const el = document.getElementById(`status-card-${focusId}`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [focusId])

  const hero = getHero(player.heroId)
  const need = cultivationNeed(player.realm, player.layer, player.minor)
  const tip = getCultivationTip(
    player.realm,
    player.layer,
    player.minor,
    player.cultivation,
    player.flags,
  )
  const flagItems: { id: string; name: string; has: boolean; detail: string }[] = [
    {
      id: 'foundation_pill',
      name: '筑基丹',
      has: player.flags.includes('foundation_pill'),
      detail: '炼气十三层圆满后突破筑基的必需品。可从坊市、探险、机缘获得。',
    },
    {
      id: 'core_materials',
      name: '结丹材',
      has: player.flags.includes('core_materials'),
      detail: '筑基圆满后结成金丹所需材料（辅材/主材抽象为一类标记）。',
    },
    {
      id: 'nascent_item',
      name: '婴变物',
      has: player.flags.includes('nascent_item'),
      detail: '结丹圆满后孕育元婴所需的关键异宝或机缘标记。',
    },
    {
      id: 'soul_item',
      name: '化神念',
      has: player.flags.includes('soul_item'),
      detail: '元婴圆满后渡劫化神、证道所需的神念/天材地宝标记。',
    },
  ]

  const cards: {
    id: string
    title: string
    value: string
    tag?: string
    detail: string
    extra?: string[]
  }[] = [
    {
      id: 'hero',
      title: `${hero.name} · ${hero.pathName}`,
      value: hero.resourceName,
      tag: '英雄形态',
      detail: hero.description,
      extra: [
        `专属资源：${hero.resourceName}（上限 ${hero.resourceMax}，当前 ${player.resource}）`,
        `标签：${hero.tags.join('、') || '无'}`,
        '头像、名称均可点开本说明。形态决定起手功法倾向与部分专属事件。',
      ],
    },
    {
      id: 'realm',
      title: '境界',
      value: formatRealm(player.realm, player.layer, player.minor),
      tag: '修真阶位',
      detail:
        '炼气 → 筑基 → 结丹 → 元婴 → 化神。炼气按层数，其后分初期/中期/后期/圆满。圆满且修为满、材料齐后方可突破。化神证道即通关。',
      extra: [`当前：${tip.title} — ${tip.detail}`],
    },
    {
      id: 'life',
      title: '寿元',
      value: `${player.age.toFixed(0)} / ${player.lifespan}`,
      tag: '虚岁 / 上限',
      detail:
        '年龄随年月增长；寿元上限随大境界提升。虚岁达到寿元上限会寿终身死（一命硬核，无轮回）。疗伤、突破、部分天劫也可能折寿。',
      extra: [`历法：第 ${player.year} 年 ${player.month} 月`],
    },
    {
      id: 'stones',
      title: '灵石（石）',
      value: String(player.spiritStones),
      tag: '货币',
      detail:
        '修真界通货。用于坊市购买丹药/装备/材料、双修、部分事件选项与机缘。探险、PK、出售多余装备、出身初始均可获得。',
      extra: ['坊市价高；卖装回收价低于坊市。灵石不足时相关行动会锁定。'],
    },
    {
      id: 'heart',
      title: '道心（心）',
      value: String(player.daoHeart),
      tag: '精神底线',
      detail:
        '道心归零会心魔入体、身死道消。突破失败、邪功、心魔事件会掉道心；稳心、疗伤、部分正道选项可回升。',
      extra: [
        `心魔风险：${player.heartDemonRisk}（苦修/闭关积攒，影响走火与效率）`,
        '志（六维）越高，突破与抗心魔越稳。',
      ],
    },
    {
      id: 'karma',
      title: '杀孽（孽）',
      value: String(player.karma),
      tag: '因果',
      detail:
        '杀戮、魔功、黑市等会抬高杀孽；善举、散功赎罪等可降低。影响魔道/正道向事件出现与天劫体感难度。',
      extra: ['高孽更容易卷入血斗与天罚类机缘，收益风险并存。'],
    },
    {
      id: 'injury',
      title: '伤势（伤）',
      value: String(player.injury),
      tag: player.injury > 0 ? '需疗伤' : '健康',
      detail:
        '战斗、天劫、失败选项会造成伤势。伤势降低闭关/苦修/专修/双修的修为效率，并拖累突破成功率。疗伤行动与部分丹药可削减。',
      extra: player.injury > 0 ? ['顶栏出现红色「伤」标记时务必优先处理。'] : ['当前无伤，效率满额。'],
    },
    {
      id: 'cult',
      title: '修为（修）',
      value: `${player.cultivation} / ${need}`,
      tag: '本境进度',
      detail:
        '闭关、苦修、专修、双修、部分事件可增长修为。条满后小境自动推进；大境圆满需材料 +「突破」行动。',
      extra: [tip.detail],
    },
    {
      id: 'hp',
      title: '气血（血）',
      value: `${player.hp} / ${player.maxHp}`,
      tag: '生命',
      detail:
        '战斗、危险选项、天劫会掉血；归零则身死。疗伤、双修、丹药、部分选项回血。体魄影响气血上限。',
      extra: [`法力 ${player.mana}/${player.maxMana}（术法向预留资源）`],
    },
    {
      id: 'flags',
      title: '突破材料',
      value: flagItems.filter((f) => f.has).map((f) => f.name).join('、') || '暂无',
      tag: '大境门槛',
      detail: '各大境突破除修为圆满外，还需对应材料标记。顶栏绿色标签即已入手。',
      extra: flagItems.map((f) => `${f.has ? '✓' : '○'} ${f.name}：${f.detail}`),
    },
  ]

  return (
    <div className="modal-mask" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-sheet panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>人物与状态</h2>
          <button type="button" className="btn btn-mini" onClick={onClose}>
            关闭
          </button>
        </div>
        <div className="status-help-hero">
          <img src={hero.portrait} alt={hero.name} className="status-help-avatar" />
          <div>
            <strong style={{ color: 'var(--gold-bright)' }}>{hero.title}</strong>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: '0.75rem' }}>
              点顶栏头像 / 寿石心孽 / 修血条均可打开本说明
            </p>
          </div>
        </div>
        <div className="modal-body">
          {cards.map((c) => (
            <div
              key={c.id}
              className={`talent-detail-card${focusId === c.id ? ' status-card-focus' : ''}`}
              id={`status-card-${c.id}`}
            >
              <div className="talent-detail-title">
                <strong>
                  {c.title}
                  {c.value ? ` · ${c.value}` : ''}
                </strong>
                {c.tag && <span className="tag">{c.tag}</span>}
              </div>
              <p className="talent-detail-desc">{c.detail}</p>
              {c.extra && c.extra.length > 0 && (
                <ul className="talent-effect-list">
                  {c.extra.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-block" style={{ textAlign: 'center' }} onClick={onOpenAttrs}>
            查看六维属性说明（攻敏智体运志）
          </button>
        </div>
      </div>
    </div>
  )
}

function AttrHelpModal({
  attrs,
  base,
  onClose,
}: {
  attrs: { str: number; agi: number; int: number; con: number; luck: number; will: number }
  base: { str: number; agi: number; int: number; con: number; luck: number; will: number }
  onClose: () => void
}) {
  const rows: {
    key: keyof typeof attrs
    name: string
    use: string
    detail: string
  }[] = [
    {
      key: 'str',
      name: '攻',
      use: '力量 / 杀伐',
      detail:
        '影响近战、斗法、破阵类选项与战斗检定。越高越容易在「交手 / 强突」中占优。',
    },
    {
      key: 'agi',
      name: '敏',
      use: '身法 / 先手',
      detail:
        '影响逃跑、潜行、探险躲避与远程倾向检定。越高越容易脱身、猎杀、闪避危险选项。',
    },
    {
      key: 'int',
      name: '智',
      use: '神识 / 术法',
      detail:
        '影响神识探查、阵法、论道、法术类选项门槛与成功率。越高越容易通过「智检定」事件。',
    },
    {
      key: 'con',
      name: '体',
      use: '气血 / 硬抗',
      detail:
        '影响气血底子、硬抗天劫与防御类检定；疗伤回血也会吃到体魄加成。越高越耐打、越扛劫。',
    },
    {
      key: 'luck',
      name: '运',
      use: '气运 / 奇遇',
      detail:
        '影响交易辨伪、开箱奇遇、部分随机检定与突破时的运气修正。越高越容易「踩狗屎运」。',
    },
    {
      key: 'will',
      name: '志',
      use: '道心 / 突破',
      detail:
        '影响抗心魔、稳道心，以及筑基/结丹/元婴/化神等突破、证道成功率。越高越扛心劫。',
    },
  ]

  return (
    <div className="modal-mask" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-sheet panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>六维属性说明</h2>
          <button type="button" className="btn btn-mini" onClick={onClose}>
            关闭
          </button>
        </div>
        <p className="muted modal-sub">
          面板数值 = 出身/英雄基础 + 天赋 + 主修功法 + 装备等。点数值区域可随时查看。
        </p>
        <div className="modal-body">
          {rows.map((r) => {
            const total = attrs[r.key]
            const b = base[r.key]
            const bonus = total - b
            return (
              <div key={r.key} className="talent-detail-card">
                <div className="talent-detail-title">
                  <strong>
                    {r.name} · {total}
                  </strong>
                  <span className="tag">{r.use}</span>
                  <span className="tag">
                    基础{b}
                    {bonus !== 0 ? ` ${bonus > 0 ? '+' : ''}${bonus}加成` : ''}
                  </span>
                </div>
                <p className="talent-detail-desc">{r.detail}</p>
              </div>
            )
          })}
          <div className="talent-detail-card">
            <div className="talent-detail-title">
              <strong>顶栏状态</strong>
            </div>
            <p className="talent-detail-desc">
              寿 / 石 / 心 / 孽 / 伤 / 修 / 血 的完整说明：关闭后点头像或对应数值查看。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function EventScreen() {
  const player = useGameStore((s) => s.player)!
  const event = useGameStore((s) => s.activeEvent)!
  const prelude = useGameStore((s) => s.eventPrelude)
  const pickChoice = useGameStore((s) => s.pickChoice)

  return (
    <div className="panel event-screen">
      {prelude.length > 0 && (
        <div className="prelude-box" title={prelude.join(' ')}>
          {prelude.slice(0, 2).join(' · ')}
        </div>
      )}
      <h2 style={{ flexShrink: 0 }}>{event.title}</h2>
      <div className="event-body">{event.body}</div>
      <div className="choice-list">
        {event.choices.map((c) => {
          const ok = canPickChoice(player, c)
          let lock = ''
          if (!ok) {
            if (c.requireHero) lock = '英雄不符'
            else if (c.requireFlag && !hasChoiceFlag(player, c.requireFlag)) lock = '需功法'
            else if (c.requireAttr) lock = `需${c.requireAttr.key}`
            else if (c.costStones) lock = '灵石不足'
          }
          return (
            <button
              type="button"
              key={c.id}
              className="btn"
              disabled={!ok}
              title={[c.hint, lock, c.costStones ? `灵石${c.costStones}` : ''].filter(Boolean).join(' · ')}
              onClick={() => pickChoice(c.id)}
            >
              {c.text}
              {(c.hint || lock) && <span className="hint">{lock || c.hint}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ResultScreen() {
  const result = useGameStore((s) => s.pendingResult)
  const acknowledgeResult = useGameStore((s) => s.acknowledgeResult)
  if (!result) {
    return (
      <div className="panel result-panel">
        <p>无结果</p>
        <button type="button" className="btn btn-primary" onClick={acknowledgeResult}>
          返回
        </button>
      </div>
    )
  }
  const btnLabel =
    result.next === 'ending' ? '查看终局' : result.next === 'arts' ? '去选主修' : '确认'

  return (
    <div className="panel result-panel">
      <h2>{result.title}</h2>
      <ul className="result-lines">
        {result.lines.slice(0, 8).map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
      <button type="button" className="btn btn-primary" onClick={acknowledgeResult}>
        {btnLabel}
      </button>
    </div>
  )
}

function ArtsScreen() {
  const player = useGameStore((s) => s.player)!
  const changeMainFromPlay = useGameStore((s) => s.changeMainFromPlay)
  const setScreen = useGameStore((s) => s.setScreen)
  const needPick = player.flags.includes('need_main_art')

  return (
    <div className="screen-fill">
      <div className="section-head">
        <h2>功法{needPick ? ' · 选主修' : ''}</h2>
      </div>
      <div className="card-grid fit-cards">
        {player.arts.map((o) => {
          const def = getArt(o.artId)
          if (!def) return null
          const isMain = player.mainArtByRealm[player.realm] === o.artId
          return (
            <button
              type="button"
              key={o.artId}
              className={`card panel ${isMain ? 'selected' : ''}`}
              disabled={!o.complete}
              onClick={() => o.complete && changeMainFromPlay(o.artId)}
              style={cardBtnStyle}
            >
              <h3>
                {def.name}
                {isMain ? ' ·主' : ''} · {GRADE_NAMES[o.grade]}Lv{o.skillLevel}
                {!o.complete ? '残' : ''}
              </h3>
              <p>{def.description}</p>
            </button>
          )
        })}
      </div>
      {!needPick && (
        <button
          type="button"
          className="btn btn-block"
          style={{ marginTop: 6, textAlign: 'center', flexShrink: 0 }}
          onClick={() => setScreen('play')}
        >
          返回
        </button>
      )}
    </div>
  )
}

function LogScreen() {
  const player = useGameStore((s) => s.player)!
  const setScreen = useGameStore((s) => s.setScreen)
  return (
    <div className="panel log-screen">
      <h2 style={{ flexShrink: 0 }}>日志</h2>
      <div className="log-list">
        {player.log.slice(0, 12).map((l, i) => (
          <div key={i} title={l.text}>
            [{l.year}.{l.month}] {l.text}
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-block"
        style={{ marginTop: 6, textAlign: 'center', flexShrink: 0 }}
        onClick={() => setScreen('play')}
      >
        返回
      </button>
    </div>
  )
}

function EndingScreen() {
  const player = useGameStore((s) => s.player)!
  const clearSaveAndTitle = useGameStore((s) => s.clearSaveAndTitle)
  const hero = getHero(player.heroId)
  return (
    <div className="panel title-hero">
      <img className="ending-avatar" src={hero.portrait} alt={hero.name} />
      <h1>{player.won ? '道成' : '身死'}</h1>
      <p
        className="title-desc"
        style={{ color: player.won ? 'var(--ok)' : 'var(--danger-bright)', WebkitLineClamp: 5 }}
      >
        {player.endingText}
      </p>
      <p className="muted">
        {hero.name} · {hero.pathName} · {formatRealm(player.realm, player.layer, player.minor)}
      </p>
      <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} onClick={clearSaveAndTitle}>
        回到标题
      </button>
    </div>
  )
}

export default function App() {
  const screen = useGameStore((s) => s.screen)
  const tryLoad = useGameStore((s) => s.tryLoad)

  useEffect(() => {
    // 标题页不自动加载，用户点继续
    void tryLoad
  }, [tryLoad])

  return (
    <div className="app-shell">
      {screen === 'title' && <TitleScreen />}
      {screen === 'hero' && <HeroScreen />}
      {screen === 'origin' && <OriginScreen />}
      {screen === 'talent' && <TalentScreen />}
      {screen === 'main_art' && <MainArtScreen />}
      {screen === 'play' && <PlayScreen />}
      {screen === 'event' && <EventScreen />}
      {screen === 'result' && <ResultScreen />}
      {screen === 'arts' && <ArtsScreen />}
      {screen === 'log' && <LogScreen />}
      {screen === 'ending' && <EndingScreen />}
    </div>
  )
}
