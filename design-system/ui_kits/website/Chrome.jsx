const headerStyles = {
  nav: { maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' },
  bar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 64 },
  brand: { fontSize: 14, color: 'var(--foreground)', borderBottom: 'none' },
  links: { display: 'flex', gap: 18, alignItems: 'center' },
  link: { fontSize: 14, color: 'var(--foreground)', borderBottom: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' },
  ext: { width: 11, height: 11, opacity: 0.5 }
};

function Header({ onNav, current }) {
  const links = [
    { id: 'home',   label: 'Work' },
    { id: 'home',   label: 'Writing' },
    { id: 'photos', label: 'Photography' },
    { id: 'ext',    label: 'Resume', external: true }
  ];
  return (
    <header style={{ position: 'relative', zIndex: 50 }}>
      <nav aria-label="Main" style={headerStyles.nav}>
        <div style={headerStyles.bar}>
          <a style={headerStyles.brand} onClick={() => onNav('home')}>Brennan Moore</a>
          <div style={headerStyles.links}>
            {links.map((l, i) => (
              <a key={i} style={headerStyles.link}
                 onClick={() => l.external ? null : onNav(l.id)}>
                {l.label}
                {l.external && (
                  <svg style={headerStyles.ext} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.5 19.5l15-15M8.25 4.5h11.25v11.25" />
                  </svg>
                )}
              </a>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}

const footerStyles = {
  outer: { width: '100vw', marginLeft: 'calc(-50vw + 50%)', padding: '32px 16px 48px', position: 'relative', zIndex: 10 },
  inner: { maxWidth: 680, margin: '0 auto', textAlign: 'center' },
  rule: { width: 64, height: 1, background: 'rgba(209,213,219,0.5)', margin: '0 auto 32px' },
  list: { display: 'flex', justifyContent: 'center', gap: 4, alignItems: 'center', listStyle: 'none', margin: 0, padding: 0, flexWrap: 'wrap' },
  link: { fontSize: 14, color: 'var(--muted-foreground)', borderBottom: 'none', padding: '6px 12px' },
  dot: { color: 'rgba(74,85,96,0.5)' },
  copy: { fontSize: 12, color: 'rgba(74,85,96,0.8)', margin: '16px 0 0' }
};

function Footer() {
  const links = ['Resume', 'Instagram', 'RSS', 'Source'];
  return (
    <footer style={footerStyles.outer} role="contentinfo">
      <div style={footerStyles.inner}>
        <div style={footerStyles.rule}></div>
        <ul style={footerStyles.list}>
          {links.map((label, i) => (
            <React.Fragment key={i}>
              <li><a style={footerStyles.link}>{label}</a></li>
              {i < links.length - 1 && <li style={footerStyles.dot} aria-hidden>·</li>}
            </React.Fragment>
          ))}
        </ul>
        <p style={footerStyles.copy}>© <a style={{ borderBottom: 'none' }}>Brennan Moore</a> 2026</p>
      </div>
    </footer>
  );
}

function SectionWrapper({ tint = 'warm', children }) {
  const tints = {
    warm:   'rgba(245, 240, 232, 0.85)',
    cool:   'rgba(235, 238, 242, 0.85)',
    muted:  'rgba(229, 232, 236, 0.85)',
    accent: 'rgba(232, 239, 242, 0.85)'
  };
  const style = {
    width: '100vw', marginLeft: 'calc(-50vw + 50%)',
    padding: '64px 16px', position: 'relative', zIndex: 1,
    background: tints[tint]
  };
  return (
    <section style={style}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>{children}</div>
    </section>
  );
}

Object.assign(window, { Header, Footer, SectionWrapper });
