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
import { useSpecialMenuSearch } from '../useSpecialMenuSearch'
import { SpecialMenuSearchFilters } from './SpecialMenuSearchFilters'
import { TrainingDetailDialog } from './TrainingDetailDialog'
import { TypeRadarCharts, type TypeRadarSeries } from './TypeRadarCharts'
import { TypeSelectionCards } from './TypeSelectionCards'

const offenseKeys: PositioningKey[] = [
  'support',
  'triangle',
  'loseMark',
  'overlap',
  'diagonalRun',
  'spaceRun',
  'goalFront',
]

const defenseKeys: PositioningKey[] = [
  'zoneMarking',
  'manMarking',
  'pressing',
  'shootCut',
  'intercept',
]

const positioningLabels: Record<PositioningKey, string> = {
  support: 'サポート',
  triangle: 'トライアングル',
  loseMark: 'マークを外す',
  overlap: 'オーバーラップ',
  diagonalRun: 'ダイアゴナルラン',
  spaceRun: 'スペースに走り込む',
  goalFront: 'ゴール前待機',
  zoneMarking: 'ゾーンマーキング',
  manMarking: 'マンツーマン',
  pressing: 'プレッシング',
  shootCut: 'シュートカット',
  intercept: 'インターセプト',
}

type ProgressionRow = {
  count: number
  type: PlayerType
  values: Record<PositioningKey, number>
  offenseQualityChange: number
  defenseQualityChange: number
}

type RecommendedMenu = {
  menu: SpecialMenu
  approachAmount: number
}

type TrainingSimulationProps = {
  menus: SpecialMenu[]
}

function formatChange(value: number) {
  return value > 0 ? `+${value}` : String(value)
}

function valueTone(value: number) {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'zero'
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

export function TrainingSimulation({ menus }: TrainingSimulationProps) {
  const [selectedMenuName, setSelectedMenuName] = useState('')
  const [repeatLimit, setRepeatLimit] = useState(20)
  const [currentType, setCurrentType] = useState<PlayerType>('バランス')
  const [targetType, setTargetType] = useState<PlayerType | ''>('')
  const [detailMenu, setDetailMenu] = useState<SpecialMenu | null>(null)
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

  const selectedMenu = useMemo(
    () => menus.find((menu) => menu.name === selectedMenuName) ?? null,
    [menus, selectedMenuName],
  )
  const currentValues = useMemo(
    () => getCurrentPositioningValues(currentType),
    [currentType],
  )
  const targetValues = useMemo(
    () => (targetType ? getTypeReferenceValues(targetType) : null),
    [targetType],
  )
  const recommendedMenus = useMemo(() => {
    if (!targetValues) return []

    return menus
      .map((menu): RecommendedMenu => ({
        menu,
        approachAmount: getApproachAmount(menu, currentValues, targetValues),
      }))
      .filter(({ approachAmount }) => approachAmount > 0)
      .sort(
        (first, second) =>
          second.approachAmount - first.approachAmount ||
          first.menu.name.localeCompare(second.menu.name, 'ja'),
      )
  }, [currentValues, menus, targetValues])
  const radarSeries = useMemo<TypeRadarSeries[]>(() => {
    if (!targetType) {
      return [{ id: 'current', type: currentType, label: `現在：${currentType}` }]
    }

    if (targetType === currentType) {
      return [
        {
          id: 'current-target',
          type: currentType,
          label: `現在・目標：${currentType}`,
        },
      ]
    }

    return [
      { id: 'current', type: currentType, label: `現在：${currentType}` },
      { id: 'target', type: targetType, label: `目標：${targetType}` },
    ]
  }, [currentType, targetType])

  const progressionRows = useMemo<ProgressionRow[]>(() => {
    if (!selectedMenu) return []

    return Array.from({ length: repeatLimit }, (_, index) => {
      const count = index + 1
      const gains = Object.fromEntries(
        positioningKeys.map((key) => [key, selectedMenu[key] * count]),
      ) as Record<PositioningKey, number>
      const values = Object.fromEntries(
        positioningKeys.map((key) => [
          key,
          Math.max(0, currentValues[key] + gains[key]),
        ]),
      ) as Record<PositioningKey, number>

      return {
        count,
        type: estimatePlayerType(currentType, gains, true),
        values,
        offenseQualityChange: selectedMenu.offenseQuality * count,
        defenseQualityChange: selectedMenu.defenseQuality * count,
      }
    })
  }, [currentType, currentValues, repeatLimit, selectedMenu])

  const firstTargetCount = targetType
    ? progressionRows.find((row) => row.type === targetType)?.count ?? null
    : null

  return (
    <section className="simulation-page" aria-labelledby="simulation-heading">
      <div className="section-heading simulation-heading">
        <div>
          <h2 id="simulation-heading">特訓シミュレーション</h2>
          <p className="section-description">
            1つの特訓を繰り返したときの裏パラと選手タイプの推移を確認できます。
          </p>
        </div>
      </div>

      <TypeSelectionCards
        id="simulation-type-selector"
        types={playerTypes}
        description="現在と目標のタイプを指定すると、基準値をレーダーチャートで比較できます。"
        primaryLabel="現在"
        primaryValue={currentType}
        onPrimaryChange={(type) => type && setCurrentType(type)}
        secondaryLabel="目標"
        secondaryValue={targetType}
        onSecondaryChange={setTargetType}
      />

      <section
        className="simulation-radar-section"
        aria-label="現在と目標タイプのレーダーチャート"
      >
        <TypeRadarCharts idPrefix="simulation" series={radarSeries} />
      </section>

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
              const isSelected = menu.name === selectedMenuName

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
                  </span>
                  <button
                    type="button"
                    className="add-menu-button"
                    onClick={() => setSelectedMenuName(menu.name)}
                    disabled={isSelected}
                  >
                    {isSelected ? '選択中' : '選択'}
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="recommendation-empty">目標に近づく特訓なし</div>
        )}
      </details>

      <section
        className="comparison-picker simulation-picker"
        aria-labelledby="simulation-picker-heading"
      >
        <div className="subsection-heading">
          <h3 id="simulation-picker-heading">特訓を選ぶ</h3>
          <span>{filteredMenus.length}件</span>
        </div>

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
              const isSelected = menu.name === selectedMenuName

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
                  <span className="menu-result-total">合計 {menu.total}</span>
                  <button
                    type="button"
                    className="add-menu-button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedMenuName(menu.name)}
                    disabled={isSelected}
                  >
                    {isSelected ? '選択中' : '選択'}
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
        className="simulation-progression-section"
        aria-labelledby="simulation-progression-heading"
      >
        <div className="subsection-heading">
          <div>
            <h3 id="simulation-progression-heading">裏パラ・タイプの推移</h3>
            <p>
              {selectedMenu
                ? `${selectedMenu.name}を1回〜${repeatLimit}回実行した場合`
                : '特訓を選択すると推移を表示します。'}
            </p>
          </div>
          <label className="simulation-repeat-field">
            <span>表示回数 n</span>
            <input
              type="number"
              min="1"
              max="100"
              value={repeatLimit}
              onChange={(event) =>
                setRepeatLimit(
                  Math.min(100, Math.max(1, Number(event.target.value) || 1)),
                )
              }
            />
            <small>回まで</small>
          </label>
        </div>

        {selectedMenu ? (
          <>
            <div className="simulation-selected-menu">
              <button
                type="button"
                className="simulation-selected-menu-name training-info-trigger"
                onClick={() => setDetailMenu(selectedMenu)}
                aria-label={`${selectedMenu.name}の情報を表示`}
                title="特訓情報を表示"
              >
                <strong>{selectedMenu.name}</strong>
                <span>{selectedMenu.cards.join(' / ')}</span>
              </button>
              <div className="simulation-target-result" aria-live="polite">
                {targetType ? (
                  firstTargetCount ? (
                    <>
                      目標タイプへ初めて到達 <strong>{firstTargetCount}回</strong>
                    </>
                  ) : (
                    `${repeatLimit}回以内に目標タイプへ到達しません`
                  )
                ) : (
                  '目標タイプ未指定'
                )}
              </div>
              <button
                type="button"
                className="clear-comparison-button"
                onClick={() => setSelectedMenuName('')}
              >
                選択解除
              </button>
            </div>

            <div className="simulation-progression-table-shell">
              <table className="simulation-progression-table">
                <thead>
                  <tr>
                    <th scope="col" rowSpan={2}>回数</th>
                    <th scope="col" rowSpan={2}>タイプ（推定）</th>
                    <th scope="colgroup" colSpan={8}>攻撃系裏パラ</th>
                    <th scope="colgroup" colSpan={6}>守備系裏パラ</th>
                  </tr>
                  <tr>
                    <th scope="col">オフェンスQ<br />変化</th>
                    {offenseKeys.map((key) => (
                      <th scope="col" key={key}>{positioningLabels[key]}</th>
                    ))}
                    <th scope="col">ディフェンスQ<br />変化</th>
                    {defenseKeys.map((key) => (
                      <th scope="col" key={key}>{positioningLabels[key]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {progressionRows.map((row, index) => {
                    const previousType =
                      index === 0 ? currentType : progressionRows[index - 1].type
                    const typeChanged = row.type !== previousType
                    const reachedTarget = Boolean(targetType && row.type === targetType)

                    return (
                      <tr
                        key={row.count}
                        className={reachedTarget ? 'target-type-row' : undefined}
                      >
                        <th scope="row">{row.count}回</th>
                        <td className="simulation-result-type">
                          <strong>{row.type}</strong>
                          {typeChanged && <small>変更</small>}
                        </td>
                        <td className={valueTone(row.offenseQualityChange)}>
                          {formatChange(row.offenseQualityChange)}
                        </td>
                        {offenseKeys.map((key) => (
                          <td key={key}>{row.values[key]}</td>
                        ))}
                        <td className={valueTone(row.defenseQualityChange)}>
                          {formatChange(row.defenseQualityChange)}
                        </td>
                        {defenseKeys.map((key) => (
                          <td key={key}>{row.values[key]}</td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <p className="simulation-type-note">
              ※ポジショニング12項目は現在タイプの基準値に累積変化を加えた推定値です。値は0未満になりません。タイプ判定は各回の12項目を正規化して行います。クオリティ2項目は初期値をタイプから推定できないため、累積変化量を表示します。
            </p>
          </>
        ) : (
          <div className="simulation-plan-empty">
            検索結果から特訓を1つ選択してください。
          </div>
        )}
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
