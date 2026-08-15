import { useEffect } from 'react'
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
      </section>
    </div>
  )
}
