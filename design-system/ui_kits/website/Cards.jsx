const cardStyles = {
  postRow:    { padding: '12px 0', borderBottom: '1px solid rgba(209,213,219,0.3)' },
  postDate:   { fontSize: 14, color: 'var(--muted-foreground)', margin: 0 },
  postTitle:  { fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 500, margin: '4px 0 6px' },
  postExcerpt:{ fontSize: 16, lineHeight: 1.6, color: 'rgba(44,51,58,0.7)', margin: 0,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },

  workCard:   { padding: '16px 0', borderBottom: '1px solid rgba(209,213,219,0.3)' },
  workHead:   { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  workDate:   { fontSize: 14, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.05em' },
  workSep:    { color: 'rgba(74,85,96,0.4)' },
  workRole:   { fontSize: 12, fontWeight: 500, color: 'var(--muted-foreground)' },
  workTitle:  { fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 500, margin: '0 0 4px' },
  workDesc:   { fontSize: 14, lineHeight: 1.6, color: 'var(--muted-foreground)', margin: 0 },

  photoCard:  { display: 'block' },
  photoFrame: { aspectRatio: '1/1', overflow: 'hidden', borderRadius: 2, background: 'var(--muted)' },
  photoImg:   { width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 200ms' },
  photoDate:  { marginTop: 8, fontSize: 14, color: 'var(--muted-foreground)' },
  photoTitle: { fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 500, margin: '4px 0 0' }
};

function PostCard({ post, onOpen, compact }) {
  if (compact) {
    return (
      <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', padding: '6px 0' }}>
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)', whiteSpace: 'nowrap', margin: 0 }}>{post.dateShort}</p>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 500, margin: 0 }}>
          <a onClick={() => onOpen?.(post)} style={{ cursor: 'pointer' }}>{post.title}</a>
        </h3>
      </div>
    );
  }
  return (
    <div style={cardStyles.postRow}>
      <p style={cardStyles.postDate}>{post.date}</p>
      <h3 style={cardStyles.postTitle}>
        <a onClick={() => onOpen?.(post)} style={{ cursor: 'pointer' }}>{post.title}</a>
      </h3>
      {post.excerpt && <p style={cardStyles.postExcerpt}>{post.excerpt}</p>}
    </div>
  );
}

function PhotoCard({ photo, onOpen, hideText }) {
  return (
    <div style={cardStyles.photoCard}>
      <a onClick={() => onOpen?.(photo)} className="no-underline" style={{ cursor: 'pointer', borderBottom: 'none' }}>
        <div style={cardStyles.photoFrame}>
          <img src={photo.src} alt={photo.title} style={cardStyles.photoImg}
               onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
               onMouseLeave={(e) => e.currentTarget.style.opacity = '1'} />
        </div>
      </a>
      {!hideText && <p style={cardStyles.photoDate}>{photo.date}</p>}
      {!hideText && <h3 style={cardStyles.photoTitle}><a onClick={() => onOpen?.(photo)}>{photo.title}</a></h3>}
    </div>
  );
}

function WorkCard({ item }) {
  return (
    <div style={cardStyles.workCard}>
      <div style={cardStyles.workHead}>
        <span style={cardStyles.workDate}>{item.dateRange}</span>
        <span style={cardStyles.workSep}>·</span>
        <span style={cardStyles.workRole}>{item.role}</span>
      </div>
      <h3 style={cardStyles.workTitle}><a>{item.org}</a></h3>
      <p style={cardStyles.workDesc}>{item.description}</p>
    </div>
  );
}

function Tagline({ children }) {
  return (
    <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400, lineHeight: 1.4,
                color: 'var(--muted-foreground)', margin: '0 0 24px' }}>{children}</p>
  );
}

Object.assign(window, { PostCard, PhotoCard, WorkCard, Tagline });
