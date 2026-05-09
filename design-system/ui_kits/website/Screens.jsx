/* Mock data + the three click-thru screens. */
const POSTS = [
  { slug: 'last-mile', date: 'Apr 14, 2026', dateShort: 'Apr 2026', title: 'The Last Mile Problem in Engineering Leadership',
    excerpt: 'Most engineering managers can ship a feature. The real test is whether the team still ships it three months after you stop watching.' },
  { slug: 'vbc-1',     date: 'Mar 02, 2026', dateShort: 'Mar 2026', title: 'Why Value-Based Care is Harder Than Rocket Science', section: 'VBC',
    excerpt: 'A series on the structural reasons U.S. healthcare resists better incentive design — starting with the consolidated fragmentation of who pays for what.' },
  { slug: 'small-team',date: 'Jan 21, 2026', dateShort: 'Jan 2026', title: 'On Small Teams, Big Bets, and the Math In Between',
    excerpt: 'A note to my younger self: the math of a small team scales differently than you think, and the most expensive line item is rarely the one you tracked.' },
  { slug: 'reading',   date: 'Dec 04, 2025', dateShort: 'Dec 2025', title: 'A Year of Reading Less, Better' },
  { slug: 'edge',      date: 'Oct 18, 2025', dateShort: 'Oct 2025', title: 'Edge Caches Are a Distributed Systems Problem' },
];

const PHOTOS = [
  { slug: 'p1', date: 'Oct 21, 2022', title: 'Window light, late October', src: '../../assets/photos/portrait-bw.jpg' },
  { slug: 'p2', date: 'Feb 13, 2023', title: 'Walk along the canal',          src: '../../assets/photos/landscape-warm.jpg' },
  { slug: 'p3', date: 'Sep 27, 2021', title: 'Stairwell, off Bleecker',      src: '../../assets/photos/architectural.jpg' },
  { slug: 'p4', date: 'Feb 15, 2023', title: 'Quiet morning, Carroll Gardens', src: '../../assets/photos/quiet-detail.jpg' },
];

const WORK = [
  { dateRange: '2022 — Present', role: 'Co-founder & CTO', org: 'Stellate', description: 'Edge-cached GraphQL infrastructure. Built the core platform from zero with a small founding team.' },
  { dateRange: '2018 — 2021',    role: 'VP Engineering',   org: 'Cedar',    description: 'Patient financial experience. Scaled the engineering org through Series C.' },
  { dateRange: '2014 — 2018',    role: 'Director of Engineering', org: 'Hopper', description: 'Led growth and consumer-product engineering across web and mobile.' },
];

const PUBS = [
  { title: 'On the Use and Misuse of OKRs in Small Teams', venue: 'Engineering Leadership Quarterly · 2024' },
  { title: 'Edge Cache Coherence in Practice',              venue: 'GraphQL Conf · 2023' },
];

/* ----------------------------- Home ------------------------------ */

const homeStyles = {
  resumeHeader: { display: 'flex', alignItems: 'center', gap: 20, paddingTop: 48, paddingBottom: 24, maxWidth: 960, margin: '0 auto' },
  photo:        { width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  nameH1:       { fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 600, margin: 0, lineHeight: 1.15 },
  role:         { fontSize: 14, color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.4 },
  resumeLinks:  { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--muted-foreground)', marginTop: 4 },
  resumeLink:   { borderBottom: 'none' },
  rule:         { maxWidth: 960, margin: '0 auto', height: 1, border: 'none', borderTop: '1px solid rgba(209,213,219,0.5)' },
  primary:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, maxWidth: 960, margin: '32px auto 0' },
  twoCol:       { display: 'grid', gridTemplateColumns: '260px 1fr', gap: 64, maxWidth: 960, margin: '32px auto 64px' },
  photoGrid:    { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 },
  viewAll:      { fontSize: 14, color: 'var(--muted-foreground)', borderBottom: 'none', marginTop: 8, display: 'inline-block', cursor: 'pointer' }
};

function HomeScreen({ onNav, onOpenPost, onOpenPhoto }) {
  return (
    <div>
      <div style={homeStyles.resumeHeader}>
        <img src="../../assets/about.jpg" alt="" style={homeStyles.photo} />
        <div>
          <h1 style={homeStyles.nameH1}>Brennan Moore</h1>
          <p style={homeStyles.role}>CTO &amp; co-founder · writer · photographer · Brooklyn, NY</p>
          <div style={homeStyles.resumeLinks}>
            <a style={homeStyles.resumeLink}>brennanmoore.com</a>
            <span style={{ color: 'var(--border)' }}>·</span>
            <a style={homeStyles.resumeLink}>@zamiang</a>
            <span style={{ color: 'var(--border)' }}>·</span>
            <a style={homeStyles.resumeLink}>linkedin</a>
          </div>
        </div>
      </div>
      <hr style={homeStyles.rule} />

      <div style={homeStyles.primary}>
        <section id="writing">
          <h2 className="resume-section-heading" style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted-foreground)', paddingBottom: 8, borderBottom: '1px solid var(--border)', margin: '0 0 12px' }}>Writing</h2>
          {POSTS.slice(0, 5).map(p => (
            <PostCard key={p.slug} post={p} onOpen={onOpenPost} compact />
          ))}
          <a style={homeStyles.viewAll} onClick={() => onNav('home')}>All writing →</a>
        </section>

        <section id="photography">
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted-foreground)', paddingBottom: 8, borderBottom: '1px solid var(--border)', margin: '0 0 12px' }}>Photography</h2>
          <div style={homeStyles.photoGrid}>
            {PHOTOS.map(p => <PhotoCard key={p.slug} photo={p} hideText onOpen={onOpenPhoto} />)}
          </div>
          <a style={homeStyles.viewAll} onClick={() => onNav('photos')}>All photos →</a>
        </section>
      </div>

      <div style={homeStyles.twoCol}>
        <aside>
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted-foreground)', paddingBottom: 8, borderBottom: '1px solid var(--border)', margin: '0 0 12px' }}>About</h2>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--muted-foreground)', margin: 0 }}>
              Engineering leader with a fine-art background. I write about how teams ship, what good incentives look like in healthcare, and occasionally what I'm looking at through a 35mm lens.
            </p>
          </section>
          <section>
            <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted-foreground)', paddingBottom: 8, borderBottom: '1px solid var(--border)', margin: '0 0 12px' }}>Publications</h2>
            {PUBS.map((pub, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 500, margin: '0 0 2px' }}>{pub.title}</h4>
                <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0 }}>{pub.venue}</p>
              </div>
            ))}
          </section>
        </aside>

        <section id="work">
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted-foreground)', paddingBottom: 8, borderBottom: '1px solid var(--border)', margin: '0 0 12px' }}>Selected Work</h2>
          {WORK.map((w, i) => <WorkCard key={i} item={w} />)}
        </section>
      </div>
    </div>
  );
}

/* ----------------------------- Post ------------------------------ */

function PostScreen({ post, onNav }) {
  const next = POSTS.find(p => p.slug !== post.slug);
  return (
    <article style={{ maxWidth: 680, margin: '40px auto 0' }}>
      <header style={{ marginBottom: 32 }}>
        {post.section === 'VBC' && (
          <div style={{ marginBottom: 16 }}>
            <a style={{ display: 'inline-block', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', background: 'rgba(116,156,168,0.15)', padding: '4px 12px', borderRadius: 4, borderBottom: 'none' }}>
              Why Value-Based Care is Harder Than Rocket Science
            </a>
          </div>
        )}
        <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)' }}>
          <time>{post.date}</time>
          <span style={{ color: 'var(--border)' }}>·</span>
          <span>7 min read</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 44, fontWeight: 500, lineHeight: 1.15, margin: '0 0 12px' }}>{post.title}</h1>
        {post.excerpt && (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 19, color: 'var(--muted-foreground)', margin: '0 0 24px', lineHeight: 1.5 }}>{post.excerpt}</p>
        )}
        <hr style={{ width: '100%', height: 1, border: 'none', borderTop: '1px solid rgba(209,213,219,0.5)', margin: '24px 0 0' }} />
      </header>

      <div style={{ fontSize: 18, lineHeight: 1.8, color: 'var(--foreground)' }}>
        <p style={{ maxWidth: '65ch' }}>
          A working hypothesis I keep returning to: most "engineering management" lessons are last-mile lessons. The first nine miles — hiring, planning, scoping, sprinting — have a stable shape, and the canon will get you there.
        </p>
        <p style={{ maxWidth: '65ch' }}>
          The tenth mile is what happens when you stop watching. Whether the team still ships, still asks the same hard questions, still calls each other out on the same softness — that's the thing the canon does <em>not</em> get you.
        </p>

        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, margin: '40px 0 12px' }}>The Three Failure Modes</h2>
        <p style={{ maxWidth: '65ch' }}>
          I've watched the same three failure modes appear in three different companies. The names change; the shape doesn't.
        </p>

        <blockquote style={{ margin: '32px 0', padding: '0 0 0 24px', borderLeft: '4px solid var(--accent)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 20, lineHeight: 1.7 }}>
          The hard part of leadership isn't deciding. It's caring about the same thing for long enough that the team starts to care about it too.
        </blockquote>

        <p style={{ maxWidth: '65ch' }}>
          The rest of this essay is a tour through those three failure modes, and the small, unromantic moves I've found that actually move them.
        </p>
      </div>

      <div style={{ marginTop: 64 }}>
        <a onClick={() => onNav('home')} style={{ fontSize: 14, color: 'var(--muted-foreground)', borderBottom: 'none', cursor: 'pointer' }}>← Back to writing</a>
      </div>
    </article>
  );
}

/* ----------------------------- Photos ------------------------------ */

function PhotosScreen({ onOpenPhoto }) {
  return (
    <div style={{ maxWidth: 960, margin: '40px auto 64px' }}>
      <p className="section-label" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', margin: '0 0 8px' }}>Visual Stories</p>
      <h1 className="section-heading" style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 500, margin: '0 0 8px' }}>Photography</h1>
      <p className="section-subtitle" style={{ fontSize: 16, color: 'var(--muted-foreground)', margin: '0 0 32px' }}>
        Captured on travels and on quiet mornings around the neighborhood. Mostly 35mm, mostly available light.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 32 }}>
        {PHOTOS.map(p => <PhotoCard key={p.slug} photo={p} onOpen={onOpenPhoto} />)}
      </div>
    </div>
  );
}

Object.assign(window, { POSTS, PHOTOS, HomeScreen, PostScreen, PhotosScreen });
