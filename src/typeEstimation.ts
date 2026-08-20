import {
  POSITIONING_KEYS,
  TYPE_TARGET_ORDER,
  TYPE_TARGETS,
} from './data/typeTargets'

export const playerTypes = TYPE_TARGET_ORDER

export type PlayerType = (typeof playerTypes)[number]

export const positioningKeys = POSITIONING_KEYS

export type PositioningKey = (typeof positioningKeys)[number]
export type EstimatableType = Exclude<PlayerType, 'バランス'>

export const estimatableTypes = playerTypes.filter(
  (type): type is EstimatableType => type !== 'バランス',
)

export function getTypeReferenceValues(type: PlayerType) {
  const profile = TYPE_TARGETS[type]

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

export function normalizePositioningValues(
  values: Record<PositioningKey, number>,
) {
  const maximum = Math.max(...positioningKeys.map((key) => values[key]))

  return Object.fromEntries(
    positioningKeys.map((key) => [
      key,
      maximum > 0 ? (values[key] / maximum) * 100 : 0,
    ]),
  ) as Record<PositioningKey, number>
}

export function getTypeDistance(
  values: Record<PositioningKey, number>,
  type: EstimatableType,
) {
  const normalizedValues = normalizePositioningValues(values)

  return getNormalizedTypeDistance(normalizedValues, type)
}

function getNormalizedTypeDistance(
  normalizedValues: Record<PositioningKey, number>,
  type: EstimatableType,
) {

  return positioningKeys.reduce(
    (sum, key, index) =>
      sum + Math.abs(TYPE_TARGETS[type][index] - normalizedValues[key]),
    0,
  )
}

export function classifyPositioningValues(
  values: Record<PositioningKey, number>,
) {
  const normalizedValues = normalizePositioningValues(values)

  return estimatableTypes.reduce(
    (closest, type) => {
      const distance = getNormalizedTypeDistance(normalizedValues, type)

      return distance < closest.distance ? { type, distance } : closest
    },
    {
      type: estimatableTypes[0],
      distance: Number.POSITIVE_INFINITY,
    },
  ).type
}

export function estimatePlayerType(
  currentType: PlayerType,
  gains: Record<PositioningKey, number>,
  hasTraining: boolean,
) {
  if (!hasTraining) return currentType

  const currentValues = getCurrentPositioningValues(currentType)
  const adjustedValues = Object.fromEntries(
    positioningKeys.map((key) => [
      key,
      Math.max(0, currentValues[key] + gains[key]),
    ]),
  ) as Record<PositioningKey, number>

  if (Math.max(...Object.values(adjustedValues)) <= 0) return currentType

  return classifyPositioningValues(adjustedValues)
}
