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
