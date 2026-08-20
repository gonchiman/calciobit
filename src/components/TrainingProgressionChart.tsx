import { useMemo, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  getTrainingProgressionValue,
  trainingProgressionSeries,
  type TrainingProgressionRow,
  type TrainingProgressionSeriesKey,
} from '../trainingProgression'

const chartWidth = 1120
const chartHeight = 430
const chartMargin = { top: 24, right: 24, bottom: 42, left: 58 }
const plotWidth = chartWidth - chartMargin.left - chartMargin.right
const plotHeight = chartHeight - chartMargin.top - chartMargin.bottom

type HoveredPoint = {
  seriesKey: TrainingProgressionSeriesKey
  pointIndex: number
}

type TrainingProgressionChartProps = {
  rows: TrainingProgressionRow[]
}

function niceStep(range: number) {
  const roughStep = range / 5
  const magnitude = 10 ** Math.floor(Math.log10(roughStep || 1))
  const normalized = roughStep / magnitude
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10

  return factor * magnitude
}

function createPath(points: Array<{ x: number; y: number }>) {
  return points
    .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ')
}

export function TrainingProgressionChart({ rows }: TrainingProgressionChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint | null>(null)

  const chart = useMemo(() => {
    const series = trainingProgressionSeries.map((item) => ({
      ...item,
      values: rows.map((row) => getTrainingProgressionValue(row, item.key)),
    }))
    const allValues = series.flatMap(({ values }) => values)
    const rawMinimum = Math.min(0, ...allValues)
    const rawMaximum = Math.max(0, ...allValues)
    const step = niceStep(Math.max(1, rawMaximum - rawMinimum))
    const minimum = Math.floor(rawMinimum / step) * step
    const maximum = Math.max(
      minimum + step,
      Math.ceil(rawMaximum / step) * step,
    )
    const yTicks = Array.from(
      { length: Math.round((maximum - minimum) / step) + 1 },
      (_, index) => minimum + step * index,
    )
    const xTickInterval = Math.max(1, Math.ceil(rows.length / 10))
    const xTickIndexes = rows
      .map((_, index) => index)
      .filter(
        (index) =>
          index === 0 || index === rows.length - 1 || index % xTickInterval === 0,
      )

    const getX = (index: number) =>
      rows.length === 1
        ? chartMargin.left + plotWidth / 2
        : chartMargin.left + (index / (rows.length - 1)) * plotWidth
    const getY = (value: number) =>
      chartMargin.top + ((maximum - value) / (maximum - minimum)) * plotHeight

    return {
      getX,
      getY,
      maximum,
      minimum,
      series: series.map((item) => ({
        ...item,
        points: item.values.map((value, index) => ({
          x: getX(index),
          y: getY(value),
        })),
      })),
      xTickIndexes,
      yTicks,
    }
  }, [rows])

  const activeSeries = hoveredPoint
    ? chart.series.find(({ key }) => key === hoveredPoint.seriesKey) ?? null
    : null
  const activeRow = hoveredPoint ? rows[hoveredPoint.pointIndex] : null
  const activePoint = activeSeries && hoveredPoint
    ? activeSeries.points[hoveredPoint.pointIndex]
    : null
  const tooltipWidth = 210
  const tooltipHeight = 52
  const tooltipX = activePoint
    ? activePoint.x > chartWidth - tooltipWidth - 24
      ? activePoint.x - tooltipWidth - 12
      : activePoint.x + 12
    : 0
  const tooltipY = activePoint
    ? Math.min(
        chartHeight - tooltipHeight - 8,
        Math.max(8, activePoint.y - tooltipHeight / 2),
      )
    : 0

  const handlePointerMove = (event: ReactPointerEvent<SVGRectElement>) => {
    const svg = event.currentTarget.ownerSVGElement
    if (!svg) return

    const bounds = svg.getBoundingClientRect()
    const pointerX = ((event.clientX - bounds.left) / bounds.width) * chartWidth
    const pointerY = ((event.clientY - bounds.top) / bounds.height) * chartHeight
    const ratio = Math.min(
      1,
      Math.max(0, (pointerX - chartMargin.left) / plotWidth),
    )
    const pointIndex =
      rows.length === 1 ? 0 : Math.round(ratio * (rows.length - 1))
    const nearestSeries = chart.series.reduce((nearest, series) => {
      const distance = Math.abs(series.points[pointIndex].y - pointerY)

      return distance < nearest.distance
        ? { key: series.key, distance }
        : nearest
    }, {
      key: chart.series[0].key,
      distance: Number.POSITIVE_INFINITY,
    })

    setHoveredPoint({ seriesKey: nearestSeries.key, pointIndex })
  }

  const showSeriesEndpoint = (seriesKey: TrainingProgressionSeriesKey) => {
    setHoveredPoint({ seriesKey, pointIndex: rows.length - 1 })
  }

  return (
    <section
      className="training-progression-chart-card"
      aria-labelledby="training-progression-chart-heading"
    >
      <div className="training-progression-chart-heading">
        <div>
          <h4 id="training-progression-chart-heading">裏パラ推移グラフ</h4>
          <p>グラフまたは凡例にカーソルを合わせると、線の項目名と値を表示します。</p>
        </div>
        <span>横軸：実行回数</span>
      </div>

      <div className="training-progression-chart-scroll">
        <svg
          className="training-progression-chart"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          role="img"
          aria-labelledby="training-progression-chart-title training-progression-chart-description"
        >
          <title id="training-progression-chart-title">裏パラ推移グラフ</title>
          <desc id="training-progression-chart-description">
            14項目の裏パラを実行回数ごとに重ねた折れ線グラフです。
          </desc>

          <g className="training-line-grid">
            {chart.yTicks.map((tick) => {
              const y = chart.getY(tick)

              return (
                <g className="training-line-y-tick" key={tick}>
                  <line
                    x1={chartMargin.left}
                    y1={y}
                    x2={chartWidth - chartMargin.right}
                    y2={y}
                  />
                  <text x={chartMargin.left - 10} y={y}>
                    {tick}
                  </text>
                </g>
              )
            })}

            {chart.xTickIndexes.map((index) => {
              const x = chart.getX(index)

              return (
                <g className="training-line-x-tick" key={rows[index].count}>
                  <line
                    x1={x}
                    y1={chartMargin.top}
                    x2={x}
                    y2={chartHeight - chartMargin.bottom}
                  />
                  <text x={x} y={chartHeight - chartMargin.bottom + 22}>
                    {rows[index].count}
                  </text>
                </g>
              )
            })}
          </g>

          <line
            className="training-line-axis"
            x1={chartMargin.left}
            y1={chartHeight - chartMargin.bottom}
            x2={chartWidth - chartMargin.right}
            y2={chartHeight - chartMargin.bottom}
          />
          <line
            className="training-line-axis"
            x1={chartMargin.left}
            y1={chartMargin.top}
            x2={chartMargin.left}
            y2={chartHeight - chartMargin.bottom}
          />

          <g className="training-line-series">
            {chart.series.map((series) => {
              const isActive = hoveredPoint?.seriesKey === series.key
              const isDimmed = hoveredPoint !== null && !isActive

              return (
                <g key={series.key}>
                  <path
                    className={`${isActive ? 'is-active' : ''}${isDimmed ? ' is-dimmed' : ''}`}
                    d={createPath(series.points)}
                    stroke={series.color}
                    strokeDasharray={series.dashed ? '8 5' : undefined}
                  />
                  {rows.length === 1 && (
                    <circle
                      className="training-line-single-point"
                      cx={series.points[0].x}
                      cy={series.points[0].y}
                      r={isActive ? 4 : 3}
                      fill={series.color}
                      opacity={isDimmed ? 0.12 : 1}
                    />
                  )}
                </g>
              )
            })}
          </g>

          {activeSeries && activeRow && activePoint && (
            <g className="training-line-hover">
              <line
                x1={activePoint.x}
                y1={chartMargin.top}
                x2={activePoint.x}
                y2={chartHeight - chartMargin.bottom}
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="5"
                fill={activeSeries.color}
              />
              <g transform={`translate(${tooltipX} ${tooltipY})`}>
                <rect
                  width={tooltipWidth}
                  height={tooltipHeight}
                  stroke={activeSeries.color}
                />
                <text className="training-line-tooltip-title" x="10" y="20">
                  {activeSeries.label}
                </text>
                <text x="10" y="39">
                  {activeRow.count}回：
                  {getTrainingProgressionValue(activeRow, activeSeries.key)}
                </text>
              </g>
            </g>
          )}

          <rect
            className="training-line-hit-area"
            x={chartMargin.left}
            y={chartMargin.top}
            width={plotWidth}
            height={plotHeight}
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoveredPoint(null)}
          />
        </svg>
      </div>

      <ul className="training-line-legend" aria-label="折れ線グラフの凡例">
        {chart.series.map((series) => {
          const isActive = hoveredPoint?.seriesKey === series.key

          return (
            <li
              key={series.key}
              className={isActive ? 'is-active' : undefined}
              tabIndex={0}
              onPointerEnter={() => showSeriesEndpoint(series.key)}
              onPointerLeave={() => setHoveredPoint(null)}
              onFocus={() => showSeriesEndpoint(series.key)}
              onBlur={() => setHoveredPoint(null)}
            >
              <i
                style={{
                  borderColor: series.color,
                  borderStyle: series.dashed ? 'dashed' : 'solid',
                }}
                aria-hidden="true"
              />
              {series.label}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
