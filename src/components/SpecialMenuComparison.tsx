import { Fragment, useMemo, useState } from 'react'
import type { SpecialMenu } from '../types'

type MetricKey =
  | 'kick'
  | 'speed'
  | 'stamina'
  | 'technique'
  | 'physical'
  | 'jump'
  | 'mental'
  | 'offenseQuality'
  | 'support'
  | 'triangle'
  | 'loseMark'
  | 'overlap'
  | 'diagonalRun'
  | 'spaceRun'
  | 'goalFront'
  | 'defenseQuality'
  | 'zoneMarking'
  | 'manMarking'
  | 'pressing'
  | 'shootCut'
  | 'intercept'

type MetricGroup = {
  label: string
  metrics: Array<{ key: MetricKey; label: string }>
}

const metricGroups: MetricGroup[] = [
  {
    label: '基本能力',
    metrics: [
      { key: 'kick', label: 'キック' },
      { key: 'speed', label: 'スピード' },
      { key: 'stamina', label: 'スタミナ' },
      { key: 'technique', label: 'テクニック' },
      { key: 'physical', label: 'フィジカル' },
      { key: 'jump', label: 'ジャンプ' },
      { key: 'mental', label: 'メンタル' },
    ],
  },
  {
    label: '攻撃ポジショニング',
    metrics: [
      { key: 'offenseQuality', label: 'オフェンス' },
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
    label: '守備ポジショニング',
    metrics: [
      { key: 'defenseQuality', label: 'ディフェンス' },
      { key: 'zoneMarking', label: 'ゾーンマーキング' },
      { key: 'manMarking', label: 'マンツーマン' },
      { key: 'pressing', label: 'プレッシング' },
      { key: 'shootCut', label: 'シュートカット' },
      { key: 'intercept', label: 'インターセプト' },
    ],
  },
]

function valueTone(value: number) {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'zero'
}

type SpecialMenuComparisonProps = {
  menus: SpecialMenu[]
}

export function SpecialMenuComparison({ menus }: SpecialMenuComparisonProps) {
  const [query, setQuery] = useState('')
  const [selectedCards, setSelectedCards] = useState<string[]>([])
  const [selectedMenuNames, setSelectedMenuNames] = useState<string[]>([])

  const cardOptions = useMemo(
    () =>
      Array.from(new Set(menus.flatMap((menu) => menu.cards))).sort((a, b) =>
        a.localeCompare(b, 'ja'),
      ),
    [menus],
  )

  const filteredMenus = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ja')

    return menus.filter(
      (menu) =>
        (!normalizedQuery ||
          menu.name.toLocaleLowerCase('ja').includes(normalizedQuery)) &&
        selectedCards.every((card) => menu.cards.includes(card)),
    )
  }, [menus, query, selectedCards])

  const selectedMenus = useMemo(
    () =>
      selectedMenuNames
        .map((name) => menus.find((menu) => menu.name === name))
        .filter((menu): menu is SpecialMenu => Boolean(menu)),
    [menus, selectedMenuNames],
  )

  const addCardFilter = (card: string) => {
    if (card && !selectedCards.includes(card)) {
      setSelectedCards((current) => [...current, card])
    }
  }

  const addMenu = (name: string) => {
    setSelectedMenuNames((current) =>
      current.includes(name) ? current : [...current, name],
    )
  }

  const removeMenu = (name: string) => {
    setSelectedMenuNames((current) =>
      current.filter((selectedName) => selectedName !== name),
    )
  }

  const resetSearch = () => {
    setQuery('')
    setSelectedCards([])
  }

  return (
    <section className="comparison-page" aria-labelledby="comparison-heading">
      <div className="section-heading comparison-heading">
        <div>
          <h2 id="comparison-heading">特訓検索・比較</h2>
          <p className="section-description">
            名前または必要な課題から特訓を探し、能力の上昇値を横並びで比較できます。
          </p>
        </div>
      </div>

      <section className="comparison-picker" aria-labelledby="picker-heading">
        <div className="subsection-heading">
          <h3 id="picker-heading">特訓を選ぶ</h3>
          <span>{filteredMenus.length}件</span>
        </div>

        <div className="comparison-filters">
          <label className="field">
            <span>特訓名で検索</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="例：シュート、守護神"
            />
          </label>

          <label className="field">
            <span>必要な課題で絞り込み</span>
            <select
              value=""
              onChange={(event) => addCardFilter(event.target.value)}
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

          <button className="reset-button" type="button" onClick={resetSearch}>
            検索条件をリセット
          </button>
        </div>

        {selectedCards.length > 0 && (
          <div className="selected-card-filters" aria-label="選択中の課題">
            {selectedCards.map((card) => (
              <span key={card}>
                {card}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedCards((current) =>
                      current.filter((selectedCard) => selectedCard !== card),
                    )
                  }
                  aria-label={`${card}の絞り込みを解除`}
                  title="絞り込みを解除"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="menu-results" aria-live="polite">
          {filteredMenus.length > 0 ? (
            filteredMenus.map((menu) => {
              const isSelected = selectedMenuNames.includes(menu.name)

              return (
                <div className="menu-result-row" key={menu.name}>
                  <div className="menu-result-name">
                    <strong>{menu.name}</strong>
                    <span>{menu.cards.join(' / ')}</span>
                  </div>
                  <span className="menu-result-total">合計 {menu.total}</span>
                  <button
                    type="button"
                    className="add-menu-button"
                    onClick={() => addMenu(menu.name)}
                    disabled={isSelected}
                  >
                    {isSelected ? '追加済み' : '比較に追加'}
                  </button>
                </div>
              )
            })
          ) : (
            <div className="comparison-empty compact">
              条件に一致する特訓がありません。
            </div>
          )}
        </div>
      </section>

      <section className="comparison-output" aria-labelledby="output-heading">
        <div className="subsection-heading">
          <h3 id="output-heading">比較する特訓</h3>
          <div className="comparison-count">
            <span>{selectedMenus.length}件を選択中</span>
            {selectedMenus.length > 0 && (
              <button
                type="button"
                className="clear-comparison-button"
                onClick={() => setSelectedMenuNames([])}
              >
                すべて削除
              </button>
            )}
          </div>
        </div>

        {selectedMenus.length > 0 ? (
          <div className="comparison-table-shell">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th scope="col">項目</th>
                  {selectedMenus.map((menu) => (
                    <th scope="col" key={menu.name}>
                      <span>{menu.name}</span>
                      <button
                        type="button"
                        onClick={() => removeMenu(menu.name)}
                        aria-label={`${menu.name}を比較から削除`}
                        title="比較から削除"
                      >
                        ×
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">必要な課題</th>
                  {selectedMenus.map((menu) => (
                    <td key={menu.name} className="comparison-card-cell">
                      {menu.cards.map((card) => (
                        <span key={card}>{card}</span>
                      ))}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">合計</th>
                  {selectedMenus.map((menu) => (
                    <td key={menu.name} className="comparison-total-value">
                      {menu.total}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">疲労蓄積値</th>
                  {selectedMenus.map((menu) => (
                    <td key={menu.name}>{menu.fatigue}</td>
                  ))}
                </tr>

                {metricGroups.map((group) => (
                  <Fragment key={group.label}>
                    <tr className="comparison-group-row">
                      <th colSpan={selectedMenus.length + 1}>{group.label}</th>
                    </tr>
                    {group.metrics.map((metric) => (
                      <tr key={metric.key}>
                        <th scope="row">{metric.label}</th>
                        {selectedMenus.map((menu) => {
                          const value = menu[metric.key]
                          return (
                            <td key={menu.name}>
                              <span
                                className={`comparison-number ${valueTone(value)}`}
                              >
                                {value}
                              </span>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="comparison-empty">
            検索結果から比較したい特訓を追加してください。
          </div>
        )}
      </section>
    </section>
  )
}
