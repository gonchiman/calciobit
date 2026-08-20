import type { PlayerType, PositioningKey } from './typeEstimation'

export const offensePositioningKeys: PositioningKey[] = [
  'support',
  'triangle',
  'loseMark',
  'overlap',
  'diagonalRun',
  'spaceRun',
  'goalFront',
]

export const defensePositioningKeys: PositioningKey[] = [
  'zoneMarking',
  'manMarking',
  'pressing',
  'shootCut',
  'intercept',
]

export const positioningLabels: Record<PositioningKey, string> = {
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

export type TrainingProgressionRow = {
  count: number
  type: PlayerType
  values: Record<PositioningKey, number>
  offenseQualityChange: number
  defenseQualityChange: number
}

export type TrainingProgressionSeriesKey =
  | PositioningKey
  | 'offenseQualityChange'
  | 'defenseQualityChange'

export type TrainingProgressionSeries = {
  key: TrainingProgressionSeriesKey
  label: string
  color: string
  dashed?: boolean
}

export const trainingProgressionSeries: TrainingProgressionSeries[] = [
  {
    key: 'offenseQualityChange',
    label: 'オフェンスQ（累積変化）',
    color: '#A53A2A',
    dashed: true,
  },
  { key: 'support', label: positioningLabels.support, color: '#E45756' },
  { key: 'triangle', label: positioningLabels.triangle, color: '#F58518' },
  { key: 'loseMark', label: positioningLabels.loseMark, color: '#C99A0C' },
  { key: 'overlap', label: positioningLabels.overlap, color: '#54A24B' },
  { key: 'diagonalRun', label: positioningLabels.diagonalRun, color: '#2A9D8F' },
  { key: 'spaceRun', label: positioningLabels.spaceRun, color: '#4C78A8' },
  { key: 'goalFront', label: positioningLabels.goalFront, color: '#7B61A8' },
  {
    key: 'defenseQualityChange',
    label: 'ディフェンスQ（累積変化）',
    color: '#304C89',
    dashed: true,
  },
  { key: 'zoneMarking', label: positioningLabels.zoneMarking, color: '#5B8FF9' },
  { key: 'manMarking', label: positioningLabels.manMarking, color: '#2F6690' },
  { key: 'pressing', label: positioningLabels.pressing, color: '#6F4E7C' },
  { key: 'shootCut', label: positioningLabels.shootCut, color: '#B279A2' },
  { key: 'intercept', label: positioningLabels.intercept, color: '#65727A' },
]

export function getTrainingProgressionValue(
  row: TrainingProgressionRow,
  key: TrainingProgressionSeriesKey,
) {
  if (key === 'offenseQualityChange') return row.offenseQualityChange
  if (key === 'defenseQualityChange') return row.defenseQualityChange
  return row.values[key]
}
