import { useEffect, useState } from 'react';

interface RailItem {
  id: string;
  num: string;
  label: string;
}

const items: RailItem[] = [
  { id: 'writing', num: '01', label: 'Writing' },
  { id: 'photography', num: '02', label: 'Photography' },
  { id: 'currently', num: '03', label: 'Currently' },
  { id: 'work', num: '04', label: 'Experience' },
  { id: 'publications', num: '05', label: 'Publications' },
];

export default function SectionRail() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sections = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const lastId = items[items.length - 1].id;

    const computeActive = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (nearBottom) {
        setActiveId(lastId);
        return true;
      }
      return false;
    };

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        if (computeActive()) return;
        const intersecting = entries.filter((e) => e.isIntersecting);
        if (intersecting.length === 0) return;
        intersecting.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        setActiveId(intersecting[0].target.id);
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );
    sections.forEach((s) => sectionObserver.observe(s));

    const onScroll = () => computeActive();
    window.addEventListener('scroll', onScroll, { passive: true });

    const hero = document.querySelector('.resume-header');
    let heroObserver: IntersectionObserver | null = null;
    if (hero) {
      heroObserver = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
        threshold: 0,
      });
      heroObserver.observe(hero);
    } else {
      setVisible(true);
    }

    return () => {
      sectionObserver.disconnect();
      heroObserver?.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <nav
      className={`section-rail${visible ? ' section-rail--visible' : ''}`}
      aria-label="Page sections"
    >
      <style>{`
        .section-rail {
          position: fixed;
          left: clamp(1.25rem, 3.5vw, 3rem);
          top: 50%;
          transform: translateY(-50%);
          z-index: 20;
          opacity: 0;
          pointer-events: none;
          transition: opacity 320ms var(--ease-out);
          display: none;
        }
        .section-rail--visible {
          opacity: 1;
          pointer-events: auto;
        }
        @media (min-width: 1024px) {
          .section-rail { display: block; }
        }
        .section-rail ol {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }
        .section-rail a {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          border: none;
          color: var(--muted-foreground);
          font-family: var(--font-mono);
          font-size: 0.7rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          line-height: 1;
          opacity: 0.55;
          transition: color 240ms var(--ease-out), opacity 240ms var(--ease-out);
        }
        .section-rail a:hover {
          color: var(--accent-bold);
          opacity: 1;
        }
        .section-rail a:focus-visible {
          outline: 2px solid var(--accent-bold);
          outline-offset: 4px;
          border-radius: 2px;
          opacity: 1;
        }
        .section-rail .num {
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }
        .section-rail .label {
          font-family: var(--font-serif);
          font-style: italic;
          font-weight: 400;
          font-size: 0.95rem;
          letter-spacing: 0;
          text-transform: none;
          line-height: 1;
          max-width: 0;
          overflow: hidden;
          white-space: nowrap;
          opacity: 0;
          transition: max-width 320ms var(--ease-out), opacity 240ms var(--ease-out);
        }
        .section-rail li.active a,
        .section-rail a:hover {
          color: var(--accent-bold);
          opacity: 1;
        }
        .section-rail li.active .label,
        .section-rail a:hover .label {
          max-width: 12rem;
          opacity: 1;
        }
        @media (prefers-reduced-motion: reduce) {
          .section-rail,
          .section-rail a,
          .section-rail .label {
            transition: none;
          }
        }
      `}</style>
      <ol>
        {items.map((item) => (
          <li key={item.id} className={activeId === item.id ? 'active' : ''}>
            <a href={`#${item.id}`}>
              <span className="num">{item.num}</span>
              <span className="label">{item.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
