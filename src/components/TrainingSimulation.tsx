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
import {
  defaultTypeReferenceSort,
  sortTypeReferences,
  toggleTypeReferenceSort,
  type TypeReferenceSort,
} from '../typeReferenceSorting'
import { useSpecialMenuSearch } from '../useSpecialMenuSearch'
import { SpecialMenuSearchFilters } from './SpecialMenuSearchFilters'
import { TrainingDetailDialog } from './TrainingDetailDialog'
import { TypeSelectionCards } from './TypeSelectionCards'

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
type RecommendedMenu = { menu: SpecialMenu; approachAmount: number }

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

function getApproachAmount(
  menu: SpecialMenu,
  currentValues: Record<PositioningKey, number>,
  targetValues: Record<PositioningKey, number>,
) {
  return positioningKeys.reduce((sum, key) => {
    const currentDistance = Math.abs(targetValues[key] - currentValues[key])
    const trainedValue = Math.max(0, currentValues[key] + menu[key])
    const trainedDistance = Math.abs(targetValues[key] - trainedValue)

    return sum + currentDistance - trainedDistance
  }, 0)
}

type TrainingSimulationProps = {
  menus: SpecialMenu[]
}

export function TrainingSimulation({ menus }: TrainingSimulationProps) {
  const [selections, setSelections] = useState<Selection[]>([])
  const [currentType, setCurrentType] = useState<PlayerType>('バランス')
  const [targetType, setTargetType] = useState<PlayerType | ''>('')
  const [detailMenu, setDetailMenu] = useState<SpecialMenu | null>(null)
  const [typeTableSort, setTypeTableSort] = useState<TypeReferenceSort>(
    defaultTypeReferenceSort,
  )
  const sortedTypeReferences = useMemo(
    () => sortTypeReferences(typeTableSort),
    [typeTableSort],
  )
  const {
    addCardFilter,
    cardOptions,
    filteredMenus,
    initialGroup,
    query,
    removeCardFilter,
    resetSearch,
    selectedCards,
    setInitialGroup,
    setQuery,
  } = useSpecialMenuSearch(menus)

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
  const currentPositioningValues = useMemo(
    () => getCurrentPositioningValues(currentType),
    [currentType],
  )
  const targetPositioningValues = useMemo(
    () => (targetType ? getTypeReferenceValues(targetType) : null),
    [targetType],
  )
  const recommendedMenus = useMemo(() => {
    if (!targetPositioningValues) return []

    return menus
      .map((menu): RecommendedMenu => ({
        menu,
        approachAmount: getApproachAmount(
          menu,
          currentPositioningValues,
          targetPositioningValues,
        ),
      }))
      .filter(({ approachAmount }) => approachAmount > 0)
      .sort(
        (first, second) =>
          second.approachAmount - first.approachAmount ||
          first.menu.name.localeCompare(second.menu.name, 'ja'),
      )
  }, [currentPositioningValues, menus, targetPositioningValues])

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

      <TypeSelectionCards
        id="simulation-type-selector"
        types={playerTypes}
        description="各タイプの「現在」と「目標」を選択します。選択中の目標は再度押すと解除できます。"
        primaryLabel="現在"
        primaryValue={currentType}
        onPrimaryChange={(type) => type && setCurrentType(type)}
        secondaryLabel="目標"
        secondaryValue={targetType}
        onSecondaryChange={setTargetType}
        footer={
          <>
          <div className="estimated-type" aria-live="polite">
            <span>特訓後タイプ（推定）</span>
            <strong>{estimatedType}</strong>
          </div>

          <div className="simulation-session-count">
            <strong>{totalTrainings}</strong>
            <span>回の特訓</span>
          </div>
          </>
        }
      />

      <details className="type-reference simulation-disclosure">
        <summary>タイプ変更表</summary>
        <div className="type-reference-table-shell">
          <table className="type-reference-table">
            <thead>
              <tr>
                <th scope="col">
                  <button
                    type="button"
                    className="type-reference-sort-button"
                    aria-label="タイプを初期順に戻す"
                    onClick={() => setTypeTableSort(defaultTypeReferenceSort)}
                  >
                    <span>タイプ</span>
                    <span className="sort-indicator" aria-hidden="true">
                      ↺
                    </span>
                  </button>
                </th>
                {positioningKeys.map((key) => (
                  <th
                    scope="col"
                    key={key}
                    aria-sort={
                      typeTableSort.key === key
                        ? typeTableSort.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <button
                      type="button"
                      className="type-reference-sort-button"
                      aria-label={`${positioningLabels[key]}を${
                        typeTableSort.key === key &&
                        typeTableSort.direction === 'desc'
                          ? '小さい順'
                          : '大きい順'
                      }に並べ替える`}
                      onClick={() =>
                        setTypeTableSort((current) =>
                          toggleTypeReferenceSort(current, key),
                        )
                      }
                    >
                      <span>{positioningLabels[key]}</span>
                      <span className="sort-indicator" aria-hidden="true">
                        {typeTableSort.key === key
                          ? typeTableSort.direction === 'asc'
                            ? '↑'
                            : '↓'
                          : '↕'}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTypeReferences.map((type) => {
                const referenceValues = getTypeReferenceValues(type)
                const isCurrent = type === currentType
                const isTarget = type === targetType
                const isEstimated = totalTrainings > 0 && type === estimatedType

                return (
                  <tr
                    key={type}
                    className={
                      isCurrent || isTarget || isEstimated
                        ? 'active-type'
                        : undefined
                    }
                  >
                    <th scope="row">
                      <span>{type}</span>
                      {isCurrent && <small>現在</small>}
                      {isTarget && <small>目標</small>}
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

      <details className="simulation-recommendations simulation-disclosure">
        <summary>
          <span>おすすめ特訓</span>
          {targetType && <small>{recommendedMenus.length}件・接近量順</small>}
        </summary>

        {!targetType ? (
          <div className="recommendation-empty">目標タイプ未選択</div>
        ) : recommendedMenus.length > 0 ? (
          <div className="recommendation-list">
            {recommendedMenus.map(({ menu, approachAmount }, index) => {
              const selectedCount =
                selections.find((selection) => selection.name === menu.name)
                  ?.count ?? 0

              return (
                <div className="recommendation-row" key={menu.name}>
                  <span className="recommendation-rank">{index + 1}</span>
                  <button
                    type="button"
                    className="recommendation-name training-info-trigger"
                    onClick={() => setDetailMenu(menu)}
                    aria-label={`${menu.name}の情報を表示`}
                    title="特訓情報を表示"
                  >
                    <strong>{menu.name}</strong>
                    <span>{menu.cards.join(' / ')}</span>
                  </button>
                  <span className="recommendation-score">
                    接近量 <strong>+{approachAmount}</strong>
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
            })}
          </div>
        ) : (
          <div className="recommendation-empty">目標に近づく特訓なし</div>
        )}
      </details>

      <div className="simulation-selection-grid">
        <details className="simulation-picker simulation-disclosure">
          <summary>
            <span>特訓を追加</span>
            <small>{filteredMenus.length}件</small>
          </summary>

          <div className="simulation-picker-content">
            <SpecialMenuSearchFilters
              query={query}
              onQueryChange={setQuery}
              cardOptions={cardOptions}
              selectedCards={selectedCards}
              onAddCard={addCardFilter}
              onRemoveCard={removeCardFilter}
              initialGroup={initialGroup}
              onInitialGroupChange={setInitialGroup}
              onReset={resetSearch}
            />

            <div className="menu-results" aria-live="polite">
              {filteredMenus.length > 0 ? (
                filteredMenus.map((menu) => {
                  const selectedCount =
                    selections.find(
                      (selection) => selection.name === menu.name,
                    )?.count ?? 0

                  return (
                    <div className="menu-result-row" key={menu.name}>
                      <button
                        type="button"
                        className="menu-result-name training-info-trigger"
                        onClick={() => setDetailMenu(menu)}
                        aria-label={`${menu.name}の情報を表示`}
                        title="特訓情報を表示"
                      >
                        <strong>{menu.name}</strong>
                        <span>{menu.cards.join(' / ')}</span>
                      </button>
                      <span className="menu-result-total">
                        合計 {menu.total}
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
          </div>
        </details>

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
                  <button
                    type="button"
                    className="simulation-plan-name training-info-trigger"
                    onClick={() => setDetailMenu(menu)}
                    aria-label={`${menu.name}の情報を表示`}
                    title="特訓情報を表示"
                  >
                    <strong>{menu.name}</strong>
                    <span>{menu.cards.join(' / ')}</span>
                  </button>
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
                    <th scope="col">目標差</th>
                    <th scope="col">変化</th>
                    <th scope="col">特訓後</th>
                  </tr>
                </thead>
                <tbody>
                  {group.metrics.map((metric) => {
                    const positioningKey = isPositioningKey(metric.key)
                      ? metric.key
                      : null
                    const currentValue = positioningKey
                      ? currentPositioningValues[positioningKey]
                      : null
                    const targetDifference =
                      positioningKey && targetPositioningValues
                        ? targetPositioningValues[positioningKey] -
                          currentPositioningValues[positioningKey]
                        : null
                    const afterValue =
                      currentValue === null
                        ? null
                        : Math.max(0, currentValue + totals[metric.key])

                    return (
                      <tr key={metric.key}>
                        <th scope="row">{metric.label}</th>
                        <td>{currentValue ?? '—'}</td>
                        <td
                          className={
                            targetDifference === null
                              ? 'zero'
                              : valueTone(targetDifference)
                          }
                        >
                          {targetDifference === null
                            ? '—'
                            : formatGain(targetDifference)}
                        </td>
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
          ※目標差は「目標タイプの基準値 - 現在値」です。現在の裏パラとタイプはGBA版の基準値を用いた試算で、バランスは全項目を20としています。クオリティ2項目は基準値がないため「—」で表示します。{' '}
          <a
            href="https://docs.google.com/document/d/1Iw6IkM2GaSNHSlH5mCg2TnpQ4SVq41CRmv0fXT97X-I/edit?tab=t.0"
            target="_blank"
            rel="noreferrer"
          >
            判定仕様
          </a>
        </p>
      </section>

      {detailMenu && (
        <TrainingDetailDialog
          menu={detailMenu}
          onClose={() => setDetailMenu(null)}
        />
      )}
    </section>
  )
}
