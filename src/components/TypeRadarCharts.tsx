import {
  getTypeReferenceValues,
  type PlayerType,
  type PositioningKey,
} from '../typeEstimation'
import { typeColors } from '../typeColors'

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

export type TypeRadarSeries = {
  id: string
  type: PlayerType
  label?: string
}

type Point = { x: number; y: number }

function getPoint(
  index: number,
  total: number,
  distance: number,
  center: Point,
) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / total

  return {
    x: center.x + Math.cos(angle) * distance,
    y: center.y + Math.sin(angle) * distance,
  }
}

function pointsAttribute(points: Point[]) {
  return points.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
}

type RadarChartProps = {
  id: string
  title: string
  keys: PositioningKey[]
  series: TypeRadarSeries[]
}

function RadarChart({ id, title, keys, series }: RadarChartProps) {
  const center = { x: 280, y: 195 }
  const radius = 132
  const labelRadius = 168
  const levels = [20, 40, 60, 80, 100]

  return (
    <section className="radar-card" aria-labelledby={`${id}-heading`}>
      <div className="radar-card-heading">
        <h3 id={`${id}-heading`}>{title}</h3>
        <span>最大値 100</span>
      </div>

      <svg
        className="radar-chart"
        viewBox="0 0 560 390"
        role="img"
        aria-labelledby={`${id}-title ${id}-description`}
      >
        <title id={`${id}-title`}>{title}</title>
        <desc id={`${id}-description`}>
          {series.length > 0
            ? `${series.map(({ label, type }) => label ?? type).join('、')}の基準値を重ねたレーダーチャート`
            : 'タイプが選択されていません'}
        </desc>

        <g className="radar-grid">
          {levels.map((level) => {
            const points = keys.map((_, index) =>
              getPoint(index, keys.length, (radius * level) / 100, center),
            )

            return (
              <polygon
                key={level}
                points={pointsAttribute(points)}
                className={level === 100 ? 'outer-ring' : undefined}
              />
            )
          })}

          {keys.map((key, index) => {
            const endpoint = getPoint(index, keys.length, radius, center)

            return (
              <line
                key={key}
                x1={center.x}
                y1={center.y}
                x2={endpoint.x}
                y2={endpoint.y}
              />
            )
          })}
        </g>

        {series.map(({ id: seriesId, label, type }) => {
          const values = getTypeReferenceValues(type)
          const points = keys.map((key, index) =>
            getPoint(
              index,
              keys.length,
              (radius * values[key]) / 100,
              center,
            ),
          )

          return (
            <g key={seriesId} className="radar-series">
              <polygon
                points={pointsAttribute(points)}
                fill={typeColors[type]}
                stroke={typeColors[type]}
              />
              {points.map((point, index) => (
                <circle
                  key={keys[index]}
                  cx={point.x}
                  cy={point.y}
                  r="3"
                  fill={typeColors[type]}
                >
                  <title>
                    {label ?? type}・{positioningLabels[keys[index]]}:{' '}
                    {values[keys[index]]}
                  </title>
                </circle>
              ))}
            </g>
          )
        })}

        {series.length === 0 && (
          <text className="radar-empty-label" x={center.x} y={center.y}>
            タイプを選択してください
          </text>
        )}

        <g className="radar-labels">
          {keys.map((key, index) => {
            const point = getPoint(index, keys.length, labelRadius, center)
            const horizontalDistance = point.x - center.x
            const textAnchor =
              Math.abs(horizontalDistance) < 8
                ? 'middle'
                : horizontalDistance > 0
                  ? 'start'
                  : 'end'

            return (
              <text
                key={key}
                x={point.x}
                y={point.y}
                textAnchor={textAnchor}
                dominantBaseline="middle"
              >
                {positioningLabels[key]}
              </text>
            )
          })}
        </g>
      </svg>
    </section>
  )
}

type TypeRadarChartsProps = {
  idPrefix: string
  series: TypeRadarSeries[]
}

export function TypeRadarCharts({ idPrefix, series }: TypeRadarChartsProps) {
  return (
    <>
      <div className="radar-chart-grid">
        <RadarChart
          id={`${idPrefix}-offense-radar`}
          title="攻撃系裏パラ"
          keys={offenseKeys}
          series={series}
        />
        <RadarChart
          id={`${idPrefix}-defense-radar`}
          title="守備系裏パラ"
          keys={defenseKeys}
          series={series}
        />
      </div>

      {series.length > 0 && (
        <div className="radar-legend" aria-label="チャートの凡例">
          {series.map(({ id, label, type }) => (
            <span key={id}>
              <i style={{ backgroundColor: typeColors[type] }} aria-hidden="true" />
              {label ?? type}
            </span>
          ))}
        </div>
      )}
    </>
  )
}
