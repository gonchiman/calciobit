import type { ReactNode } from 'react'
import type { PlayerType } from '../typeEstimation'

type TypeSelectionCardsProps<Type extends PlayerType> = {
  id: string
  types: readonly Type[]
  description: string
  primaryLabel: string
  primaryValue: Type | ''
  onPrimaryChange: (type: Type | '') => void
  secondaryLabel: string
  secondaryValue: Type | ''
  onSecondaryChange: (type: Type | '') => void
  allowPrimaryClear?: boolean
  allowSecondaryClear?: boolean
  className?: string
  footer?: ReactNode
}

export function TypeSelectionCards<Type extends PlayerType>({
  id,
  types,
  description,
  primaryLabel,
  primaryValue,
  onPrimaryChange,
  secondaryLabel,
  secondaryValue,
  onSecondaryChange,
  allowPrimaryClear = false,
  allowSecondaryClear = true,
  className,
  footer,
}: TypeSelectionCardsProps<Type>) {
  return (
    <section
      className={`simulation-type-selector${className ? ` ${className}` : ''}`}
      aria-labelledby={`${id}-heading`}
    >
      <div className="simulation-type-selector-heading">
        <div>
          <h3 id={`${id}-heading`}>タイプ指定</h3>
          <p>{description}</p>
        </div>
        <div className="simulation-type-selection" aria-live="polite">
          <span>
            {primaryLabel} <strong>{primaryValue || '未指定'}</strong>
          </span>
          <i aria-hidden="true">→</i>
          <span>
            {secondaryLabel} <strong>{secondaryValue || '未指定'}</strong>
          </span>
        </div>
      </div>

      <div className="simulation-type-card-grid">
        {types.map((type) => {
          const isPrimary = primaryValue === type
          const isSecondary = secondaryValue === type

          return (
            <div
              className={`simulation-type-card${
                isPrimary ? ' is-current' : ''
              }${isSecondary ? ' is-target' : ''}`}
              key={type}
            >
              <strong className="simulation-type-card-name">{type}</strong>
              <div
                className="simulation-type-card-actions"
                role="group"
                aria-label={`${type}の指定`}
              >
                <button
                  type="button"
                  className={`simulation-type-choice current${
                    isPrimary ? ' is-active' : ''
                  }`}
                  aria-pressed={isPrimary}
                  onClick={() =>
                    onPrimaryChange(
                      isPrimary && allowPrimaryClear ? '' : type,
                    )
                  }
                >
                  {primaryLabel}
                </button>
                <button
                  type="button"
                  className={`simulation-type-choice target${
                    isSecondary ? ' is-active' : ''
                  }`}
                  aria-pressed={isSecondary}
                  onClick={() =>
                    onSecondaryChange(
                      isSecondary && allowSecondaryClear ? '' : type,
                    )
                  }
                >
                  {secondaryLabel}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {footer && <div className="simulation-type-bar">{footer}</div>}
    </section>
  )
}
