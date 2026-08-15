export const playerTypes = [
  'バランス',
  'アタッカー',
  'オールラウンド',
  'ストライカー',
  'リベロ',
  'ストッパー',
  'スイーパー',
  'ダイナモ',
  'チャンスメーカー',
  'バックアップ',
  'マンマーカー',
  'レジスタ',
] as const

export type PlayerType = (typeof playerTypes)[number]

export const positioningKeys = [
  'zoneMarking',
  'manMarking',
  'pressing',
  'shootCut',
  'intercept',
  'support',
  'triangle',
  'loseMark',
  'overlap',
  'diagonalRun',
  'spaceRun',
  'goalFront',
] as const

export type PositioningKey = (typeof positioningKeys)[number]
type EstimatableType = Exclude<PlayerType, 'バランス'>

// GBA版のタイプ別ポジショニング基準値。配列順はpositioningKeysに対応する。
const typeProfiles: Record<EstimatableType, readonly number[]> = {
  ダイナモ: [80, 0, 50, 20, 10, 40, 10, 50, 80, 0, 50, 50],
  オールラウンド: [0, 70, 30, 30, 30, 100, 45, 20, 45, 0, 45, 0],
  リベロ: [90, 0, 45, 0, 45, 20, 60, 10, 20, 50, 0, 70],
  ストッパー: [0, 90, 80, 60, 50, 25, 50, 25, 25, 10, 20, 10],
  バックアップ: [95, 0, 70, 70, 70, 15, 15, 20, 15, 25, 30, 50],
  マンマーカー: [15, 90, 50, 40, 100, 15, 0, 50, 10, 40, 40, 25],
  スイーパー: [45, 0, 100, 30, 70, 5, 50, 30, 20, 0, 20, 20],
  レジスタ: [15, 50, 25, 15, 15, 100, 100, 40, 60, 50, 15, 30],
  アタッカー: [45, 0, 5, 20, 25, 5, 70, 15, 100, 10, 90, 70],
  チャンスメーカー: [15, 40, 30, 20, 5, 45, 45, 90, 30, 80, 40, 70],
  ストライカー: [10, 20, 20, 10, 40, 5, 10, 100, 10, 90, 90, 100],
}

const estimatableTypes = playerTypes.filter(
  (type): type is EstimatableType => type !== 'バランス',
)

export function getTypeReferenceValues(type: PlayerType) {
  const profile =
    type === 'バランス'
      ? positioningKeys.map(() => 20)
      : typeProfiles[type]

  return Object.fromEntries(
    positioningKeys.map((key, index) => [key, profile[index]]),
  ) as Record<PositioningKey, number>
}

function getBaseProfile(type: PlayerType) {
  const referenceValues = getTypeReferenceValues(type)

  return positioningKeys.map((key) => referenceValues[key])
}

export function getCurrentPositioningValues(type: PlayerType) {
  const profile = getBaseProfile(type)

  return Object.fromEntries(
    positioningKeys.map((key, index) => [key, profile[index]]),
  ) as Record<PositioningKey, number>
}

export function estimatePlayerType(
  currentType: PlayerType,
  gains: Record<PositioningKey, number>,
  hasTraining: boolean,
) {
  if (!hasTraining) return currentType

  const currentValues = getCurrentPositioningValues(currentType)
  const adjustedValues = positioningKeys.map((key) =>
    Math.max(0, currentValues[key] + gains[key]),
  )
  const maximum = Math.max(...adjustedValues)

  if (maximum <= 0) return currentType

  const normalizedValues = adjustedValues.map((value) =>
    (value / maximum) * 100,
  )

  return estimatableTypes.reduce(
    (closest, type) => {
      const distance = typeProfiles[type].reduce(
        (sum, referenceValue, index) =>
          sum + Math.abs(referenceValue - normalizedValues[index]),
        0,
      )

      return distance < closest.distance ? { type, distance } : closest
    },
    { type: estimatableTypes[0], distance: Number.POSITIVE_INFINITY },
  ).type
}
