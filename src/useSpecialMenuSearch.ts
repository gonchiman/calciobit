import { useMemo, useState } from 'react'
import {
  compareMenuReadings,
  getInitialGroup,
  type InitialGroup,
} from './specialMenuSearch'
import type { SpecialMenu } from './types'

export function useSpecialMenuSearch(menus: SpecialMenu[]) {
  const [query, setQuery] = useState('')
  const [initialGroup, setInitialGroup] = useState<InitialGroup>('all')
  const [selectedCards, setSelectedCards] = useState<string[]>([])

  const cardOptions = useMemo(
    () =>
      Array.from(new Set(menus.flatMap((menu) => menu.cards))).sort((a, b) =>
        a.localeCompare(b, 'ja'),
      ),
    [menus],
  )

  const filteredMenus = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ja')
    const matches = menus.filter(
      (menu) =>
        (initialGroup === 'all' || getInitialGroup(menu.name) === initialGroup) &&
        (!normalizedQuery ||
          menu.name.toLocaleLowerCase('ja').includes(normalizedQuery)) &&
        selectedCards.every((card) => menu.cards.includes(card)),
    )

    if (initialGroup === 'all') return matches

    return [...matches].sort((firstMenu, secondMenu) =>
      compareMenuReadings(firstMenu.name, secondMenu.name),
    )
  }, [initialGroup, menus, query, selectedCards])

  const addCardFilter = (card: string) => {
    if (card && !selectedCards.includes(card)) {
      setSelectedCards((current) => [...current, card])
    }
  }

  const removeCardFilter = (card: string) => {
    setSelectedCards((current) =>
      current.filter((selectedCard) => selectedCard !== card),
    )
  }

  const resetSearch = () => {
    setQuery('')
    setInitialGroup('all')
    setSelectedCards([])
  }

  return {
    addCardFilter,
    cardOptions,
    filteredMenus,
    initialGroup,
    query,
    removeCardFilter,
    resetSearch,
    selectedCards,
    setInitialGroup,
    setQuery,
  }
}
