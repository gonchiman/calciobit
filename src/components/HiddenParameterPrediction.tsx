import { useMemo, useState } from 'react'
import {
  predictHiddenParameters,
  type HiddenParameterPrediction as PredictionResult,
} from '../hiddenParameterPrediction'
import {
  playerTypes,
  type PlayerType,
  type PositioningKey,
} from '../typeEstimation'
import type { SpecialMenu } from '../types'

const parameterGroups: Array<{
  label: string
  keys: PositioningKey[]
}> = [
  {
    label: '攻撃系ポジショニング',
    keys: [
      'support',
      'triangle',
      'loseMark',
      'overlap',
      'diagonalRun',
      'spaceRun',
      'goalFront',
    ],
  },
  {
    label: '守備系ポジショニング',
    keys: [
      'zoneMarking',
      'manMarking',
      'pressing',
      'shootCut',
      'intercept',
    ],
  },
]

const parameterLabels: Record<PositioningKey, string> = {
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

const confidenceLabels: Record<PredictionResult['confidence'], string> = {
  high: '高め',
  medium: '中程度',
  low: '低め',
}

function valueTone(value: number) {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'zero'
}

function formatGain(value: number) {
  return value > 0 ? `+${value}` : String(value)
}

function formatRange(minimum: number, maximum: number) {
  return minimum === maximum ? String(minimum) : `${minimum}〜${maximum}`
}

type HiddenParameterPredictionProps = {
  menus: SpecialMenu[]
}

export function HiddenParameterPrediction({
  menus,
}: HiddenParameterPredictionProps) {
  const [beforeType, setBeforeType] = useState<PlayerType | ''>('')
  const [afterType, setAfterType] = useState<PlayerType | ''>('')
  const [menuName, setMenuName] = useState('')
  const [query, setQuery] = useState('')

  const filteredMenus = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ja')

    return menus
      .filter(
        (menu) =>
          !normalizedQuery ||
          menu.name.toLocaleLowerCase('ja').includes(normalizedQuery) ||
          menu.cards.some((card) =>
            card.toLocaleLowerCase('ja').includes(normalizedQuery),
          ),
      )
      .sort((first, second) => first.name.localeCompare(second.name, 'ja'))
  }, [menus, query])

  const selectedMenu = useMemo(
    () => menus.find((menu) => menu.name === menuName) ?? null,
    [menuName, menus],
  )

  const prediction = useMemo(() => {
    if (!beforeType || !afterType || !selectedMenu || beforeType === afterType) {
      return null
    }

    return predictHiddenParameters(beforeType, afterType, selectedMenu)
  }, [afterType, beforeType, selectedMenu])

  const clearInputs = () => {
    setBeforeType('')
    setAfterType('')
    setMenuName('')
    setQuery('')
  }

  return (
    <section
      className="prediction-page"
      aria-labelledby="prediction-heading"
    >
      <div className="section-heading prediction-heading">
        <div>
          <h2 id="prediction-heading">裏パラ予測</h2>
          <p className="section-description">
            特訓前後のタイプと実行した特訓から、表示されないポジショニング値を逆算します。
          </p>
        </div>
      </div>

      <div className="prediction-input-panel">
        <div className="prediction-transition-fields">
          <label className="field">
            <span>特訓前のタイプ</span>
            <select
              value={beforeType}
              onChange={(event) =>
                setBeforeType(event.target.value as PlayerType | '')
              }
            >
              <option value="">選択してください</option>
              {playerTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <span className="prediction-arrow" aria-hidden="true">
            →
          </span>

          <label className="field">
            <span>特訓後のタイプ</span>
            <select
              value={afterType}
              onChange={(event) =>
                setAfterType(event.target.value as PlayerType | '')
              }
            >
              <option value="">選択してください</option>
              {playerTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="prediction-training-fields">
          <label className="field">
            <span>特訓を絞り込む</span>
            <input
              type="search"
              value={query}
              placeholder="特訓名・必要な課題"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <label className="field">
            <span>実行した特訓</span>
            <select
              value={menuName}
              onChange={(event) => setMenuName(event.target.value)}
            >
              <option value="">選択してください（{filteredMenus.length}件）</option>
              {filteredMenus.map((menu) => (
                <option key={menu.name} value={menu.name}>
                  {menu.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button className="reset-button" type="button" onClick={clearInputs}>
          入力をクリア
        </button>
      </div>

      {selectedMenu && (
        <div className="prediction-menu-summary">
          <div>
            <span>選択中の特訓</span>
            <strong>{selectedMenu.name}</strong>
            <small>{selectedMenu.cards.join(' + ')}</small>
          </div>
          <div>
            <span>クオリティ変化</span>
            <strong>
              攻撃 {formatGain(selectedMenu.offenseQuality)} / 守備{' '}
              {formatGain(selectedMenu.defenseQuality)}
            </strong>
            <small>タイプから現在値は推定できません</small>
          </div>
        </div>
      )}

      {beforeType && afterType && beforeType === afterType ? (
        <div className="prediction-message" role="status">
          <strong>異なるタイプを選択してください。</strong>
          <span>この機能は、特訓によってタイプが変わった記録を使って予測します。</span>
        </div>
      ) : prediction && beforeType && afterType && selectedMenu ? (
        <PredictionOutput
          beforeType={beforeType}
          afterType={afterType}
          menu={selectedMenu}
          prediction={prediction}
        />
      ) : (
        <div className="prediction-message">
          <strong>3つの情報を選ぶと予測結果を表示します。</strong>
          <span>特訓前タイプ・特訓後タイプ・実行した特訓を入力してください。</span>
        </div>
      )}

      <details className="prediction-method">
        <summary>予測値の見方と制約</summary>
        <div>
          <p>
            タイプは12項目の絶対値ではなく、最も高い項目を100とした割合の傾向で決まると仮定しています。特訓前後のタイプ判定を同時に満たす候補を探索し、その中で各タイプの基準傾向に最も近い値を「予測値」としています。
          </p>
          <p>
            同じタイプになる数値の組み合わせは複数あるため、実際の値を一意には特定できません。「推定幅」は条件に合う有力候補の範囲です。オフェンス／ディフェンスクオリティはタイプ判定に使われないため、変化量だけを表示します。
          </p>
        </div>
      </details>
    </section>
  )
}

type PredictionOutputProps = {
  beforeType: PlayerType
  afterType: PlayerType
  menu: SpecialMenu
  prediction: PredictionResult
}

function PredictionOutput({
  beforeType,
  afterType,
  menu,
  prediction,
}: PredictionOutputProps) {
  const parameterMap = new Map(
    prediction.parameters.map((parameter) => [parameter.key, parameter]),
  )

  return (
    <div className="prediction-output" aria-live="polite">
      <div className="subsection-heading prediction-output-heading">
        <div>
          <h3>予測結果</h3>
          <p>
            {beforeType} → {afterType} / {menu.name}
          </p>
        </div>
        <span className={`prediction-confidence ${prediction.confidence}`}>
          推定精度 {confidenceLabels[prediction.confidence]}
        </span>
      </div>

      {!prediction.matchesTransition && (
        <div className="prediction-warning" role="status">
          この組み合わせを基準モデルで再現できませんでした。予測値は近似値です。タイプの選択や特訓名を確認してください。
        </div>
      )}

      <div className="prediction-summary-grid">
        <div>
          <span>遷移の再現</span>
          <strong>{prediction.matchesTransition ? 'できた' : 'できなかった'}</strong>
        </div>
        <div>
          <span>有力候補</span>
          <strong>{prediction.candidateCount.toLocaleString('ja-JP')}通り</strong>
        </div>
        <div>
          <span>平均推定幅</span>
          <strong>±{(prediction.averageRange / 2).toFixed(1)}</strong>
        </div>
      </div>

      <div className="prediction-tables">
        {parameterGroups.map((group) => (
          <div className="prediction-table-group" key={group.label}>
            <h4>{group.label}</h4>
            <div className="prediction-table-shell">
              <table className="prediction-table">
                <thead>
                  <tr>
                    <th scope="col">項目</th>
                    <th scope="col">特訓前予測</th>
                    <th scope="col">推定幅</th>
                    <th scope="col">変化</th>
                    <th scope="col">特訓後予測</th>
                  </tr>
                </thead>
                <tbody>
                  {group.keys.map((key) => {
                    const parameter = parameterMap.get(key)
                    if (!parameter) return null

                    return (
                      <tr key={key}>
                        <th scope="row">{parameterLabels[key]}</th>
                        <td className="prediction-value">{parameter.before}</td>
                        <td className="prediction-range">
                          {formatRange(parameter.beforeMin, parameter.beforeMax)}
                        </td>
                        <td className={valueTone(parameter.gain)}>
                          {formatGain(parameter.gain)}
                        </td>
                        <td className="prediction-value">{parameter.after}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <p className="prediction-note">
        ※値は0〜100の推定スケールです。タイプから絶対値を確定できないため、予測値と推定幅をセットで確認してください。
      </p>
    </div>
  )
}
