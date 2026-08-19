import { initialGroups, type InitialGroup } from '../specialMenuSearch'

type SpecialMenuSearchFiltersProps = {
  query: string
  onQueryChange: (query: string) => void
  cardOptions: string[]
  selectedCards: string[]
  onAddCard: (card: string) => void
  onRemoveCard: (card: string) => void
  initialGroup: InitialGroup
  onInitialGroupChange: (group: InitialGroup) => void
  onReset: () => void
}

export function SpecialMenuSearchFilters({
  query,
  onQueryChange,
  cardOptions,
  selectedCards,
  onAddCard,
  onRemoveCard,
  initialGroup,
  onInitialGroupChange,
  onReset,
}: SpecialMenuSearchFiltersProps) {
  return (
    <>
      <div className="comparison-filters">
        <label className="field">
          <span>特訓名で検索</span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="例：シュート、守護神"
          />
        </label>

        <label className="field">
          <span>必要な課題で絞り込み</span>
          <select
            value=""
            onChange={(event) => onAddCard(event.target.value)}
          >
            <option value="">課題を追加</option>
            {cardOptions.map((card) => (
              <option
                key={card}
                value={card}
                disabled={selectedCards.includes(card)}
              >
                {card}
              </option>
            ))}
          </select>
        </label>

        <button className="reset-button" type="button" onClick={onReset}>
          検索条件をリセット
        </button>
      </div>

      <div className="initial-filter" role="group" aria-label="特訓名の頭文字">
        <span>頭文字</span>
        <div className="initial-filter-options">
          {initialGroups.map((group) => (
            <button
              key={group.value}
              type="button"
              className={initialGroup === group.value ? 'active' : undefined}
              aria-pressed={initialGroup === group.value}
              onClick={() => onInitialGroupChange(group.value)}
            >
              {group.label}
            </button>
          ))}
        </div>
      </div>

      {selectedCards.length > 0 && (
        <div className="selected-card-filters" aria-label="選択中の課題">
          {selectedCards.map((card) => (
            <span key={card}>
              {card}
              <button
                type="button"
                onClick={() => onRemoveCard(card)}
                aria-label={`${card}の絞り込みを解除`}
                title="絞り込みを解除"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </>
  )
}
