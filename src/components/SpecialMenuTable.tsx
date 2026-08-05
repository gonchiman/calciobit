import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import type { SpecialMenu } from '../types'

const columnHelper = createColumnHelper<SpecialMenu>()

function NumberCell({ value }: { value: number }) {
  const tone = value > 0 ? 'positive' : value < 0 ? 'negative' : 'zero'
  return <span className={`number-value ${tone}`}>{value}</span>
}

const columns = [
  columnHelper.accessor('name', {
    header: 'メニュー名',
    cell: (info) => <strong>{info.getValue()}</strong>,
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

type SpecialMenuTableProps = {
  menus: SpecialMenu[]
}

export function SpecialMenuTable({ menus }: SpecialMenuTableProps) {
  const [query, setQuery] = useState('')
  const [selectedCard, setSelectedCard] = useState('')
  const [fatigueLimit, setFatigueLimit] = useState('')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'total', desc: true },
  ])

  const cardOptions = useMemo(
    () =>
      Array.from(new Set(menus.flatMap((menu) => menu.cards))).sort((a, b) =>
        a.localeCompare(b, 'ja'),
      ),
    [menus],
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
      const matchesFatigue = maxFatigue === null || menu.fatigue <= maxFatigue

      return matchesQuery && matchesCard && matchesFatigue
    })
  }, [fatigueLimit, menus, query, selectedCard])

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
    setFatigueLimit('')
    setSorting([{ id: 'total', desc: true }])
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
          <span>含まれる課題</span>
          <select
            value={selectedCard}
            onChange={(event) => setSelectedCard(event.target.value)}
          >
            <option value="">すべての課題</option>
            {cardOptions.map((card) => (
              <option key={card} value={card}>
                {card}
              </option>
            ))}
          </select>
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

      <div className="sort-guide">
        <span className="guide-mark">↕</span>
        見出しを押すと並べ替え。複数の見出しを選ぶと、番号順に優先されます。
      </div>

      <div className="table-shell">
        <table>
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
    </section>
  )
}
