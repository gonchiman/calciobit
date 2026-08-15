import {
  classifyPositioningValues,
  getTypeDistance,
  getTypeReferenceValues,
  normalizePositioningValues,
  positioningKeys,
  type EstimatableType,
  type PositioningKey,
} from './typeEstimation'
import type { SpecialMenu } from './types'

const NORMALIZED_MAXIMUM = 100
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

function valuesToArray(values: Values) {
  return positioningKeys.map((key) => values[key])
}

function normalizeCandidate(values: readonly number[]): Values {
  const nonNegativeValues = values.map((value) => Math.max(0, value))
  const maximum = Math.max(...nonNegativeValues)

  if (maximum <= 0) {
    return Object.fromEntries(positioningKeys.map((key) => [key, 0])) as Values
  }

  return Object.fromEntries(
    positioningKeys.map((key, index) => [
      key,
      Math.round((nonNegativeValues[index] / maximum) * NORMALIZED_MAXIMUM),
    ]),
  ) as Values
}

function applyGains(values: Values, gains: Values) {
  return Object.fromEntries(
    positioningKeys.map((key) => [
      key,
      Math.max(0, values[key] + gains[key]),
    ]),
  ) as Values
}

function createCandidate(
  beforeValues: readonly number[],
  gains: Values,
  beforeType: EstimatableType,
  afterType: EstimatableType,
): Candidate {
  const before = normalizeCandidate(beforeValues)
  const afterWithGains = applyGains(before, gains)
  const after = normalizePositioningValues(afterWithGains)
  const beforeMatches = classifyPositioningValues(before) === beforeType
  const afterMatches = classifyPositioningValues(after) === afterType
  const matchesTransition = beforeMatches && afterMatches

  return {
    before,
    after,
    score:
      getTypeDistance(before, beforeType) +
      getTypeDistance(after, afterType) +
      (beforeMatches ? 0 : 1_000) +
      (afterMatches ? 0 : 1_000),
    matchesTransition,
  }
}

function improveCandidate(
  seed: Candidate,
  gains: Values,
  beforeType: EstimatableType,
  afterType: EstimatableType,
) {
  let best = seed

  SEARCH_STEPS.forEach((step) => {
    positioningKeys.forEach((key) => {
      const current = valuesToArray(best.before)
      const index = positioningKeys.indexOf(key)

      const changes = [-step, step]

      changes.forEach((change) => {
        const next = [...current]
        next[index] += change
        const candidate = createCandidate(
          next,
          gains,
          beforeType,
          afterType,
        )

        if (candidate.score < best.score) best = candidate
      })
    })
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
  beforeType: EstimatableType,
  afterType: EstimatableType,
) {
  const matchingSeeds = seeds.filter((candidate) => candidate.matchesTransition)
  if (matchingSeeds.length === 0) return []

  const bestScore = Math.min(...matchingSeeds.map((candidate) => candidate.score))
  const accepted = matchingSeeds.filter(
    (candidate) => candidate.score <= bestScore + 35,
  )
  const random = makeRandom(
    beforeType.length * 97 + afterType.length * 193 + gains.support * 389,
  )
  let current = accepted[0]

  for (let attempt = 0; attempt < 4_000; attempt += 1) {
    if (attempt % 120 === 0) {
      current = accepted[Math.floor(random() * accepted.length)] ?? accepted[0]
    }

    const nextValues = valuesToArray(current.before)
    const index = Math.floor(random() * positioningKeys.length)
    nextValues[index] += Math.floor(random() * 13) - 6
    const candidate = createCandidate(
      nextValues,
      gains,
      beforeType,
      afterType,
    )

    if (candidate.matchesTransition && candidate.score <= bestScore + 35) {
      accepted.push(candidate)
      current = candidate
    }
  }

  return accepted
}

export function predictHiddenParameters(
  beforeType: EstimatableType,
  afterType: EstimatableType,
  menu: SpecialMenu,
): HiddenParameterPrediction {
  const beforeProfile = getTypeReferenceValues(beforeType)
  const afterProfile = getTypeReferenceValues(afterType)
  const beforeProfileValues = valuesToArray(beforeProfile)
  const afterProfileValues = valuesToArray(afterProfile)
  const gains = Object.fromEntries(
    positioningKeys.map((key) => [key, menu[key]]),
  ) as Values
  const initialCandidates: Candidate[] = []

  for (let blendIndex = 0; blendIndex <= 100; blendIndex += 1) {
    const blend = blendIndex / 100

    const gainWeights = [0, 0.5, 1]

    gainWeights.forEach((gainWeight) => {
      const beforeValues = positioningKeys.map((key, index) => {
        const blendedProfile =
          beforeProfileValues[index] * (1 - blend) +
          afterProfileValues[index] * blend

        return blendedProfile - gains[key] * blend * gainWeight
      })

      initialCandidates.push(
        createCandidate(beforeValues, gains, beforeType, afterType),
      )
    })
  }

  const improvedCandidates = initialCandidates
    .sort((first, second) => first.score - second.score)
    .slice(0, 24)
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
  const candidates = matchesTransition
    ? matchingCandidates
    : allCandidates.slice(0, 1)
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
      after: Math.round(best.after[key]),
      afterMin: Math.floor(Math.min(...afterValues)),
      afterMax: Math.ceil(Math.max(...afterValues)),
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
