import {
  getTypeReferenceValues,
  playerTypes,
  type PlayerType,
  type PositioningKey,
} from './typeEstimation'

export type TypeReferenceSort = {
  key: PositioningKey | null
  direction: 'asc' | 'desc'
}

export const defaultTypeReferenceSort: TypeReferenceSort = {
  key: null,
  direction: 'desc',
}

export function toggleTypeReferenceSort(
  current: TypeReferenceSort,
  key: PositioningKey,
): TypeReferenceSort {
  if (current.key !== key) {
    return { key, direction: 'desc' }
  }

  return {
    key,
    direction: current.direction === 'desc' ? 'asc' : 'desc',
  }
}

export function sortTypeReferences(sort: TypeReferenceSort): PlayerType[] {
  if (sort.key === null) return [...playerTypes]

  const key = sort.key
  const directionMultiplier = sort.direction === 'asc' ? 1 : -1

  return [...playerTypes].sort((first, second) => {
    const firstValue = getTypeReferenceValues(first)[key]
    const secondValue = getTypeReferenceValues(second)[key]
    const valueDifference = (firstValue - secondValue) * directionMultiplier

    if (valueDifference !== 0) return valueDifference

    return playerTypes.indexOf(first) - playerTypes.indexOf(second)
  })
}
