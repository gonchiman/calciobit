import { useMemo, useRef, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import type { SpecialMenu } from '../types'
import { TrainingDetailDialog } from './TrainingDetailDialog'

const columnHelper = createColumnHelper<SpecialMenu>()

function NumberCell({ value }: { value: number }) {
  const tone = value > 0 ? 'positive' : value < 0 ? 'negative' : 'zero'
  return <span className={`number-value ${tone}`}>{value}</span>
}

function createColumns(onOpenDetail: (menu: SpecialMenu) => void) {
  return [
  columnHelper.accessor('name', {
    header: 'メニュー名',
    cell: (info) => (
      <button
        type="button"
        className="menu-table-name-button training-info-trigger"
        onClick={() => onOpenDetail(info.row.original)}
        aria-label={`${info.getValue()}の情報を表示`}
        title="特訓情報を表示"
      >
        <strong>{info.getValue()}</strong>
      </button>
    ),
  }),
  columnHelper.accessor('cards', {
    header: '必要な課題',
    enableSorting: false,
    cell: (info) => (
      <div className="card-list">
        {info.getValue().map((card) => (
          <span className="training-card" key={card}>
            {card}
          </span>
        ))}
      </div>
    ),
  }),
  columnHelper.accessor('kick', {
    header: 'キック',
    cell: (info) => <NumberCell value={info.getValue()} />,
  }),
  columnHelper.accessor('speed', {
    header: 'スピード',
    cell: (info) => <NumberCell value={info.getValue()} />,
  }),
  columnHelper.accessor('stamina', {
    header: 'スタミナ',
    cell: (info) => <NumberCell value={info.getValue()} />,
  }),
  columnHelper.accessor('technique', {
    header: 'テクニック',
    cell: (info) => <NumberCell value={info.getValue()} />,
  }),
  columnHelper.accessor('physical', {
    header: 'フィジカル',
    cell: (info) => <NumberCell value={info.getValue()} />,
  }),
  columnHelper.accessor('jump', {
    header: 'ジャンプ',
    cell: (info) => <NumberCell value={info.getValue()} />,
  }),
  columnHelper.accessor('mental', {
    header: 'メンタル',
    cell: (info) => <NumberCell value={info.getValue()} />,
  }),
  columnHelper.accessor('total', {
    header: '合計',
    cell: (info) => <span className="total-value">{info.getValue()}</span>,
  }),
  columnHelper.accessor('fatigue', {
    header: '疲労',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('offenseQuality', {
    header: '攻撃クオリティ',
    cell: (info) => <NumberCell value={info.getValue()} />,
  }),
  columnHelper.accessor('support', {
    header: 'サポート',
    cell: (info) => <NumberCell value={info.getValue()} />,
  }),
  columnHelper.accessor('triangle', {
    header: 'トライアングル',
    cell: (info) => <NumberCell value={info.getValue()} />,
  }),
  columnHelper.accessor('loseMark', {
    header: 'マークを外す',
    cell: (info) => <NumberCell value={info.getValue()} />,
  }),
  columnHelper.accessor('overlap', {
    header: 'オーバーラップ',
    cell: (info) => <NumberCell value={info.getValue()} />,
  }),
  columnHelper.accessor('diagonalRun', {
    header: 'ダイアゴナルラン',
    cell: (info) => <NumberCell value={info.getValue()} />,
  }),
  columnHelper.accessor('spaceRun', {
    header: 'スペースに走り込む',
    cell: (info) => <NumberCell value={info.getValue()} />,
  }),
  columnHelper.accessor('goalFront', {
    header: 'ゴール前待機',
    cell: (info) => <NumberCell value={info.getValue()} />,
  }),
  columnHelper.accessor('defenseQuality', {
    header: '守備クオリティ',
    cell: (info) => <NumberCell value={info.getValue()} />,
  }),
  columnHelper.accessor('zoneMarking', {
    header: 'ゾーンマーキング',
    cell: (info) => <NumberCell value={info.getValue()} />,
  }),
  columnHelper.accessor('manMarking', {
    header: 'マンツーマン',
    cell: (info) => <NumberCell value={info.getValue()} />,
  }),
  columnHelper.accessor('pressing', {
    header: 'プレッシング',
    cell: (info) => <NumberCell value={info.getValue()} />,
  }),
  columnHelper.accessor('shootCut', {
    header: 'シュートカット',
    cell: (info) => <NumberCell value={info.getValue()} />,
  }),
  columnHelper.accessor('intercept', {
    header: 'インターセプト',
    cell: (info) => <NumberCell value={info.getValue()} />,
  }),
  ]
}

type CardCategory = {
  id: string
  label: string
  cards: readonly string[]
}

const cardCategories: readonly CardCategory[] = [
  {
    id: 'tactical',
    label: 'TACTICAL',
    cards: [
      'ビデオ研究',
      'マンツーマン',
      'プレス',
      'カウンター',
      'ミニゲーム',
      'ラインコントロール',
      'セットプレー',
    ],
  },
  {
    id: 'technical',
    label: 'TECHNICAL',
    cards: [
      'ドリブル',
      'プレースキック',
      'シュート',
      'パス',
      'リフティング',
      'スライディング',
      'ヘディング',
    ],
  },
  {
    id: 'physical',
    label: 'PHYSICAL',
    cards: [
      'ランニング',
      'ウェイト',
      'キック',
      'ダッシュ',
      'アジリティ',
      'エアロビクス',
      'ストレッチ',
    ],
  },
  {
    id: 'support',
    label: 'SUPPORT',
    cards: [
      'アロマテラピー',
      '座禅',
      'サイン会',
      'PK練習',
      '合気道',
      'イメージトレーニング',
      'ミーティング',
      '温泉',
      'ミニキャンプ',
      'カルチョビット',
      'カラオケ',
    ],
  },
]

type NumericParameterKey = Exclude<keyof SpecialMenu, 'name' | 'cards'>

type ParameterOptionGroup = {
  label: string
  options: readonly {
    key: NumericParameterKey
    label: string
  }[]
}

const parameterOptionGroups: readonly ParameterOptionGroup[] = [
  {
    label: '能力値・基本値',
    options: [
      { key: 'kick', label: 'キック' },
      { key: 'speed', label: 'スピード' },
      { key: 'stamina', label: 'スタミナ' },
      { key: 'technique', label: 'テクニック' },
      { key: 'physical', label: 'フィジカル' },
      { key: 'jump', label: 'ジャンプ' },
      { key: 'mental', label: 'メンタル' },
      { key: 'total', label: '合計' },
      { key: 'fatigue', label: '疲労' },
    ],
  },
  {
    label: '攻撃系ポジショニング',
    options: [
      { key: 'offenseQuality', label: '攻撃クオリティ' },
      { key: 'support', label: 'サポート' },
      { key: 'triangle', label: 'トライアングル' },
      { key: 'loseMark', label: 'マークを外す' },
      { key: 'overlap', label: 'オーバーラップ' },
      { key: 'diagonalRun', label: 'ダイアゴナルラン' },
      { key: 'spaceRun', label: 'スペースに走り込む' },
      { key: 'goalFront', label: 'ゴール前待機' },
    ],
  },
  {
    label: '守備系ポジショニング',
    options: [
      { key: 'defenseQuality', label: '守備クオリティ' },
      { key: 'zoneMarking', label: 'ゾーンマーキング' },
      { key: 'manMarking', label: 'マンツーマン' },
      { key: 'pressing', label: 'プレッシング' },
      { key: 'shootCut', label: 'シュートカット' },
      { key: 'intercept', label: 'インターセプト' },
    ],
  },
]

type ParameterConstraint = {
  id: number
  parameter: NumericParameterKey
  minimum: string
  maximum: string
}

function getConstraintBounds(constraint: ParameterConstraint) {
  const minimum =
    constraint.minimum === '' ? null : Number(constraint.minimum)
  const maximum =
    constraint.maximum === '' ? null : Number(constraint.maximum)
  const hasValue = minimum !== null || maximum !== null
  const isValid =
    (!hasValue ||
      ((minimum === null || Number.isFinite(minimum)) &&
        (maximum === null || Number.isFinite(maximum)))) &&
    (minimum === null || maximum === null || minimum <= maximum)

  return { minimum, maximum, hasValue, isValid }
}

type SpecialMenuTableProps = {
  menus: SpecialMenu[]
}

export function SpecialMenuTable({ menus }: SpecialMenuTableProps) {
  const [query, setQuery] = useState('')
  const [selectedCard, setSelectedCard] = useState('')
  const [excludedCards, setExcludedCards] = useState<string[]>([])
  const [fatigueLimit, setFatigueLimit] = useState('')
  const [parameterConstraints, setParameterConstraints] = useState<
    ParameterConstraint[]
  >([])
  const [detailMenu, setDetailMenu] = useState<SpecialMenu | null>(null)
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'total', desc: true },
  ])
  const nextConstraintId = useRef(1)

  const columns = useMemo(() => createColumns(setDetailMenu), [])

  const cardOptions = useMemo(
    () =>
      Array.from(new Set(menus.flatMap((menu) => menu.cards))).sort((a, b) =>
        a.localeCompare(b, 'ja'),
      ),
    [menus],
  )

  const availableCardCategories = useMemo(() => {
    const availableCards = new Set(cardOptions)
    const categorizedCards = new Set(
      cardCategories.flatMap((category) => category.cards),
    )
    const groups: CardCategory[] = cardCategories.map((category) => ({
      ...category,
      cards: category.cards.filter((card) => availableCards.has(card)),
    }))
    const uncategorizedCards = cardOptions.filter(
      (card) => !categorizedCards.has(card),
    )

    if (uncategorizedCards.length > 0) {
      groups.push({
        id: 'other',
        label: 'OTHER',
        cards: uncategorizedCards,
      })
    }

    return groups.filter((category) => category.cards.length > 0)
  }, [cardOptions])

  const activeParameterConstraintCount = parameterConstraints.filter(
    (constraint) => {
      const bounds = getConstraintBounds(constraint)
      return bounds.hasValue && bounds.isValid
    },
  ).length

  const hasInvalidParameterConstraint = parameterConstraints.some(
    (constraint) => !getConstraintBounds(constraint).isValid,
  )

  const filteredMenus = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ja')
    const maxFatigue = fatigueLimit ? Number(fatigueLimit) : null

    return menus.filter((menu) => {
      const matchesQuery =
        !normalizedQuery ||
        menu.name.toLocaleLowerCase('ja').includes(normalizedQuery) ||
        menu.cards.some((card) =>
          card.toLocaleLowerCase('ja').includes(normalizedQuery),
        )
      const matchesCard = !selectedCard || menu.cards.includes(selectedCard)
      const matchesExcludedCards = excludedCards.every(
        (card) => !menu.cards.includes(card),
      )
      const matchesFatigue = maxFatigue === null || menu.fatigue <= maxFatigue
      const matchesParameterConstraints = parameterConstraints.every(
        (constraint) => {
          const { minimum, maximum, hasValue, isValid } =
            getConstraintBounds(constraint)

          if (!hasValue || !isValid) return true

          const value = menu[constraint.parameter]
          return (
            (minimum === null || value >= minimum) &&
            (maximum === null || value <= maximum)
          )
        },
      )

      return (
        matchesQuery &&
        matchesCard &&
        matchesExcludedCards &&
        matchesFatigue &&
        matchesParameterConstraints
      )
    })
  }, [
    excludedCards,
    fatigueLimit,
    menus,
    parameterConstraints,
    query,
    selectedCard,
  ])

  const table = useReactTable({
    data: filteredMenus,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const reset = () => {
    setQuery('')
    setSelectedCard('')
    setExcludedCards([])
    setFatigueLimit('')
    setParameterConstraints([])
    setSorting([{ id: 'total', desc: true }])
  }

  const selectIncludedCard = (card: string) => {
    setSelectedCard(card)

    if (card) {
      setExcludedCards((current) =>
        current.filter((excludedCard) => excludedCard !== card),
      )
    }
  }

  const toggleIncludedCard = (card: string) => {
    if (selectedCard === card) {
      setSelectedCard('')
      return
    }

    selectIncludedCard(card)
  }

  const toggleExcludedCard = (card: string) => {
    setExcludedCards((current) =>
      current.includes(card)
        ? current.filter((excludedCard) => excludedCard !== card)
        : [...current, card],
    )

    if (selectedCard === card) setSelectedCard('')
  }

  const addParameterConstraint = () => {
    const id = nextConstraintId.current
    nextConstraintId.current += 1
    setParameterConstraints((current) => [
      ...current,
      { id, parameter: 'kick', minimum: '', maximum: '' },
    ])
  }

  const updateParameterConstraint = (
    id: number,
    updates: Partial<Omit<ParameterConstraint, 'id'>>,
  ) => {
    setParameterConstraints((current) =>
      current.map((constraint) =>
        constraint.id === id ? { ...constraint, ...updates } : constraint,
      ),
    )
  }

  const removeParameterConstraint = (id: number) => {
    setParameterConstraints((current) =>
      current.filter((constraint) => constraint.id !== id),
    )
  }

  return (
    <section className="database-section" aria-labelledby="database-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">SPECIAL TRAINING</p>
          <h2 id="database-heading">スペシャルメニュー</h2>
          <p className="section-description">
            メニュー名や課題で検索し、能力値・ポジショニング値を優先順位つきで並べ替えられます。
          </p>
        </div>
        <div className="result-count" aria-live="polite">
          <strong>{filteredMenus.length}</strong>
          <span>件を表示</span>
        </div>
      </div>

      <div className="filter-panel">
        <label className="field search-field">
          <span>メニュー・課題を検索</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="例：ドリブル、野人"
          />
        </label>

        <label className="field">
          <span>疲労蓄積値</span>
          <select
            value={fatigueLimit}
            onChange={(event) => setFatigueLimit(event.target.value)}
          >
            <option value="">上限なし</option>
            <option value="75">75以下</option>
            <option value="100">100以下</option>
            <option value="125">125以下</option>
            <option value="150">150以下</option>
          </select>
        </label>

        <button className="reset-button" type="button" onClick={reset}>
          条件をリセット
        </button>
      </div>

      <details className="task-selector">
        <summary className="task-selector-heading">
          <div>
            <h3 id="task-selector-heading">課題で絞り込む</h3>
            <p>「含む」は1件、「含まない」は複数件登録できます。</p>
          </div>
          <div className="task-selector-heading-side">
            <div className="task-selection-summary" aria-live="polite">
              <span>
                含む
                <strong>{selectedCard || '未登録'}</strong>
              </span>
              <span>
                含まない
                <strong>
                  {excludedCards.length > 0
                    ? `${excludedCards.length}件`
                    : '未登録'}
                </strong>
              </span>
            </div>
            <span className="task-selector-toggle" aria-hidden="true">
              <span className="task-selector-toggle-open">開く</span>
              <span className="task-selector-toggle-close">閉じる</span>
            </span>
          </div>
        </summary>

        <div className="task-category-list">
          {availableCardCategories.map((category) => (
            <section
              className={`task-category task-category--${category.id}`}
              aria-labelledby={`task-category-${category.id}`}
              key={category.id}
            >
              <div className="task-category-heading">
                <h4 id={`task-category-${category.id}`}>
                  {category.label}
                </h4>
                <span>{category.cards.length}課題</span>
              </div>
              <ul className="task-card-grid">
                {category.cards.map((card) => {
                  const isIncluded = selectedCard === card
                  const isExcluded = excludedCards.includes(card)

                  return (
                    <li
                      className={`task-filter-card${
                        isIncluded ? ' included' : ''
                      }${isExcluded ? ' excluded' : ''}`}
                      key={card}
                    >
                      <strong>{card}</strong>
                      <div
                        className="task-filter-card-actions"
                        role="group"
                        aria-label={`${card}の絞り込み条件`}
                      >
                        <button
                          type="button"
                          className="include-task-button"
                          aria-pressed={isIncluded}
                          aria-label={
                            isIncluded
                              ? `${card}の「含む」登録を解除`
                              : `${card}を「含む」に登録`
                          }
                          onClick={() => toggleIncludedCard(card)}
                        >
                          含む
                        </button>
                        <button
                          type="button"
                          className="exclude-task-button"
                          aria-pressed={isExcluded}
                          aria-label={
                            isExcluded
                              ? `${card}の「含まない」登録を解除`
                              : `${card}を「含まない」に登録`
                          }
                          onClick={() => toggleExcludedCard(card)}
                        >
                          含まない
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </details>

      <details className="task-selector parameter-selector">
        <summary className="task-selector-heading">
          <div>
            <h3>パラメーターの数値で絞り込む</h3>
            <p>下限（以上）と上限（以下）を指定し、複数の制約を追加できます。</p>
          </div>
          <div className="task-selector-heading-side">
            <div className="task-selection-summary" aria-live="polite">
              <span>
                有効な制約
                <strong>{activeParameterConstraintCount}件</strong>
              </span>
              {hasInvalidParameterConstraint && (
                <span className="parameter-constraint-warning">
                  入力を確認
                </span>
              )}
            </div>
            <span className="task-selector-toggle" aria-hidden="true">
              <span className="task-selector-toggle-open">開く</span>
              <span className="task-selector-toggle-close">閉じる</span>
            </span>
          </div>
        </summary>

        <div className="parameter-constraint-content">
          <div className="parameter-constraint-toolbar">
            <p>すべての制約を満たすメニューだけを表示します。</p>
            <button type="button" onClick={addParameterConstraint}>
              ＋ 制約を追加
            </button>
          </div>

          {parameterConstraints.length > 0 ? (
            <div className="parameter-constraint-list">
              {parameterConstraints.map((constraint, index) => {
                const bounds = getConstraintBounds(constraint)
                const isReversed =
                  bounds.minimum !== null &&
                  bounds.maximum !== null &&
                  bounds.minimum > bounds.maximum

                return (
                  <div
                    className={`parameter-constraint-row${
                      bounds.isValid ? '' : ' invalid'
                    }`}
                    key={constraint.id}
                  >
                    <span className="parameter-constraint-number">
                      {index + 1}
                    </span>
                    <label className="parameter-constraint-field parameter-select-field">
                      <span>パラメーター</span>
                      <select
                        value={constraint.parameter}
                        onChange={(event) =>
                          updateParameterConstraint(constraint.id, {
                            parameter: event.target
                              .value as NumericParameterKey,
                          })
                        }
                      >
                        {parameterOptionGroups.map((group) => (
                          <optgroup label={group.label} key={group.label}>
                            {group.options.map((option) => (
                              <option value={option.key} key={option.key}>
                                {option.label}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </label>
                    <label className="parameter-constraint-field">
                      <span>以上</span>
                      <input
                        type="number"
                        step="1"
                        value={constraint.minimum}
                        aria-invalid={!bounds.isValid}
                        placeholder="指定なし"
                        onChange={(event) =>
                          updateParameterConstraint(constraint.id, {
                            minimum: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="parameter-constraint-field">
                      <span>以下</span>
                      <input
                        type="number"
                        step="1"
                        value={constraint.maximum}
                        aria-invalid={!bounds.isValid}
                        placeholder="指定なし"
                        onChange={(event) =>
                          updateParameterConstraint(constraint.id, {
                            maximum: event.target.value,
                          })
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="remove-parameter-constraint"
                      aria-label={`制約${index + 1}を削除`}
                      onClick={() => removeParameterConstraint(constraint.id)}
                    >
                      削除
                    </button>
                    {isReversed && (
                      <span className="parameter-constraint-error">
                        「以上」は「以下」以下の値にしてください。
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="parameter-constraint-empty">
              制約はまだありません。「制約を追加」から設定してください。
            </p>
          )}
        </div>
      </details>

      <div className="sort-guide">
        <span className="guide-mark">↕</span>
        見出しを押すと並べ替え。複数の見出しを選ぶと、番号順に優先されます。
      </div>

      <div className="table-shell">
        <table className="menu-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const direction = header.column.getIsSorted()
                  const sortIndex = sorting.findIndex(
                    (item) => item.id === header.column.id,
                  )
                  const canSort = header.column.getCanSort()
                  const shouldReplaceDefaultSort =
                    sorting.length === 1 &&
                    sorting[0].id === 'total' &&
                    sorting[0].desc &&
                    header.column.id !== 'total'

                  return (
                    <th key={header.id} scope="col">
                      {canSort ? (
                        <button
                          type="button"
                          className="sort-button"
                          onClick={() =>
                            header.column.toggleSorting(
                              undefined,
                              !shouldReplaceDefaultSort,
                            )
                          }
                          aria-label={`${String(header.column.columnDef.header)}を並べ替え`}
                        >
                          <span>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </span>
                          <span className="sort-state" aria-hidden="true">
                            {direction === 'asc'
                              ? '↑'
                              : direction === 'desc'
                                ? '↓'
                                : '↕'}
                            {sortIndex >= 0 && <small>{sortIndex + 1}</small>}
                          </span>
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {filteredMenus.length === 0 && (
          <div className="empty-state">
            <strong>該当するメニューがありません</strong>
            <span>検索語や絞り込み条件を変えてください。</span>
          </div>
        )}
      </div>

      {detailMenu && (
        <TrainingDetailDialog
          menu={detailMenu}
          onClose={() => setDetailMenu(null)}
        />
      )}
    </section>
  )
}
