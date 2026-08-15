import { useMemo, useState } from 'react'
import {
  estimatePlayerType,
  getCurrentPositioningValues,
  getTypeReferenceValues,
  playerTypes,
  positioningKeys,
  type PlayerType,
  type PositioningKey,
} from '../typeEstimation'
import type { SpecialMenu } from '../types'

const numericMetricKeys = [
  'kick',
  'speed',
  'stamina',
  'technique',
  'physical',
  'jump',
  'mental',
  'total',
  'fatigue',
  'offenseQuality',
  'support',
  'triangle',
  'loseMark',
  'overlap',
  'diagonalRun',
  'spaceRun',
  'goalFront',
  'defenseQuality',
  'zoneMarking',
  'manMarking',
  'pressing',
  'shootCut',
  'intercept',
] as const

type NumericMetricKey = (typeof numericMetricKeys)[number]
type Metric = { key: NumericMetricKey; label: string }
type SortDirection = 'desc' | 'asc'

const basicMetrics: Metric[] = [
  { key: 'kick', label: 'キック' },
  { key: 'speed', label: 'スピード' },
  { key: 'stamina', label: 'スタミナ' },
  { key: 'technique', label: 'テクニック' },
  { key: 'physical', label: 'フィジカル' },
  { key: 'jump', label: 'ジャンプ' },
  { key: 'mental', label: 'メンタル' },
]

const hiddenMetricGroups: Array<{ label: string; metrics: Metric[] }> = [
  {
    label: '攻撃系裏パラメータ',
    metrics: [
      { key: 'offenseQuality', label: 'オフェンスクオリティ' },
      { key: 'support', label: 'サポート' },
      { key: 'triangle', label: 'トライアングル' },
      { key: 'loseMark', label: 'マークを外す' },
      { key: 'overlap', label: 'オーバーラップ' },
      { key: 'diagonalRun', label: 'ダイアゴナルラン' },
      { key: 'spaceRun', label: 'スペースに走り込む' },
      { key: 'goalFront', label: 'ゴール前待機' },
    ],
  },
  {
    label: '守備系裏パラメータ',
    metrics: [
      { key: 'defenseQuality', label: 'ディフェンスクオリティ' },
      { key: 'zoneMarking', label: 'ゾーンマーキング' },
      { key: 'manMarking', label: 'マンツーマン' },
      { key: 'pressing', label: 'プレッシング' },
      { key: 'shootCut', label: 'シュートカット' },
      { key: 'intercept', label: 'インターセプト' },
    ],
  },
]

const sortMetricGroups: Array<{ label: string; metrics: Metric[] }> = [
  {
    label: '基本パラメータ',
    metrics: [
      { key: 'total', label: '基本合計' },
      ...basicMetrics,
      { key: 'fatigue', label: '疲労蓄積値' },
    ],
  },
  ...hiddenMetricGroups,
]

const positioningLabels: Record<PositioningKey, string> = {
  zoneMarking: 'ゾーンマーキング',
  manMarking: 'マンツーマン',
  pressing: 'プレッシング',
  shootCut: 'シュートカット',
  intercept: 'インターセプト',
  support: 'サポート',
  triangle: 'トライアングル',
  loseMark: 'マークを外す',
  overlap: 'オーバーラップ',
  diagonalRun: 'ダイアゴナルラン',
  spaceRun: 'スペースに走り込む',
  goalFront: 'ゴール前待機',
}

type Selection = { name: string; count: number }
type SelectedMenu = { menu: SpecialMenu; count: number }

function createEmptyTotals() {
  return Object.fromEntries(
    numericMetricKeys.map((key) => [key, 0]),
  ) as Record<NumericMetricKey, number>
}

function valueTone(value: number) {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'zero'
}

function formatGain(value: number) {
  return value > 0 ? `+${value}` : String(value)
}

function isPositioningKey(key: NumericMetricKey): key is PositioningKey {
  return positioningKeys.includes(key as PositioningKey)
}

type TrainingSimulationProps = {
  menus: SpecialMenu[]
}

export function TrainingSimulation({ menus }: TrainingSimulationProps) {
  const [query, setQuery] = useState('')
  const [selectedCards, setSelectedCards] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<NumericMetricKey>('total')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selections, setSelections] = useState<Selection[]>([])
  const [currentType, setCurrentType] = useState<PlayerType>('バランス')

  const cardOptions = useMemo(
    () =>
      Array.from(new Set(menus.flatMap((menu) => menu.cards))).sort((a, b) =>
        a.localeCompare(b, 'ja'),
      ),
    [menus],
  )

  const filteredMenus = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ja')

    return menus
      .filter(
        (menu) =>
          (!normalizedQuery ||
            menu.name.toLocaleLowerCase('ja').includes(normalizedQuery)) &&
          selectedCards.every((card) => menu.cards.includes(card)),
      )
      .sort((first, second) => {
        const difference = first[sortKey] - second[sortKey]

        return (
          (sortDirection === 'asc' ? difference : -difference) ||
          first.name.localeCompare(second.name, 'ja')
        )
      })
  }, [menus, query, selectedCards, sortDirection, sortKey])

  const sortLabel = sortMetricGroups
    .flatMap((group) => group.metrics)
    .find((metric) => metric.key === sortKey)?.label

  const selectedMenus = useMemo(
    () =>
      selections
        .map((selection) => {
          const menu = menus.find((item) => item.name === selection.name)
          return menu ? { menu, count: selection.count } : null
        })
        .filter((item): item is SelectedMenu => item !== null),
    [menus, selections],
  )

  const totals = useMemo(() => {
    const nextTotals = createEmptyTotals()

    selectedMenus.forEach(({ menu, count }) => {
      numericMetricKeys.forEach((key) => {
        nextTotals[key] += menu[key] * count
      })
    })

    return nextTotals
  }, [selectedMenus])

  const totalTrainings = selections.reduce(
    (sum, selection) => sum + selection.count,
    0,
  )
  const hiddenTotal = hiddenMetricGroups.reduce(
    (sum, group) =>
      sum +
      group.metrics.reduce(
        (groupSum, metric) => groupSum + totals[metric.key],
        0,
      ),
    0,
  )
  const positioningGains = Object.fromEntries(
    positioningKeys.map((key) => [key, totals[key]]),
  ) as Record<PositioningKey, number>
  const estimatedType = estimatePlayerType(
    currentType,
    positioningGains,
    totalTrainings > 0,
  )
  const currentPositioningValues = getCurrentPositioningValues(currentType)

  const addCardFilter = (card: string) => {
    if (card && !selectedCards.includes(card)) {
      setSelectedCards((current) => [...current, card])
    }
  }

  const addTraining = (name: string) => {
    setSelections((current) => {
      const existing = current.find((selection) => selection.name === name)

      return existing
        ? current.map((selection) =>
            selection.name === name
              ? { ...selection, count: selection.count + 1 }
              : selection,
          )
        : [...current, { name, count: 1 }]
    })
  }

  const changeTrainingCount = (name: string, difference: number) => {
    setSelections((current) =>
      current.flatMap((selection) => {
        if (selection.name !== name) return [selection]

        const nextCount = selection.count + difference
        return nextCount > 0 ? [{ ...selection, count: nextCount }] : []
      }),
    )
  }

  const removeTraining = (name: string) => {
    setSelections((current) =>
      current.filter((selection) => selection.name !== name),
    )
  }

  return (
    <section className="simulation-page" aria-labelledby="simulation-heading">
      <div className="section-heading simulation-heading">
        <div>
          <h2 id="simulation-heading">特訓シミュレーション</h2>
          <p className="section-description">
            選択した特訓の能力変化を合算し、特訓後の選手タイプを推定します。
          </p>
        </div>
      </div>

      <div className="simulation-type-bar">
        <label className="field simulation-type-field">
          <span>現在のタイプ</span>
          <select
            value={currentType}
            onChange={(event) => setCurrentType(event.target.value as PlayerType)}
          >
            {playerTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <span className="type-transition" aria-hidden="true">
          →
        </span>

        <div className="estimated-type" aria-live="polite">
          <span>特訓後タイプ（推定）</span>
          <strong>{estimatedType}</strong>
        </div>

        <div className="simulation-session-count">
          <strong>{totalTrainings}</strong>
          <span>回の特訓</span>
        </div>
      </div>

      <details className="type-reference">
        <summary>タイプ変更表</summary>
        <div className="type-reference-table-shell">
          <table className="type-reference-table">
            <thead>
              <tr>
                <th scope="col">タイプ</th>
                {positioningKeys.map((key) => (
                  <th scope="col" key={key}>
                    {positioningLabels[key]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {playerTypes.map((type) => {
                const referenceValues = getTypeReferenceValues(type)
                const isCurrent = type === currentType
                const isEstimated = totalTrainings > 0 && type === estimatedType

                return (
                  <tr
                    key={type}
                    className={isCurrent || isEstimated ? 'active-type' : undefined}
                  >
                    <th scope="row">
                      <span>{type}</span>
                      {isCurrent && <small>現在</small>}
                      {isEstimated && <small>特訓後</small>}
                    </th>
                    {positioningKeys.map((key) => (
                      <td key={key}>{referenceValues?.[key] ?? '—'}</td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="type-reference-note">
          バランスは全12項目を20として試算しています。
        </p>
      </details>

      <div className="simulation-selection-grid">
        <section
          className="simulation-picker"
          aria-labelledby="simulation-picker-heading"
        >
          <div className="subsection-heading">
            <h3 id="simulation-picker-heading">特訓を追加</h3>
            <span>{filteredMenus.length}件</span>
          </div>

          <div className="comparison-filters">
            <label className="field">
              <span>特訓名で検索</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="例：シュート、守護神"
              />
            </label>

            <label className="field">
              <span>必要な課題で絞り込み</span>
              <select
                value=""
                onChange={(event) => addCardFilter(event.target.value)}
              >
                <option value="">課題を追加</option>
                {cardOptions.map((card) => (
                  <option
                    key={card}
                    value={card}
                    disabled={selectedCards.includes(card)}
                  >
                    {card}
                  </option>
                ))}
              </select>
            </label>

            <label className="field simulation-sort-field">
              <span>並べ替えるパラメータ</span>
              <select
                value={sortKey}
                onChange={(event) =>
                  setSortKey(event.target.value as NumericMetricKey)
                }
              >
                {sortMetricGroups.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.metrics.map((metric) => (
                      <option key={metric.key} value={metric.key}>
                        {metric.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <label className="field">
              <span>並び順</span>
              <select
                value={sortDirection}
                onChange={(event) =>
                  setSortDirection(event.target.value as SortDirection)
                }
              >
                <option value="desc">降順（大きい順）</option>
                <option value="asc">昇順（小さい順）</option>
              </select>
            </label>

            <button
              className="reset-button"
              type="button"
              onClick={() => {
                setQuery('')
                setSelectedCards([])
              }}
            >
              検索条件をリセット
            </button>
          </div>

          {selectedCards.length > 0 && (
            <div className="selected-card-filters" aria-label="選択中の課題">
              {selectedCards.map((card) => (
                <span key={card}>
                  {card}
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCards((current) =>
                        current.filter((selectedCard) => selectedCard !== card),
                      )
                    }
                    aria-label={`${card}の絞り込みを解除`}
                    title="絞り込みを解除"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="menu-results" aria-live="polite">
            {filteredMenus.length > 0 ? (
              filteredMenus.map((menu) => {
                const selectedCount =
                  selections.find((selection) => selection.name === menu.name)
                    ?.count ?? 0

                return (
                  <div className="menu-result-row" key={menu.name}>
                    <div className="menu-result-name">
                      <strong>{menu.name}</strong>
                      <span>{menu.cards.join(' / ')}</span>
                    </div>
                    <span className="menu-result-total">
                      {sortLabel}{' '}
                      {sortKey === 'fatigue'
                        ? menu[sortKey]
                        : formatGain(menu[sortKey])}
                      {selectedCount > 0 && ` / ${selectedCount}回`}
                    </span>
                    <button
                      type="button"
                      className="add-menu-button"
                      onClick={() => addTraining(menu.name)}
                    >
                      追加
                    </button>
                  </div>
                )
              })
            ) : (
              <div className="comparison-empty compact">
                条件に一致する特訓がありません。
              </div>
            )}
          </div>
        </section>

        <section
          className="simulation-plan"
          aria-labelledby="simulation-plan-heading"
        >
          <div className="subsection-heading">
            <h3 id="simulation-plan-heading">選択した特訓</h3>
            {selections.length > 0 && (
              <button
                type="button"
                className="clear-comparison-button"
                onClick={() => setSelections([])}
              >
                すべて削除
              </button>
            )}
          </div>

          {selectedMenus.length > 0 ? (
            <div className="simulation-plan-list">
              {selectedMenus.map(({ menu, count }) => (
                <div className="simulation-plan-row" key={menu.name}>
                  <div className="simulation-plan-name">
                    <strong>{menu.name}</strong>
                    <span>{menu.cards.join(' / ')}</span>
                  </div>
                  <div className="quantity-control">
                    <button
                      type="button"
                      onClick={() => changeTrainingCount(menu.name, -1)}
                      aria-label={`${menu.name}を1回減らす`}
                      title="1回減らす"
                    >
                      −
                    </button>
                    <output aria-label={`${menu.name}の回数`}>{count}回</output>
                    <button
                      type="button"
                      onClick={() => changeTrainingCount(menu.name, 1)}
                      aria-label={`${menu.name}を1回増やす`}
                      title="1回増やす"
                    >
                      ＋
                    </button>
                  </div>
                  <button
                    type="button"
                    className="remove-training-button"
                    onClick={() => removeTraining(menu.name)}
                    aria-label={`${menu.name}を削除`}
                    title="削除"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="simulation-plan-empty">
              検索結果から特訓を追加してください。
            </div>
          )}
        </section>
      </div>

      <section
        className="simulation-output"
        aria-labelledby="simulation-output-heading"
      >
        <div className="subsection-heading">
          <h3 id="simulation-output-heading">パラメータ合計</h3>
        </div>

        <div className="simulation-summary">
          <div>
            <span>基本パラメータ</span>
            <strong className={valueTone(totals.total)}>
              {formatGain(totals.total)}
            </strong>
          </div>
          <div>
            <span>裏パラメータ変化量</span>
            <strong className={valueTone(hiddenTotal)}>{formatGain(hiddenTotal)}</strong>
          </div>
          <div>
            <span>疲労蓄積値</span>
            <strong>{totals.fatigue}</strong>
          </div>
        </div>

        <div className="simulation-totals-grid">
          <div className="simulation-metric-group">
            <h4>基本パラメータ</h4>
            <table className="simulation-metric-table">
              <tbody>
                {basicMetrics.map((metric) => (
                  <tr key={metric.key}>
                    <th scope="row">{metric.label}</th>
                    <td className={valueTone(totals[metric.key])}>
                      {formatGain(totals[metric.key])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hiddenMetricGroups.map((group) => (
            <div className="simulation-metric-group" key={group.label}>
              <h4>{group.label}</h4>
              <table className="simulation-metric-table simulation-hidden-table">
                <thead>
                  <tr>
                    <th scope="col">項目</th>
                    <th scope="col">現在</th>
                    <th scope="col">変化</th>
                    <th scope="col">特訓後</th>
                  </tr>
                </thead>
                <tbody>
                  {group.metrics.map((metric) => {
                    const currentValue = isPositioningKey(metric.key)
                      ? currentPositioningValues[metric.key]
                      : null
                    const afterValue =
                      currentValue === null
                        ? null
                        : Math.max(0, currentValue + totals[metric.key])

                    return (
                      <tr key={metric.key}>
                        <th scope="row">{metric.label}</th>
                        <td>{currentValue ?? '—'}</td>
                        <td className={valueTone(totals[metric.key])}>
                          {formatGain(totals[metric.key])}
                        </td>
                        <td>{afterValue ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <p className="simulation-type-note">
          ※現在の裏パラとタイプはGBA版の基準値を用いた試算です。バランスは全項目を20とし、クオリティ2項目は基準値がないため「—」で表示します。{' '}
          <a
            href="https://docs.google.com/document/d/1Iw6IkM2GaSNHSlH5mCg2TnpQ4SVq41CRmv0fXT97X-I/edit?tab=t.0"
            target="_blank"
            rel="noreferrer"
          >
            判定仕様
          </a>
        </p>
      </section>
    </section>
  )
}
