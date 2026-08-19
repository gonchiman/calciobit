import { useMemo, useState } from 'react'
import {
  getTypeReferenceValues,
  playerTypes,
  positioningKeys,
  type PlayerType,
  type PositioningKey,
} from '../typeEstimation'
import {
  defaultTypeReferenceSort,
  sortTypeReferences,
  toggleTypeReferenceSort,
  type TypeReferenceSort,
} from '../typeReferenceSorting'
import { typeColors } from '../typeColors'
import { TypeRadarCharts } from './TypeRadarCharts'

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


export function TypeInformation() {
  const [selectedTypes, setSelectedTypes] = useState<PlayerType[]>([])
  const [tableSort, setTableSort] = useState<TypeReferenceSort>(
    defaultTypeReferenceSort,
  )
  const sortedTableTypes = useMemo(
    () => sortTypeReferences(tableSort),
    [tableSort],
  )

  const toggleType = (type: PlayerType) => {
    setSelectedTypes((current) =>
      current.includes(type)
        ? current.filter((selectedType) => selectedType !== type)
        : [...current, type],
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

      <TypeRadarCharts
        idPrefix="type-information"
        series={selectedTypes.map((type) => ({ id: type, type }))}
      />

      <section className="type-information-table-section" aria-labelledby="type-table-heading">
        <div className="subsection-heading">
          <div>
            <h3 id="type-table-heading">タイプ変更表</h3>
            <p>タイプ名をクリックすると、チャート表示を切り替えます。</p>
          </div>
        </div>

        <div className="type-reference-table-shell">
          <table className="type-reference-table type-information-table">
            <thead>
              <tr>
                <th scope="col">
                  <button
                    type="button"
                    className="type-reference-sort-button"
                    aria-label="タイプを初期順に戻す"
                    onClick={() => setTableSort(defaultTypeReferenceSort)}
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
                      tableSort.key === key
                        ? tableSort.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <button
                      type="button"
                      className="type-reference-sort-button"
                      aria-label={`${positioningLabels[key]}を${
                        tableSort.key === key && tableSort.direction === 'desc'
                          ? '小さい順'
                          : '大きい順'
                      }に並べ替える`}
                      onClick={() =>
                        setTableSort((current) =>
                          toggleTypeReferenceSort(current, key),
                        )
                      }
                    >
                      <span>{positioningLabels[key]}</span>
                      <span className="sort-indicator" aria-hidden="true">
                        {tableSort.key === key
                          ? tableSort.direction === 'asc'
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
              {sortedTableTypes.map((type) => {
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
                        aria-pressed={isSelected}
                        onClick={() => toggleType(type)}
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
