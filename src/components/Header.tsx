import { ArrowUpRight } from 'lucide-react'

interface HeaderProps {
  onStart: () => void
}

const NAV = [
  { label: 'Studio', href: '#studio' },
  { label: 'Test lab', href: '#lab' },
  { label: 'Success model', href: '#measure' },
  { label: '10 → 20', href: '#scale' },
  { label: 'Prompt', href: '#prompt' },
]

export function Header({ onStart }: HeaderProps) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="page-width header-inner">
          <a className="brand" href="#top" aria-label="Axis Collections Studio home">
            <span className="brand-mark" aria-hidden="true">
              <span />
            </span>
            <span className="brand-type">
              <strong>AXIS</strong>
              <small>COLLECTIONS STUDIO</small>
            </span>
          </a>

          <nav className="main-nav" aria-label="Main navigation">
            {NAV.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="header-actions">
            <span className="synthetic-chip">
              <span className="synthetic-dot" aria-hidden="true" />
              Synthetic demo
            </span>
            <button className="button button-dark header-cta" type="button" onClick={onStart}>
              Start a test call <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
