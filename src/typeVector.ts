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
  primaryTypes: PlayerType[]
  secondaryTypes: PlayerType[]
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

function getBasePositioningValues(baseType: PlayerType) {
  if (baseType === 'バランス') {
    return Object.fromEntries(
      positioningKeys.map((key) => [key, BASE_POSITIONING_VALUE]),
    ) as Record<PositioningKey, number>
  }

  return getTypeReferenceValues(baseType)
}

export function calculateTypeVector(
  gains: PositioningGains,
  baseType: PlayerType = 'バランス',
): TypeVectorResult {
  const beforeValues = getBasePositioningValues(baseType)
  const afterValues = Object.fromEntries(
    positioningKeys.map((key) => [
      key,
      clampPositioningValue(beforeValues[key] + gains[key]),
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
  const highestValue = rankedEntries[0].value
  const primaryTypes =
    highestValue > 0
      ? rankedEntries
          .filter((entry) => entry.value === highestValue)
          .map((entry) => entry.type)
      : []
  const secondaryValue = rankedEntries.find(
    (entry) => entry.value > 0 && entry.value < highestValue,
  )?.value
  const secondaryTypes = secondaryValue
    ? rankedEntries
        .filter((entry) => entry.value === secondaryValue)
        .map((entry) => entry.type)
    : []
  const compositeThreshold = totalChange * 0.1
  const tendencyTypes =
    highestValue > 0
      ? rankedEntries
          .filter(
            (entry) =>
              entry.value > 0 &&
              (entry.value === highestValue ||
                highestValue - entry.value < compositeThreshold),
          )
          .map((entry) => entry.type)
      : []
  const isComposite = tendencyTypes.length > 1
  const tendencyLabel =
    tendencyTypes.length > 0
      ? tendencyTypes.join(' / ')
      : '明確なタイプ傾向なし'

  return {
    entries,
    rankedEntries,
    primaryTypes,
    secondaryTypes,
    isComposite,
    tendencyLabel,
    totalChange,
  }
}
