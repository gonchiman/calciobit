import {
  getTypeReferenceValues,
  playerTypes,
  positioningKeys,
  type PlayerType,
  type PositioningKey,
} from './typeEstimation'
import type { SpecialMenu } from './types'

const MIN_VALUE = 0
const MAX_VALUE = 100
const SEARCH_STEPS = [8, 4, 2, 1] as const

type Values = Record<PositioningKey, number>

type Candidate = {
  before: Values
  after: Values
  score: number
  matchesTransition: boolean
}

export type ParameterPrediction = {
  key: PositioningKey
  before: number
  beforeMin: number
  beforeMax: number
  gain: number
  after: number
  afterMin: number
  afterMax: number
}

export type HiddenParameterPrediction = {
  parameters: ParameterPrediction[]
  confidence: 'high' | 'medium' | 'low'
  matchesTransition: boolean
  averageRange: number
  candidateCount: number
}

function clamp(value: number) {
  return Math.min(MAX_VALUE, Math.max(MIN_VALUE, Math.round(value)))
}

function valuesFromArray(values: readonly number[]): Values {
  return Object.fromEntries(
    positioningKeys.map((key, index) => [key, clamp(values[index])]),
  ) as Values
}

function valuesToArray(values: Values) {
  return positioningKeys.map((key) => values[key])
}

function getNormalizedProfile(type: PlayerType) {
  const reference = getTypeReferenceValues(type)
  const values = valuesToArray(reference)
  const maximum = Math.max(...values)

  return values.map((value) => (maximum > 0 ? (value / maximum) * 100 : 0))
}

const normalizedTypeProfiles = Object.fromEntries(
  playerTypes.map((type) => [type, getNormalizedProfile(type)]),
) as Record<PlayerType, number[]>

function normalize(values: readonly number[]) {
  const maximum = Math.max(...values)

  return maximum > 0
    ? values.map((value) => (value / maximum) * 100)
    : values.map(() => 0)
}

function distanceToType(values: Values, type: PlayerType) {
  const normalizedValues = normalize(valuesToArray(values))
  const profile = normalizedTypeProfiles[type]

  return normalizedValues.reduce(
    (sum, value, index) => sum + Math.abs(value - profile[index]),
    0,
  )
}

function classify(values: Values) {
  return playerTypes.reduce(
    (closest, type) => {
      const distance = distanceToType(values, type)
      return distance < closest.distance ? { type, distance } : closest
    },
    { type: playerTypes[0] as PlayerType, distance: Number.POSITIVE_INFINITY },
  ).type
}

function applyGains(values: Values, gains: Values) {
  return Object.fromEntries(
    positioningKeys.map((key) => [key, clamp(values[key] + gains[key])]),
  ) as Values
}

function createCandidate(
  beforeValues: readonly number[],
  gains: Values,
  beforeType: PlayerType,
  afterType: PlayerType,
): Candidate {
  const before = valuesFromArray(beforeValues)
  const after = applyGains(before, gains)
  const matchesTransition =
    classify(before) === beforeType && classify(after) === afterType
  const mismatchPenalty = matchesTransition ? 0 : 2_000

  return {
    before,
    after,
    score:
      distanceToType(before, beforeType) +
      distanceToType(after, afterType) +
      mismatchPenalty,
    matchesTransition,
  }
}

function improveCandidate(
  seed: Candidate,
  gains: Values,
  beforeType: PlayerType,
  afterType: PlayerType,
) {
  let best = seed

  SEARCH_STEPS.forEach((step) => {
    for (let pass = 0; pass < 2; pass += 1) {
      positioningKeys.forEach((key) => {
        const current = valuesToArray(best.before)
        const index = positioningKeys.indexOf(key)

        const changes = [-step, step]

        changes.forEach((change) => {
          const next = [...current]
          next[index] = clamp(next[index] + change)
          const candidate = createCandidate(
            next,
            gains,
            beforeType,
            afterType,
          )

          if (candidate.score < best.score) best = candidate
        })
      })
    }
  })

  return best
}

function makeRandom(seed: number) {
  let state = seed >>> 0

  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0
    return state / 4_294_967_296
  }
}

function collectNearbyCandidates(
  seeds: Candidate[],
  gains: Values,
  beforeType: PlayerType,
  afterType: PlayerType,
) {
  const matchingSeeds = seeds.filter((candidate) => candidate.matchesTransition)
  if (matchingSeeds.length === 0) return []

  const bestScore = Math.min(...matchingSeeds.map((candidate) => candidate.score))
  const accepted = matchingSeeds.filter(
    (candidate) => candidate.score <= bestScore + 45,
  )
  const random = makeRandom(
    beforeType.length * 97 + afterType.length * 193 + gains.support * 389,
  )
  let current = accepted[0]

  for (let attempt = 0; attempt < 12_000; attempt += 1) {
    if (attempt % 120 === 0) {
      current = accepted[Math.floor(random() * accepted.length)] ?? accepted[0]
    }

    const nextValues = valuesToArray(current.before)
    const index = Math.floor(random() * positioningKeys.length)
    const change = Math.floor(random() * 13) - 6
    nextValues[index] = clamp(nextValues[index] + change)
    const candidate = createCandidate(
      nextValues,
      gains,
      beforeType,
      afterType,
    )

    if (
      candidate.matchesTransition &&
      candidate.score <= bestScore + 45
    ) {
      accepted.push(candidate)
      current = candidate
    }
  }

  return accepted
}

export function predictHiddenParameters(
  beforeType: PlayerType,
  afterType: PlayerType,
  menu: SpecialMenu,
): HiddenParameterPrediction {
  const beforeProfile = normalizedTypeProfiles[beforeType]
  const afterProfile = normalizedTypeProfiles[afterType]
  const gains = Object.fromEntries(
    positioningKeys.map((key) => [key, menu[key]]),
  ) as Values
  const initialCandidates: Candidate[] = []

  for (let scale = 6; scale <= MAX_VALUE; scale += 2) {
    for (let blendIndex = 0; blendIndex <= 50; blendIndex += 1) {
      const blend = blendIndex / 50
      const beforeValues = positioningKeys.map((key, index) => {
        const blendedProfile =
          beforeProfile[index] * (1 - blend) + afterProfile[index] * blend

        return (
          (blendedProfile * scale) / 100 -
          gains[key] * blend
        )
      })

      initialCandidates.push(
        createCandidate(beforeValues, gains, beforeType, afterType),
      )
    }
  }

  const improvedCandidates = initialCandidates
    .sort((first, second) => first.score - second.score)
    .slice(0, 32)
    .map((candidate) =>
      improveCandidate(candidate, gains, beforeType, afterType),
    )
  const allCandidates = [...initialCandidates, ...improvedCandidates].sort(
    (first, second) => first.score - second.score,
  )
  const matchingCandidates = collectNearbyCandidates(
    allCandidates,
    gains,
    beforeType,
    afterType,
  )
  const matchesTransition = matchingCandidates.length > 0
  const candidates = matchesTransition ? matchingCandidates : allCandidates.slice(0, 1)
  const best = candidates.reduce((closest, candidate) =>
    candidate.score < closest.score ? candidate : closest,
  )

  const parameters = positioningKeys.map((key): ParameterPrediction => {
    const beforeValues = candidates.map((candidate) => candidate.before[key])
    const afterValues = candidates.map((candidate) => candidate.after[key])

    return {
      key,
      before: best.before[key],
      beforeMin: Math.min(...beforeValues),
      beforeMax: Math.max(...beforeValues),
      gain: gains[key],
      after: best.after[key],
      afterMin: Math.min(...afterValues),
      afterMax: Math.max(...afterValues),
    }
  })
  const averageRange =
    parameters.reduce(
      (sum, parameter) => sum + parameter.beforeMax - parameter.beforeMin,
      0,
    ) / parameters.length
  const confidence = !matchesTransition
    ? 'low'
    : averageRange <= 10
      ? 'high'
      : averageRange <= 24
        ? 'medium'
        : 'low'

  return {
    parameters,
    confidence,
    matchesTransition,
    averageRange,
    candidateCount: matchingCandidates.length,
  }
}
