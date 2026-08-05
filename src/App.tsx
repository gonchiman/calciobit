import './App.css'
import { SpecialMenuTable } from './components/SpecialMenuTable'
import specialMenuData from './data/specialMenus.json'
import type { SpecialMenu } from './types'

const specialMenus = specialMenuData as SpecialMenu[]

function App() {
  return (
    <main>
      <header className="site-header">
        <h1>カルチョビットA 攻略データベース</h1>
      </header>

      <div id="top" className="page-wrap">
        <div id="special-menu">
          <SpecialMenuTable menus={specialMenus} />
        </div>

        <p className="data-note">
          スペシャルメニュー全132件を収録しています。{' '}
          <a
            href="https://calciobit.com/tokkun/special-menu/"
            target="_blank"
            rel="noreferrer"
          >
            データ参照元
          </a>
        </p>
      </div>
    </main>
  )
}

export default App
