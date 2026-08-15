import { useMemo, useState } from 'react'
import {
  predictHiddenParameters,
  type HiddenParameterPrediction as PredictionResult,
} from '../hiddenParameterPrediction'
import {
  estimatableTypes,
  type EstimatableType,
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
  high: '高い',
  medium: '中程度',
  low: '低い',
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
  const [beforeType, setBeforeType] = useState<EstimatableType | ''>('')
  const [afterType, setAfterType] = useState<EstimatableType | ''>('')
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
            特訓前後のタイプと実行した特訓から、最大値100換算のポジショニング構成を逆算します。
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
                setBeforeType(event.target.value as EstimatableType | '')
              }
            >
              <option value="">選択してください</option>
              {estimatableTypes.map((type) => (
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
                setAfterType(event.target.value as EstimatableType | '')
              }
            >
              <option value="">選択してください</option>
              {estimatableTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="prediction-balance-note">
          ※バランスは基準値がないため予測対象外
        </p>

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
            指定された判定仕様どおり、12項目の最大値が100になるように換算し、11タイプの基準値との差の絶対値合計が最小になるタイプを判定します。特訓前後の判定を同時に満たす候補から、基準値に最も近い構成を「予測値」としています。
          </p>
          <p>
            表示値は特訓前の最大値を100とした判定用の換算値で、ゲーム内部の絶対値ではありません。同じタイプになる組み合わせは複数あるため、「推定幅」も併記します。バランスとクオリティ2項目はタイプから判定できません。
          </p>
          <p>
            <a
              href="https://docs.google.com/document/d/1Iw6IkM2GaSNHSlH5mCg2TnpQ4SVq41CRmv0fXT97X-I/edit?tab=t.0"
              target="_blank"
              rel="noreferrer"
            >
              タイプの判定仕様
            </a>
          </p>
        </div>
      </details>
    </section>
  )
}

type PredictionOutputProps = {
  beforeType: EstimatableType
  afterType: EstimatableType
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
          候補の収束度 {confidenceLabels[prediction.confidence]}
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
                    <th scope="col">特訓の増減</th>
                    <th scope="col">特訓後換算</th>
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
        ※特訓前の最大値を100とした判定用換算値です。特訓後は増減を適用してから再び最大値100に換算しています。ゲーム内部の絶対値を確定するものではありません。
      </p>
    </div>
  )
}
