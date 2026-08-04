import './App.css'
import { SpecialMenuTable } from './components/SpecialMenuTable'
import specialMenuData from './data/specialMenus.json'
import type { SpecialMenu } from './types'

const specialMenus = specialMenuData as SpecialMenu[]

function App() {
  const highestTotal = Math.max(...specialMenus.map((menu) => menu.total))

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="ページ上部へ">
          <span className="brand-mark">C</span>
          <span>
            <strong>CALCIOBIT A</strong>
            <small>攻略データベース</small>
          </span>
        </a>
        <nav aria-label="データベースのメニュー">
          <a className="nav-link active" href="#special-menu">
            スペシャルメニュー
          </a>
          <span className="nav-link muted">通常メニュー</span>
          <span className="nav-link muted">ポジショニング</span>
        </nav>
      </header>

      <div id="top" className="page-wrap">
        <section className="hero" aria-labelledby="page-title">
          <div className="hero-copy">
            <p className="eyebrow">BUILD YOUR IDEAL PLAYER</p>
            <h1 id="page-title">
              欲しい能力から、
              <br />
              最適な特訓を見つける。
            </h1>
            <p className="hero-description">
              カルチョビットAの育成データを、検索・絞り込み・複数条件ソートで見比べられる攻略サイトです。
            </p>
            <a className="primary-link" href="#special-menu">
              メニューを探す <span aria-hidden="true">↓</span>
            </a>
          </div>

          <div className="hero-stats" aria-label="収録データの概要">
            <div className="pitch-lines" aria-hidden="true">
              <span className="center-circle" />
            </div>
            <article>
              <span>収録メニュー</span>
              <strong>{specialMenus.length}</strong>
              <small>初期収録分</small>
            </article>
            <article>
              <span>最大上昇合計</span>
              <strong>{highestTotal}</strong>
              <small>現在の収録範囲</small>
            </article>
          </div>
        </section>

        <div id="special-menu">
          <SpecialMenuTable menus={specialMenus} />
        </div>

        <aside className="data-note">
          <div>
            <span className="note-icon" aria-hidden="true">i</span>
            <p>
              現在はサイトの初期版として、代表的な13件を収録しています。今後、全メニューとポジショニング値を追加します。
            </p>
          </div>
          <a
            href="https://calciobit.com/tokkun/special-menu/"
            target="_blank"
            rel="noreferrer"
          >
            データ参照元
          </a>
        </aside>
      </div>

      <footer>
        <span>CALCIOBIT A 攻略データベース</span>
        <span>非公式ファンサイト</span>
      </footer>
    </main>
  )
}

export default App
