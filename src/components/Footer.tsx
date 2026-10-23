import { ArrowUp, ArrowUpRight } from 'lucide-react'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-width">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="brand-mark footer-mark" aria-hidden="true">
              <span />
            </span>
            <div>
              <strong>ANANYA</strong>
              <span>AXIS COLLECTIONS STUDIO</span>
            </div>
          </div>

          <p className="footer-disclaimer">
            Independent prototype built for evaluation. Not an official Axis Bank product. All names, accounts,
            balances and calls are synthetic. Production deployment would require Axis Bank compliance, DPDP Act
            2023, RBI Fair Practices Code and PCI DSS review. No real customer data is used.
          </p>

          <nav className="footer-nav" aria-label="Footer navigation">
            <a href="#studio">Studio <ArrowUpRight size={12} /></a>
            <a href="#lab">Test lab <ArrowUpRight size={12} /></a>
            <a href="#measure">Success model <ArrowUpRight size={12} /></a>
            <a href="#scale">10 → 20 <ArrowUpRight size={12} /></a>
            <a href="#prompt">Prompt <ArrowUpRight size={12} /></a>
          </nav>
        </div>

        <div className="footer-bottom">
          <span>PROTOTYPE 01 · OCTOBER 2026</span>
          <span>Policy first. Pressure never.</span>
          <a href="#top" className="back-top">
            Back to top <ArrowUp size={13} />
          </a>
        </div>
      </div>
    </footer>
  )
}
