import { specialMenuReadings } from './data/specialMenuReadings'

export type InitialGroup =
  | 'all'
  | 'a'
  | 'ka'
  | 'sa'
  | 'ta'
  | 'na'
  | 'ha'
  | 'ma'
  | 'ya'
  | 'ra'
  | 'wa'
  | 'other'

export const initialGroups: Array<{ value: InitialGroup; label: string }> = [
  { value: 'all', label: 'すべて' },
  { value: 'a', label: 'あ行' },
  { value: 'ka', label: 'か行' },
  { value: 'sa', label: 'さ行' },
  { value: 'ta', label: 'た行' },
  { value: 'na', label: 'な行' },
  { value: 'ha', label: 'は行' },
  { value: 'ma', label: 'ま行' },
  { value: 'ya', label: 'や行' },
  { value: 'ra', label: 'ら行' },
  { value: 'wa', label: 'わ行' },
  { value: 'other', label: 'その他' },
]

const kanaByInitialGroup: Record<
  Exclude<InitialGroup, 'all' | 'other'>,
  string
> = {
  a: 'ぁあぃいうぅえぇおぉゔ',
  ka: 'かがきぎくぐけげこご',
  sa: 'さざしじすずせぜそぞ',
  ta: 'ただちぢっつづてでとど',
  na: 'なにぬねの',
  ha: 'はばぱひびぴふぶぷへべぺほぼぽ',
  ma: 'まみむめも',
  ya: 'ゃやゅゆょよ',
  ra: 'らりるれろ',
  wa: 'ゎわゐゑをん',
}

export function getMenuReading(name: string) {
  const reading = (specialMenuReadings[name] ?? name).trim().normalize('NFKC')

  return Array.from(reading, (character) => {
    const codePoint = character.codePointAt(0)
    return codePoint && codePoint >= 0x30a1 && codePoint <= 0x30f6
      ? String.fromCodePoint(codePoint - 0x60)
      : character
  }).join('')
}

export function getInitialGroup(
  name: string,
): Exclude<InitialGroup, 'all'> {
  const firstCharacter = getMenuReading(name)[0]

  if (!firstCharacter) return 'other'

  const matchedGroup = Object.entries(kanaByInitialGroup).find(([, kana]) =>
    kana.includes(firstCharacter),
  )

  return (matchedGroup?.[0] as Exclude<
    InitialGroup,
    'all' | 'other'
  >) ?? 'other'
}

export function compareMenuReadings(firstName: string, secondName: string) {
  const readingOrder = getMenuReading(firstName).localeCompare(
    getMenuReading(secondName),
    'ja',
    { sensitivity: 'base', numeric: true },
  )

  return (
    readingOrder ||
    firstName.localeCompare(secondName, 'ja', {
      sensitivity: 'base',
      numeric: true,
    })
  )
}
