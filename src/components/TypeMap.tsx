import {
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react'
import {
  TYPE_MAP_DISTANCES,
  TYPE_MAP_POINTS,
} from '../data/typeMap.generated'
import { playerTypes, type PlayerType } from '../typeEstimation'
import { typeColors } from '../typeColors'
import type { SpecialMenu } from '../types'
import { calculateTypeVector } from '../typeVector'
import { useSpecialMenuSearch } from '../useSpecialMenuSearch'
import { SpecialMenuSearchFilters } from './SpecialMenuSearchFilters'
import { TrainingDetailDialog } from './TrainingDetailDialog'
import { TypeRadarCharts } from './TypeRadarCharts'

type LabelPosition = {
  dx: number
  dy: number
  anchor: 'start' | 'middle' | 'end'
}

const defaultLabelPosition: LabelPosition = {
  dx: 0,
  dy: -3.2,
  anchor: 'middle',
}

const labelPositions: Partial<Record<PlayerType, LabelPosition>> = {
  アタッカー: { dx: 0, dy: -3.4, anchor: 'middle' },
  オールラウンド: { dx: 0, dy: 4.3, anchor: 'middle' },
  ストライカー: { dx: -3, dy: -2.8, anchor: 'end' },
  リベロ: { dx: 0, dy: -3.4, anchor: 'middle' },
  ストッパー: { dx: 3, dy: -2.7, anchor: 'start' },
  スイーパー: { dx: 2.8, dy: -2.6, anchor: 'start' },
  ダイナモ: { dx: 0, dy: 4.2, anchor: 'middle' },
  チャンスメーカー: { dx: 0, dy: -3.5, anchor: 'middle' },
  バックアップ: { dx: 0, dy: -3.4, anchor: 'middle' },
  マンマーカー: { dx: 3, dy: -2.7, anchor: 'start' },
  レジスタ: { dx: 0, dy: 4.2, anchor: 'middle' },
}

const pointByType = Object.fromEntries(
  TYPE_MAP_POINTS.map((point) => [point.type, point]),
) as Record<PlayerType, (typeof TYPE_MAP_POINTS)[number]>

const mapWidth = 120
const mapHeight = 100
const mapScale = mapHeight / 100
const mapOffsetX = (mapWidth - 100 * mapScale) / 2
const projectX = (x: number) => mapOffsetX + x * mapScale
const projectY = (y: number) => y * mapScale

type TypeColorStyle = CSSProperties & {
  '--type-color': string
}

const getTypeColorStyle = (type: PlayerType): TypeColorStyle => ({
  '--type-color': typeColors[type],
})

function formatDistance(distance: number) {
  return distance.toFixed(3)
}

function getMapDistance(firstType: PlayerType, secondType: PlayerType) {
  const first = pointByType[firstType]
  const second = pointByType[secondType]

  return Math.hypot(
    projectX(first.x) - projectX(second.x),
    projectY(first.y) - projectY(second.y),
  )
}

type DistanceRow = {
  type: PlayerType
  distance: number
}

type TypeDistanceTableProps = {
  id: string
  title: string
  description: string
  rows: DistanceRow[]
  onSelectType: (type: PlayerType) => void
}

function TypeDistanceTable({
  id,
  title,
  description,
  rows,
  onSelectType,
}: TypeDistanceTableProps) {
  return (
    <section className="type-map-distance-card" aria-labelledby={`${id}-heading`}>
      <div className="type-map-distance-heading">
        <h4 id={`${id}-heading`}>{title}</h4>
        <p>{description}</p>
      </div>
      <div className="type-map-distance-table-shell">
        <table className="type-map-distance-table">
          <thead>
            <tr>
              <th scope="col">順位</th>
              <th scope="col">タイプ</th>
              <th scope="col">距離</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ type, distance }, index) => (
              <tr key={type} style={getTypeColorStyle(type)}>
                <td>{index + 1}</td>
                <th scope="row">
                  <button type="button" onClick={() => onSelectType(type)}>
                    <i aria-hidden="true" />
                    {type}
                  </button>
                </th>
                <td>{formatDistance(distance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

type TypeMapProps = {
  menus: SpecialMenu[]
}

export function TypeMap({ menus }: TypeMapProps) {
  const [selectedType, setSelectedType] = useState<PlayerType | null>(null)
  const [selectedMenuName, setSelectedMenuName] = useState('')
  const [vectorBaseType, setVectorBaseType] =
    useState<PlayerType>('バランス')
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
  const selectedMenuVector = useMemo(
    () =>
      selectedMenu ? calculateTypeVector(selectedMenu, vectorBaseType) : null,
    [selectedMenu, vectorBaseType],
  )
  const trainingPoint = useMemo(() => {
    if (!selectedMenuVector) return null

    const positiveEntries = selectedMenuVector.entries.filter(
      ({ value }) => value > 0,
    )
    const totalWeight = positiveEntries.reduce(
      (sum, { value }) => sum + value,
      0,
    )

    if (totalWeight <= 0) return null

    return {
      x:
        positiveEntries.reduce(
          (sum, { type, value }) => sum + pointByType[type].x * value,
          0,
        ) / totalWeight,
      y:
        positiveEntries.reduce(
          (sum, { type, value }) => sum + pointByType[type].y * value,
          0,
        ) / totalWeight,
    }
  }, [selectedMenuVector])
  const distanceRows = useMemo(() => {
    if (!selectedType) return []

    return playerTypes
      .filter((type) => type !== selectedType)
      .map((type) => ({
        type,
        mapDistance: getMapDistance(selectedType, type),
        manhattanDistance: TYPE_MAP_DISTANCES[selectedType][type],
      }))
  }, [selectedType])
  const mapDistanceRows = useMemo(
    () =>
      [...distanceRows]
        .sort(
          (first, second) =>
            first.mapDistance - second.mapDistance ||
            first.type.localeCompare(second.type, 'ja'),
        )
        .map(({ type, mapDistance }) => ({ type, distance: mapDistance })),
    [distanceRows],
  )
  const manhattanDistanceRows = useMemo(
    () =>
      [...distanceRows]
        .sort(
          (first, second) =>
            first.manhattanDistance - second.manhattanDistance ||
            first.type.localeCompare(second.type, 'ja'),
        )
        .map(({ type, manhattanDistance }) => ({
          type,
          distance: manhattanDistance,
        })),
    [distanceRows],
  )
  const nearestTypes = mapDistanceRows.slice(0, 3)
  const neighborRank = new Map(
    nearestTypes.map(({ type }, index) => [type, index + 1]),
  )

  const toggleType = (type: PlayerType) => {
    setSelectedType((current) => (current === type ? null : type))
  }

  const handlePointKeyDown = (
    event: KeyboardEvent<SVGGElement>,
    type: PlayerType,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    toggleType(type)
  }

  return (
    <section className="type-map-page" aria-labelledby="type-map-heading">
      <div className="section-heading type-map-heading">
        <div>
          <h2 id="type-map-heading">タイプマップ</h2>
          <p className="section-description">
            12種類のタイプを、裏パラの数値的な近さに基づいて2次元に配置します。
          </p>
        </div>
      </div>

      <div
        className={`type-map-overview${selectedType ? ' has-selection' : ''}`}
      >
        <div className="type-map-layout">
          <section className="type-map-card" aria-labelledby="type-map-chart-heading">
          <div className="type-map-card-heading">
            <div>
              <h3 id="type-map-chart-heading">タイプ同士の関係</h3>
              <p>点を選ぶと、裏パラと全タイプとの距離を表示します。</p>
            </div>
            {selectedType && (
              <button type="button" onClick={() => setSelectedType(null)}>
                選択解除
              </button>
            )}
          </div>

          <svg
            className="type-map-chart"
            viewBox={`0 0 ${mapWidth} ${mapHeight}`}
            role="img"
            aria-labelledby="type-map-svg-title type-map-svg-description"
          >
            <title id="type-map-svg-title">12種類のタイプマップ</title>
            <desc id="type-map-svg-description">
              点が近いほど裏パラの傾向が似ています。縦軸と横軸自体に固定の意味はありません。
            </desc>

            <rect
              className="type-map-background"
              x="0"
              y="0"
              width={mapWidth}
              height={mapHeight}
            />
            <g className="type-map-grid" aria-hidden="true">
              <line x1={projectX(25)} y1={projectY(5)} x2={projectX(25)} y2={projectY(95)} />
              <line x1={projectX(50)} y1={projectY(5)} x2={projectX(50)} y2={projectY(95)} />
              <line x1={projectX(75)} y1={projectY(5)} x2={projectX(75)} y2={projectY(95)} />
              <line x1={projectX(5)} y1={projectY(25)} x2={projectX(95)} y2={projectY(25)} />
              <line x1={projectX(5)} y1={projectY(50)} x2={projectX(95)} y2={projectY(50)} />
              <line x1={projectX(5)} y1={projectY(75)} x2={projectX(95)} y2={projectY(75)} />
            </g>

            {selectedType && (
              <g className="type-map-neighbor-lines" aria-hidden="true">
                {nearestTypes.map(({ type }) => (
                  <line
                    key={type}
                    style={getTypeColorStyle(type)}
                    x1={projectX(pointByType[selectedType].x)}
                    y1={projectY(pointByType[selectedType].y)}
                    x2={projectX(pointByType[type].x)}
                    y2={projectY(pointByType[type].y)}
                  />
                ))}
              </g>
            )}

            <g className="type-map-points">
              {TYPE_MAP_POINTS.map((point) => {
                const isSelected = point.type === selectedType
                const rank = neighborRank.get(point.type)
                const isNeighbor = rank !== undefined
                const isDimmed = Boolean(
                  selectedType && !isSelected && !isNeighbor,
                )
                const labelPosition =
                  labelPositions[point.type] ?? defaultLabelPosition
                const pointX = projectX(point.x)
                const pointY = projectY(point.y)

                return (
                  <g
                    className={`type-map-point${isSelected ? ' is-selected' : ''}${isNeighbor ? ' is-neighbor' : ''}${isDimmed ? ' is-dimmed' : ''}`}
                    key={point.type}
                    style={getTypeColorStyle(point.type)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`${point.type}${rank ? `、近いタイプ第${rank}位` : ''}`}
                    onClick={() => toggleType(point.type)}
                    onKeyDown={(event) => handlePointKeyDown(event, point.type)}
                  >
                    <circle
                      className="type-map-point-hit"
                      cx={pointX}
                      cy={pointY}
                      r="4.2"
                    />
                    {isNeighbor && (
                      <circle
                        className="type-map-neighbor-ring"
                        cx={pointX}
                        cy={pointY}
                        r="2.6"
                      />
                    )}
                    <circle
                      className="type-map-point-mark"
                      cx={pointX}
                      cy={pointY}
                      r={isSelected ? 2 : 1.55}
                    >
                      <title>
                        {point.type}
                        {selectedType && point.type !== selectedType
                          ? `・12次元距離 ${formatDistance(TYPE_MAP_DISTANCES[selectedType][point.type])}`
                          : ''}
                      </title>
                    </circle>
                    {rank && (
                      <text
                        className="type-map-neighbor-rank"
                        x={pointX + 2.7}
                        y={pointY - 2.3}
                      >
                        {rank}
                      </text>
                    )}
                    <text
                      className="type-map-point-label"
                      x={pointX + labelPosition.dx}
                      y={pointY + labelPosition.dy}
                      textAnchor={labelPosition.anchor}
                    >
                      {point.label}
                    </text>
                  </g>
                )
              })}
            </g>

            {selectedMenu && trainingPoint && (
              <g className="type-map-training-point">
                <rect
                  x={projectX(trainingPoint.x) - 1.5}
                  y={projectY(trainingPoint.y) - 1.5}
                  width="3"
                  height="3"
                  transform={`rotate(45 ${projectX(trainingPoint.x)} ${projectY(trainingPoint.y)})`}
                >
                  <title>
                    {selectedMenu.name}・{selectedMenuVector?.tendencyLabel}
                  </title>
                </rect>
                <text
                  x={projectX(trainingPoint.x) + (trainingPoint.x > 72 ? -2.8 : 2.8)}
                  y={projectY(trainingPoint.y) + (trainingPoint.y < 14 ? 3.8 : -2.8)}
                  textAnchor={trainingPoint.x > 72 ? 'end' : 'start'}
                >
                  {selectedMenu.name}
                </text>
              </g>
            )}
          </svg>

          <p className="type-map-axis-note">
            ※横軸・縦軸そのものに固定の意味はありません。選択タイプに近い3点は、マップ上の距離順で強調します。
          </p>
          </section>
        </div>

        {selectedType && (
          <section
            className="type-map-radar-pane"
            aria-labelledby="type-map-selection-heading"
          >
            <div
              className="type-map-selection-heading"
              style={getTypeColorStyle(selectedType)}
            >
              <div>
                <span>選択タイプ</span>
                <h3 id="type-map-selection-heading">{selectedType}</h3>
              </div>
              <p>攻撃系・守備系の裏パラを表示します。</p>
            </div>

            <div className="type-map-selected-radar">
              <TypeRadarCharts
                idPrefix="type-map-selection"
                series={[{ id: selectedType, type: selectedType }]}
              />
            </div>
          </section>
        )}
      </div>

      {selectedType && (
        <section
          className="type-map-selection-details"
          aria-labelledby="type-map-selection-heading"
        >
          <div className="type-map-distance-grid">
            <TypeDistanceTable
              id="type-map-screen-distance"
              title="マップ上の距離"
              description="MDS後の2次元ユークリッド距離"
              rows={mapDistanceRows}
              onSelectType={setSelectedType}
            />
            <TypeDistanceTable
              id="type-map-manhattan-distance"
              title="マンハッタン距離"
              description="正規化した12次元のタイプ間距離"
              rows={manhattanDistanceRows}
              onSelectType={setSelectedType}
            />
          </div>
        </section>
      )}

      <details className="type-map-training-panel simulation-disclosure">
        <summary>
          <span>特訓をマップに表示</span>
          <small>{selectedMenu?.name ?? '未選択'}</small>
        </summary>
        <div className="type-map-training-content">
          <div className="type-map-training-toolbar">
            <label>
              <span>タイプベクトルの基準タイプ</span>
              <select
                value={vectorBaseType}
                onChange={(event) =>
                  setVectorBaseType(event.target.value as PlayerType)
                }
              >
                {playerTypes.map((type) => (
                  <option value={type} key={type}>{type}</option>
                ))}
              </select>
            </label>

            {selectedMenu && selectedMenuVector && (
              <div className="type-map-training-summary" aria-live="polite">
                <button
                  type="button"
                  className="training-info-trigger"
                  onClick={() => setDetailMenu(selectedMenu)}
                >
                  {selectedMenu.name}
                </button>
                <span>
                  {trainingPoint
                    ? `タイプ傾向：${selectedMenuVector.tendencyLabel}`
                    : '明確なタイプ傾向なし（マップ上には表示しません）'}
                </span>
                <button
                  type="button"
                  className="clear-comparison-button"
                  onClick={() => setSelectedMenuName('')}
                >
                  選択解除
                </button>
              </div>
            )}
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
                      onClick={() => setSelectedMenuName(menu.name)}
                      disabled={isSelected}
                    >
                      {isSelected ? '表示中' : 'マップに表示'}
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

      <p className="type-map-method-note">
        基準値の変更時は、ビルド前の生成処理で距離行列と座標を再計算します。座標は手動で調整せず、ラベル位置と表示方向だけを固定しています。
      </p>

      {detailMenu && (
        <TrainingDetailDialog
          menu={detailMenu}
          onClose={() => setDetailMenu(null)}
        />
      )}
    </section>
  )
}
