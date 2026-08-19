import { useEffect, useState } from 'react'
import { playerTypes, type PlayerType } from '../typeEstimation'
import { calculateTypeVector } from '../typeVector'
import type { SpecialMenu } from '../types'

type MetricKey =
  | 'kick'
  | 'speed'
  | 'stamina'
  | 'technique'
  | 'physical'
  | 'jump'
  | 'mental'
  | 'offenseQuality'
  | 'support'
  | 'triangle'
  | 'loseMark'
  | 'overlap'
  | 'diagonalRun'
  | 'spaceRun'
  | 'goalFront'
  | 'defenseQuality'
  | 'zoneMarking'
  | 'manMarking'
  | 'pressing'
  | 'shootCut'
  | 'intercept'

type MetricGroup = {
  label: string
  metrics: Array<{ key: MetricKey; label: string }>
}

const basicMetrics: MetricGroup['metrics'] = [
  { key: 'kick', label: 'キック' },
  { key: 'speed', label: 'スピード' },
  { key: 'stamina', label: 'スタミナ' },
  { key: 'technique', label: 'テクニック' },
  { key: 'physical', label: 'フィジカル' },
  { key: 'jump', label: 'ジャンプ' },
  { key: 'mental', label: 'メンタル' },
]

const hiddenMetricGroups: MetricGroup[] = [
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

function valueTone(value: number) {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'zero'
}

function formatGain(value: number) {
  return value > 0 ? `+${value}` : String(value)
}

type TrainingDetailDialogProps = {
  menu: SpecialMenu
  onClose: () => void
}

export function TrainingDetailDialog({
  menu,
  onClose,
}: TrainingDetailDialogProps) {
  const [baseType, setBaseType] = useState<PlayerType>('バランス')
  const typeVector = calculateTypeVector(menu, baseType)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  return (
    <div
      className="training-detail-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="training-detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="training-detail-heading"
      >
        <header className="training-detail-header">
          <div>
            <h2 id="training-detail-heading">{menu.name}</h2>
            <p>{menu.cards.join(' / ')}</p>
          </div>
          <button
            type="button"
            className="training-detail-close"
            onClick={onClose}
            aria-label="特訓情報を閉じる"
            title="閉じる"
            autoFocus
          >
            ×
          </button>
        </header>

        <div className="training-detail-summary">
          <div>
            <span>必要な課題</span>
            <strong>{menu.cards.join(' / ')}</strong>
          </div>
          <div>
            <span>基本合計</span>
            <strong className={valueTone(menu.total)}>
              {formatGain(menu.total)}
            </strong>
          </div>
          <div>
            <span>疲労蓄積値</span>
            <strong>{menu.fatigue}</strong>
          </div>
        </div>

        <div className="training-detail-metrics">
          <div>
            <h3>基本パラメータ</h3>
            <table className="training-detail-table">
              <tbody>
                {basicMetrics.map((metric) => (
                  <tr key={metric.key}>
                    <th scope="row">{metric.label}</th>
                    <td className={valueTone(menu[metric.key])}>
                      {formatGain(menu[metric.key])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hiddenMetricGroups.map((group) => (
            <div key={group.label}>
              <h3>{group.label}</h3>
              <table className="training-detail-table">
                <tbody>
                  {group.metrics.map((metric) => (
                    <tr key={metric.key}>
                      <th scope="row">{metric.label}</th>
                      <td className={valueTone(menu[metric.key])}>
                        {formatGain(menu[metric.key])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <section
          className="training-type-vector"
          aria-labelledby="training-type-vector-heading"
        >
          <div className="training-type-vector-heading">
            <div>
              <h3 id="training-type-vector-heading">タイプベクトル</h3>
              <p>
                {baseType === 'バランス'
                  ? '初期裏パラをすべて30とした、特訓単体のタイプ傾向です。'
                  : `${baseType}の基準値を特訓前としたタイプ傾向です。`}
              </p>
            </div>
            <div className="training-type-vector-controls">
              <label>
                <span>前提タイプ</span>
                <select
                  value={baseType}
                  onChange={(event) =>
                    setBaseType(event.target.value as PlayerType)
                  }
                >
                  {playerTypes.map((type) => (
                    <option value={type} key={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <small>距離改善量方式</small>
            </div>
          </div>

          <div className="training-type-vector-summary">
            <div>
              <span>{typeVector.isComposite ? '複合傾向' : 'タイプ傾向'}</span>
              <strong>{typeVector.tendencyLabel}</strong>
            </div>
            <div>
              <span>
                {typeVector.primaryTypes.length > 1
                  ? '主タイプ（同率）'
                  : '主タイプ'}
              </span>
              <strong>
                {typeVector.primaryTypes.length > 0
                  ? typeVector.primaryTypes.join(' / ')
                  : 'なし'}
              </strong>
            </div>
            <div>
              <span>
                {typeVector.secondaryTypes.length > 1
                  ? '副タイプ（同率）'
                  : '副タイプ'}
              </span>
              <strong>
                {typeVector.secondaryTypes.length > 0
                  ? typeVector.secondaryTypes.join(' / ')
                  : 'なし'}
              </strong>
            </div>
            <div>
              <span>総変化量</span>
              <strong>{typeVector.totalChange}</strong>
            </div>
          </div>

          <div className="training-type-vector-grid">
            {typeVector.entries.map((entry) => {
              const isPrimary = typeVector.primaryTypes.includes(entry.type)
              const isSecondary = typeVector.secondaryTypes.includes(entry.type)

              return (
                <div
                  className={`training-type-vector-entry ${valueTone(entry.value)}`}
                  key={entry.type}
                >
                  <span>{entry.type}</span>
                  <strong>{formatGain(entry.value)}</strong>
                  {isPrimary && <small>主</small>}
                  {!isPrimary && isSecondary && <small>副</small>}
                </div>
              )
            })}
          </div>

          <p className="training-type-vector-note">
            正の値はそのタイプへ近づき、負の値は遠ざかる傾向を示します。実際の変化は選手の現在値によって異なります。
          </p>
        </section>
      </section>
    </div>
  )
}
