/**
 * Header Component (React Island)
 *
 * iOS Safari Compatibility:
 * This component uses a checkbox-based CSS toggle pattern for the mobile menu
 * instead of React state. This ensures the menu works even if JavaScript
 * fails to load or hydrate on iOS Safari, which has known issues with
 * React hydration and touch events.
 *
 * The checkbox is visually hidden but accessible, and its :checked state
 * controls the menu visibility via CSS sibling selectors.
 */
import { useRef } from 'react';

interface NavLink {
  href: string;
  label: string;
  external?: boolean;
}

const navLinks: NavLink[] = [
  { href: '/#work', label: 'Work' },
  { href: '/#writing', label: 'Writing' },
  { href: '/#photography', label: 'Photography' },
  { href: '/resume.pdf', label: 'Resume', external: true },
];

export default function Header() {
  const checkboxRef = useRef<HTMLInputElement>(null);

  const closeMenu = () => {
    if (checkboxRef.current) {
      checkboxRef.current.checked = false;
    }
  };

  return (
    <header className="relative z-50">
      <nav aria-label="Main navigation" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 relative">
          <div className="flex items-center">
            <a href="/" className="text-foreground border-none text-sm">
              Brennan Moore
            </a>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-foreground text-sm border-none hover:text-accent transition-colors duration-150 inline-flex items-center gap-1"
                {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {link.label}
                {link.external && (
                  <svg
                    className="w-3 h-3 opacity-50"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                    />
                  </svg>
                )}
              </a>
            ))}
          </div>

          {/* Mobile menu - CSS-only toggle using checkbox hack
              This works without JavaScript, making it immune to iOS Safari hydration issues */}
          <input
            ref={checkboxRef}
            type="checkbox"
            id="mobile-menu-toggle"
            className="mobile-menu-toggle md:hidden"
            aria-label="Toggle menu"
          />

          {/* Visual button (not interactive - the checkbox above handles clicks) */}
          <div
            className="menu-button md:hidden flex items-center justify-center w-11 h-11 -mr-2.5 text-foreground pointer-events-none"
            aria-hidden="true"
          >
            <svg
              className="icon-open w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
            <svg
              className="icon-close w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          {/* Mobile menu dropdown */}
          <nav
            className="mobile-menu absolute top-full left-0 right-0 bg-background py-4 border-t border-border/50 -mx-4 px-4 sm:-mx-6 sm:px-6"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-foreground text-base py-2 border-none hover:text-accent transition-colors duration-150 inline-flex items-center gap-1"
                  onClick={closeMenu}
                  {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {link.label}
                  {link.external && (
                    <svg
                      className="w-3.5 h-3.5 opacity-50"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                      />
                    </svg>
                  )}
                </a>
              ))}
            </div>
          </nav>
        </div>
      </nav>
    </header>
  );
}
