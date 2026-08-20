import { useEffect, useState } from 'react'
import './App.css'
import { SpecialMenuComparison } from './components/SpecialMenuComparison'
import { SpecialMenuTable } from './components/SpecialMenuTable'
import { HiddenParameterPrediction } from './components/HiddenParameterPrediction'
import { TrainingSimulation } from './components/TrainingSimulation'
import { TypeInformation } from './components/TypeInformation'
import { TypeMap } from './components/TypeMap'
import specialMenuData from './data/specialMenus.json'
import type { SpecialMenu } from './types'

const specialMenus = specialMenuData as SpecialMenu[]
type Page = 'table' | 'compare' | 'simulate' | 'predict' | 'types' | 'type-map'

function getPageFromHash(): Page {
  if (window.location.hash === '#compare') return 'compare'
  if (window.location.hash === '#simulate') return 'simulate'
  if (window.location.hash === '#predict') return 'predict'
  if (window.location.hash === '#types') return 'types'
  if (window.location.hash === '#type-map') return 'type-map'
  return 'table'
}

function App() {
  const [page, setPage] = useState<Page>(getPageFromHash)

  useEffect(() => {
    const handleHashChange = () => setPage(getPageFromHash())

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <main>
      <header className="site-header">
        <div className="site-header-inner">
          <h1>カルチョビットA 攻略データベース</h1>
          <nav className="page-navigation" aria-label="機能を選択">
            <a
              className={page === 'table' ? 'active' : undefined}
              href="#table"
              aria-current={page === 'table' ? 'page' : undefined}
            >
              一覧・絞り込み
            </a>
            <a
              className={page === 'compare' ? 'active' : undefined}
              href="#compare"
              aria-current={page === 'compare' ? 'page' : undefined}
            >
              特訓検索・比較
            </a>
            <a
              className={page === 'simulate' ? 'active' : undefined}
              href="#simulate"
              aria-current={page === 'simulate' ? 'page' : undefined}
            >
              特訓シミュレーション
            </a>
            <a
              className={page === 'predict' ? 'active' : undefined}
              href="#predict"
              aria-current={page === 'predict' ? 'page' : undefined}
            >
              裏パラ予測
            </a>
            <a
              className={page === 'types' ? 'active' : undefined}
              href="#types"
              aria-current={page === 'types' ? 'page' : undefined}
            >
              タイプ情報
            </a>
            <a
              className={page === 'type-map' ? 'active' : undefined}
              href="#type-map"
              aria-current={page === 'type-map' ? 'page' : undefined}
            >
              タイプマップ
            </a>
          </nav>
        </div>
      </header>

      <div className="page-wrap">
        {page === 'table' && <SpecialMenuTable menus={specialMenus} />}
        {page === 'compare' && <SpecialMenuComparison menus={specialMenus} />}
        {page === 'simulate' && <TrainingSimulation menus={specialMenus} />}
        {page === 'predict' && <HiddenParameterPrediction menus={specialMenus} />}
        {page === 'types' && <TypeInformation />}
        {page === 'type-map' && <TypeMap menus={specialMenus} />}

        <p className="data-note">
          スペシャルメニュー全132件を収録しています。{' '}
          <a
            href="https://calciobit.com/tokkun/special-menu/"
            target="_blank"
            rel="noreferrer"
          >
            能力値・疲労の参照元
          </a>
          {' / '}
          <a
            href="https://calciobit.com/secret/positioning/"
            target="_blank"
            rel="noreferrer"
          >
            ポジショニング値の参照元
          </a>
        </p>
      </div>
    </main>
  )
}

export default App
