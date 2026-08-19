import type { SpecialMenu } from './types'
import {
  getTypeReferenceValues,
  playerTypes,
  positioningKeys,
  type PlayerType,
  type PositioningKey,
} from './typeEstimation'

const BASE_POSITIONING_VALUE = 30
const MIN_POSITIONING_VALUE = 0
const MAX_POSITIONING_VALUE = 100

export type TypeVectorEntry = {
  type: PlayerType
  value: number
}

export type TypeVectorResult = {
  entries: TypeVectorEntry[]
  rankedEntries: TypeVectorEntry[]
  primaryType: PlayerType | null
  secondaryType: PlayerType | null
  isComposite: boolean
  tendencyLabel: string
  totalChange: number
}

type PositioningGains = Pick<SpecialMenu, PositioningKey>

function clampPositioningValue(value: number) {
  return Math.min(
    MAX_POSITIONING_VALUE,
    Math.max(MIN_POSITIONING_VALUE, value),
  )
}

function getDistance(
  values: Record<PositioningKey, number>,
  type: PlayerType,
) {
  const referenceValues = getTypeReferenceValues(type)

  return positioningKeys.reduce(
    (sum, key) => sum + Math.abs(values[key] - referenceValues[key]),
    0,
  )
}

export function calculateTypeVector(gains: PositioningGains): TypeVectorResult {
  const beforeValues = Object.fromEntries(
    positioningKeys.map((key) => [key, BASE_POSITIONING_VALUE]),
  ) as Record<PositioningKey, number>
  const afterValues = Object.fromEntries(
    positioningKeys.map((key) => [
      key,
      clampPositioningValue(BASE_POSITIONING_VALUE + gains[key]),
    ]),
  ) as Record<PositioningKey, number>

  const entries = playerTypes.map((type) => ({
    type,
    value: getDistance(beforeValues, type) - getDistance(afterValues, type),
  }))
  const rankedEntries = [...entries].sort(
    (first, second) => second.value - first.value,
  )
  const totalChange = positioningKeys.reduce(
    (sum, key) => sum + Math.abs(gains[key]),
    0,
  )
  const primaryType =
    rankedEntries[0].value > 0 ? rankedEntries[0].type : null
  const secondaryType =
    primaryType && rankedEntries[1].value > 0 ? rankedEntries[1].type : null
  const isComposite = Boolean(
    primaryType &&
      secondaryType &&
      rankedEntries[0].value - rankedEntries[1].value < totalChange * 0.1,
  )
  const tendencyLabel = primaryType
    ? isComposite && secondaryType
      ? `${primaryType} / ${secondaryType}`
      : primaryType
    : '明確なタイプ傾向なし'

  return {
    entries,
    rankedEntries,
    primaryType,
    secondaryType,
    isComposite,
    tendencyLabel,
    totalChange,
  }
}
