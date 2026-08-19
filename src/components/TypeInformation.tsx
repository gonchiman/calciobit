import { useState } from 'react'
import {
  getTypeReferenceValues,
  playerTypes,
  positioningKeys,
  type PlayerType,
  type PositioningKey,
} from '../typeEstimation'

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

const typeDescriptions: Record<PlayerType, string> = {
  バランス: '攻守のどちらにも偏らず、幅広い局面でチームに貢献するタイプ。',
  アタッカー: '縦方向へ迷わず進み、素早い攻撃を仕掛ける速攻型。',
  オールラウンド:
    '守備では相手をマンマークし、攻撃では味方のサポートに回るタイプ。',
  ストライカー:
    '相手のマークを外す動きに優れ、積極的にゴールを狙うタイプ。',
  リベロ:
    'ゾーンで守りながら、状況に応じて敵陣深くまで攻め上がるタイプ。',
  ストッパー:
    '強いプレッシングとマンマークで相手を抑え、シュートも体を張って防ぐタイプ。',
  スイーパー:
    'ゾーンを守りつつ、粘り強いプレッシングで危険を早めに取り除くタイプ。',
  ダイナモ:
    '攻守の切り替えが速く、ピッチの広い範囲を動き回るタイプ。',
  チャンスメーカー:
    'スペースを生み出し、フリーになる動きで攻撃の機会を作るタイプ。',
  バックアップ:
    '安定したゾーン守備を行い、危険な場面では味方のカバーにも入るタイプ。',
  マンマーカー:
    '狙った相手を厳しくマークしながら、パスのインターセプトも狙うタイプ。',
  レジスタ:
    'パスをつないで試合を組み立て、落ち着いた攻撃を志向するタイプ。',
}

const typeColors: Record<PlayerType, string> = {
  バランス: '#5f6b76',
  アタッカー: '#d33c32',
  オールラウンド: '#2f6fb3',
  ストライカー: '#e27a22',
  リベロ: '#26876a',
  ストッパー: '#8a4fa3',
  スイーパー: '#267b9c',
  ダイナモ: '#b58a13',
  チャンスメーカー: '#d14d82',
  バックアップ: '#537f2e',
  マンマーカー: '#775443',
  レジスタ: '#5862b0',
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
  selectedTypes: PlayerType[]
}

function RadarChart({ id, title, keys, selectedTypes }: RadarChartProps) {
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
          {selectedTypes.length > 0
            ? `${selectedTypes.join('、')}の基準値を重ねたレーダーチャート`
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

        {selectedTypes.map((type) => {
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
            <g key={type} className="radar-series">
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
                    {type}・{positioningLabels[keys[index]]}: {values[keys[index]]}
                  </title>
                </circle>
              ))}
            </g>
          )
        })}

        {selectedTypes.length === 0 && (
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

export function TypeInformation() {
  const [selectedTypes, setSelectedTypes] = useState<PlayerType[]>(['バランス'])

  const toggleType = (type: PlayerType) => {
    setSelectedTypes((current) =>
      current.includes(type)
        ? current.filter((selectedType) => selectedType !== type)
        : [...current, type],
    )
  }

  const selectTypeFromTable = (type: PlayerType) => {
    setSelectedTypes((current) =>
      current.includes(type) ? current : [...current, type],
    )
  }

  return (
    <section className="type-information-page" aria-labelledby="type-info-heading">
      <div className="section-heading type-info-heading">
        <div>
          <h2 id="type-info-heading">タイプ情報</h2>
          <p className="section-description">
            タイプごとのポジショニング基準値とプレーの特徴を比較できます。
          </p>
        </div>
        <div className="result-count">
          <strong>{selectedTypes.length}</strong>
          <span>タイプを比較</span>
        </div>
      </div>

      <div className="type-picker-header">
        <div>
          <h3>表示するタイプ</h3>
          <p>複数選ぶと、2つのチャートに重ねて表示します。</p>
        </div>
        <div className="type-picker-actions">
          <button type="button" onClick={() => setSelectedTypes([...playerTypes])}>
            すべて選択
          </button>
          <button type="button" onClick={() => setSelectedTypes([])}>
            選択を解除
          </button>
        </div>
      </div>

      <div className="type-picker" role="group" aria-label="表示するタイプ">
        {playerTypes.map((type, index) => {
          const isSelected = selectedTypes.includes(type)
          const descriptionId = `type-hover-description-${index}`

          return (
            <button
              type="button"
              key={type}
              className={isSelected ? 'selected' : undefined}
              aria-pressed={isSelected}
              aria-describedby={descriptionId}
              style={{ '--type-color': typeColors[type] } as React.CSSProperties}
              onClick={() => toggleType(type)}
            >
              <span className="type-color-swatch" aria-hidden="true" />
              <span>{type}</span>
              <span
                className="type-hover-description"
                id={descriptionId}
                role="tooltip"
              >
                <strong>{type}</strong>
                <span>{typeDescriptions[type]}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="radar-chart-grid">
        <RadarChart
          id="offense-radar"
          title="攻撃系裏パラ"
          keys={offenseKeys}
          selectedTypes={selectedTypes}
        />
        <RadarChart
          id="defense-radar"
          title="守備系裏パラ"
          keys={defenseKeys}
          selectedTypes={selectedTypes}
        />
      </div>

      {selectedTypes.length > 0 && (
        <div className="radar-legend" aria-label="チャートの凡例">
          {selectedTypes.map((type) => (
            <span key={type}>
              <i style={{ backgroundColor: typeColors[type] }} aria-hidden="true" />
              {type}
            </span>
          ))}
        </div>
      )}

      <section className="type-information-table-section" aria-labelledby="type-table-heading">
        <div className="subsection-heading">
          <div>
            <h3 id="type-table-heading">タイプ変更表</h3>
            <p>タイプ名をクリックすると、チャートへ追加します。</p>
          </div>
        </div>

        <div className="type-reference-table-shell">
          <table className="type-reference-table type-information-table">
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
                const values = getTypeReferenceValues(type)
                const isSelected = selectedTypes.includes(type)

                return (
                  <tr
                    key={type}
                    className={isSelected ? 'selected-type' : undefined}
                  >
                    <th scope="row">
                      <button
                        type="button"
                        style={{ '--type-color': typeColors[type] } as React.CSSProperties}
                        onClick={() => selectTypeFromTable(type)}
                      >
                        <span className="type-color-swatch" aria-hidden="true" />
                        {type}
                      </button>
                    </th>
                    {positioningKeys.map((key) => (
                      <td key={key}>{values[key]}</td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="type-reference-note">
          バランスは既存のタイプ変更表と同様、全12項目を20として表示しています。{' '}
          <a
            href="https://calciobit.com/parameter/type/"
            target="_blank"
            rel="noreferrer"
          >
            特徴の参照元
          </a>
        </p>
      </section>
    </section>
  )
}
