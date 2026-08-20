import { writeFile } from 'node:fs/promises'
import {
  POSITIONING_KEYS,
  TYPE_TARGET_ORDER,
  TYPE_TARGETS,
} from '../src/data/typeTargets.ts'

const typeNames = [...TYPE_TARGET_ORDER]
const dimensionCount = POSITIONING_KEYS.length
const pointCount = typeNames.length

function normalizeTargets() {
  const minimums = Array.from({ length: dimensionCount }, (_, dimension) =>
    Math.min(...typeNames.map((type) => TYPE_TARGETS[type][dimension])),
  )
  const maximums = Array.from({ length: dimensionCount }, (_, dimension) =>
    Math.max(...typeNames.map((type) => TYPE_TARGETS[type][dimension])),
  )

  return Object.fromEntries(
    typeNames.map((type) => [
      type,
      TYPE_TARGETS[type].map((value, dimension) => {
        const range = maximums[dimension] - minimums[dimension]
        return range > 0 ? (value - minimums[dimension]) / range : 0
      }),
    ]),
  )
}

function createDistanceMatrix(normalizedTargets) {
  return typeNames.map((firstType) =>
    typeNames.map((secondType) =>
      normalizedTargets[firstType].reduce(
        (distance, value, dimension) =>
          distance + Math.abs(value - normalizedTargets[secondType][dimension]),
        0,
      ),
    ),
  )
}

function createCenteredMatrix(distanceMatrix) {
  const squared = distanceMatrix.map((row) => row.map((value) => value ** 2))
  const rowMeans = squared.map(
    (row) => row.reduce((sum, value) => sum + value, 0) / pointCount,
  )
  const totalMean =
    rowMeans.reduce((sum, value) => sum + value, 0) / pointCount

  return squared.map((row, rowIndex) =>
    row.map(
      (value, columnIndex) =>
        -0.5 *
        (value - rowMeans[rowIndex] - rowMeans[columnIndex] + totalMean),
    ),
  )
}

function jacobiEigenDecomposition(matrix) {
  const values = matrix.map((row) => [...row])
  const vectors = Array.from({ length: pointCount }, (_, row) =>
    Array.from({ length: pointCount }, (_, column) =>
      row === column ? 1 : 0,
    ),
  )
  const tolerance = 1e-12
  const maximumIterations = pointCount ** 2 * 100

  for (let iteration = 0; iteration < maximumIterations; iteration += 1) {
    let firstIndex = 0
    let secondIndex = 1
    let maximum = 0

    for (let row = 0; row < pointCount; row += 1) {
      for (let column = row + 1; column < pointCount; column += 1) {
        const candidate = Math.abs(values[row][column])
        if (candidate > maximum) {
          maximum = candidate
          firstIndex = row
          secondIndex = column
        }
      }
    }

    if (maximum < tolerance) break

    const firstValue = values[firstIndex][firstIndex]
    const secondValue = values[secondIndex][secondIndex]
    const sharedValue = values[firstIndex][secondIndex]
    const angle = 0.5 * Math.atan2(
      2 * sharedValue,
      secondValue - firstValue,
    )
    const cosine = Math.cos(angle)
    const sine = Math.sin(angle)

    for (let index = 0; index < pointCount; index += 1) {
      if (index === firstIndex || index === secondIndex) continue

      const firstItem = values[index][firstIndex]
      const secondItem = values[index][secondIndex]
      const nextFirst = cosine * firstItem - sine * secondItem
      const nextSecond = sine * firstItem + cosine * secondItem

      values[index][firstIndex] = nextFirst
      values[firstIndex][index] = nextFirst
      values[index][secondIndex] = nextSecond
      values[secondIndex][index] = nextSecond
    }

    values[firstIndex][firstIndex] =
      cosine ** 2 * firstValue -
      2 * sine * cosine * sharedValue +
      sine ** 2 * secondValue
    values[secondIndex][secondIndex] =
      sine ** 2 * firstValue +
      2 * sine * cosine * sharedValue +
      cosine ** 2 * secondValue
    values[firstIndex][secondIndex] = 0
    values[secondIndex][firstIndex] = 0

    for (let index = 0; index < pointCount; index += 1) {
      const firstVector = vectors[index][firstIndex]
      const secondVector = vectors[index][secondIndex]
      vectors[index][firstIndex] = cosine * firstVector - sine * secondVector
      vectors[index][secondIndex] = sine * firstVector + cosine * secondVector
    }
  }

  return values
    .map((row, index) => ({
      value: row[index],
      vector: vectors.map((vectorRow) => vectorRow[index]),
    }))
    .sort((first, second) => second.value - first.value)
}

function createMdsCoordinates(distanceMatrix) {
  const components = jacobiEigenDecomposition(
    createCenteredMatrix(distanceMatrix),
  ).filter(({ value }) => value > 1e-10)

  if (components.length < 2) {
    throw new Error('MDSに必要な正の固有値を2つ取得できませんでした。')
  }

  return typeNames.map((_, index) => ({
    x: components[0].vector[index] * Math.sqrt(components[0].value),
    y: components[1].vector[index] * Math.sqrt(components[1].value),
  }))
}

function refineWithSmacof(distanceMatrix, initialCoordinates) {
  let coordinates = initialCoordinates.map((point) => ({ ...point }))
  let previousError = Number.POSITIVE_INFINITY

  for (let iteration = 0; iteration < 500; iteration += 1) {
    const bMatrix = Array.from({ length: pointCount }, () =>
      Array(pointCount).fill(0),
    )

    for (let first = 0; first < pointCount; first += 1) {
      for (let second = first + 1; second < pointCount; second += 1) {
        const mappedDistance = euclideanDistance(
          coordinates[first],
          coordinates[second],
        )
        const ratio =
          mappedDistance > 1e-12
            ? distanceMatrix[first][second] / mappedDistance
            : 0

        bMatrix[first][second] = -ratio
        bMatrix[second][first] = -ratio
        bMatrix[first][first] += ratio
        bMatrix[second][second] += ratio
      }
    }

    const nextCoordinates = coordinates.map((_, row) => ({
      x:
        bMatrix[row].reduce(
          (sum, value, column) => sum + value * coordinates[column].x,
          0,
        ) / pointCount,
      y:
        bMatrix[row].reduce(
          (sum, value, column) => sum + value * coordinates[column].y,
          0,
        ) / pointCount,
    }))
    const nextError = calculateRawSquaredError(
      distanceMatrix,
      nextCoordinates,
    )

    coordinates = nextCoordinates
    if (Math.abs(previousError - nextError) < 1e-12) break
    previousError = nextError
  }

  return coordinates
}

function fixDisplayDirection(coordinates) {
  const typeIndex = Object.fromEntries(
    typeNames.map((type, index) => [type, index]),
  )

  if (
    coordinates[typeIndex.アタッカー].x <
    coordinates[typeIndex.ストッパー].x
  ) {
    coordinates.forEach((point) => {
      point.x *= -1
    })
  }

  if (
    coordinates[typeIndex.チャンスメーカー].y <
    coordinates[typeIndex.スイーパー].y
  ) {
    coordinates.forEach((point) => {
      point.y *= -1
    })
  }

  return coordinates
}

function normalizeForDisplay(coordinates) {
  const minimumX = Math.min(...coordinates.map(({ x }) => x))
  const maximumX = Math.max(...coordinates.map(({ x }) => x))
  const minimumY = Math.min(...coordinates.map(({ y }) => y))
  const maximumY = Math.max(...coordinates.map(({ y }) => y))
  const padding = 8
  const displayRange = 100 - padding * 2

  return coordinates.map(({ x, y }) => ({
    x: padding + ((x - minimumX) / (maximumX - minimumX)) * displayRange,
    y:
      padding +
      (1 - (y - minimumY) / (maximumY - minimumY)) * displayRange,
  }))
}

function euclideanDistance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y)
}

function calculateRawSquaredError(distanceMatrix, coordinates) {
  let squaredError = 0

  for (let first = 0; first < pointCount; first += 1) {
    for (let second = first + 1; second < pointCount; second += 1) {
      const sourceDistance = distanceMatrix[first][second]
      const mappedDistance = euclideanDistance(
        coordinates[first],
        coordinates[second],
      )
      squaredError += (sourceDistance - mappedDistance) ** 2
    }
  }

  return squaredError
}

function calculateStress(distanceMatrix, coordinates) {
  const squaredDistance = distanceMatrix.reduce(
    (total, row, first) =>
      total +
      row.reduce(
        (sum, distance, second) =>
          second > first ? sum + distance ** 2 : sum,
        0,
      ),
    0,
  )

  return Math.sqrt(
    calculateRawSquaredError(distanceMatrix, coordinates) / squaredDistance,
  )
}

function countNearestMatches(distanceMatrix, coordinates) {
  return typeNames.filter((_, typeIndex) => {
    const sourceNearest = typeNames
      .map((__, index) => ({ index, distance: distanceMatrix[typeIndex][index] }))
      .filter(({ index }) => index !== typeIndex)
      .sort((first, second) => first.distance - second.distance)[0].index
    const mappedNearest = typeNames
      .map((__, index) => ({
        index,
        distance: euclideanDistance(coordinates[typeIndex], coordinates[index]),
      }))
      .filter(({ index }) => index !== typeIndex)
      .sort((first, second) => first.distance - second.distance)[0].index

    return sourceNearest === mappedNearest
  }).length
}

function fixed(value, digits = 6) {
  const rounded = Number(value.toFixed(digits))
  return Object.is(rounded, -0) ? '0' : String(rounded)
}

function createGeneratedSource(
  displayCoordinates,
  distanceMatrix,
  stress,
  nearestMatches,
) {
  const points = typeNames
    .map(
      (type, index) =>
        `  { type: '${type}', label: '${type}', x: ${fixed(displayCoordinates[index].x, 3)}, y: ${fixed(displayCoordinates[index].y, 3)} },`,
    )
    .join('\n')
  const distances = typeNames
    .map((type, rowIndex) => {
      const row = typeNames
        .map(
          (target, columnIndex) =>
            `      '${target}': ${fixed(distanceMatrix[rowIndex][columnIndex])},`,
        )
        .join('\n')
      return `  '${type}': {\n${row}\n  },`
    })
    .join('\n')

  return `// このファイルは npm run build:type-map で生成されます。直接編集しないでください。\nimport type { PlayerType } from '../typeEstimation'\n\nexport type TypeMapPoint = {\n  type: PlayerType\n  label: string\n  x: number\n  y: number\n}\n\nexport const TYPE_MAP_POINTS: TypeMapPoint[] = [\n${points}\n]\n\nexport const TYPE_MAP_DISTANCES: Record<PlayerType, Record<PlayerType, number>> = {\n${distances}\n}\n\nexport const TYPE_MAP_STRESS = ${fixed(stress)}\nexport const TYPE_MAP_NEAREST_MATCHES = ${nearestMatches}\n`
}

const normalizedTargets = normalizeTargets()
const distanceMatrix = createDistanceMatrix(normalizedTargets)
const mdsCoordinates = fixDisplayDirection(
  refineWithSmacof(distanceMatrix, createMdsCoordinates(distanceMatrix)),
)
const displayCoordinates = normalizeForDisplay(mdsCoordinates)
const stress = calculateStress(distanceMatrix, mdsCoordinates)
const nearestMatches = countNearestMatches(distanceMatrix, mdsCoordinates)

for (let index = 0; index < pointCount; index += 1) {
  if (Math.abs(distanceMatrix[index][index]) > 1e-12) {
    throw new Error(`${typeNames[index]}の自己距離が0ではありません。`)
  }

  for (let targetIndex = 0; targetIndex < pointCount; targetIndex += 1) {
    if (
      Math.abs(
        distanceMatrix[index][targetIndex] -
        distanceMatrix[targetIndex][index],
      ) > 1e-12
    ) {
      throw new Error('距離行列が対称ではありません。')
    }
  }
}

await writeFile(
  new URL('../src/data/typeMap.generated.ts', import.meta.url),
  createGeneratedSource(
    displayCoordinates,
    distanceMatrix,
    stress,
    nearestMatches,
  ),
  'utf8',
)

console.log(
  `タイプマップを生成しました（stress=${fixed(stress)}, 最近傍一致=${nearestMatches}/${pointCount}）。`,
)
