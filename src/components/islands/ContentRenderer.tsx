/**
 * ContentRenderer Component (React Island)
 * Renders markdown content with syntax highlighting
 */
import React, { ReactNode, isValidElement } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

import { photoFileId } from '../../lib/telemetry';
import { slugify } from '../../lib/toc';
import { cn } from '../../lib/utils';

interface ContentRendererProps {
  content: string;
  gallery?: boolean;
}

// Custom code tag that drops react-syntax-highlighter's hardcoded inline
// `white-space:pre` style. The CSP blocks inline styles, and `.code-block`
// already supplies `white-space: pre` (inherited by this <code>), so the
// inline style is both blocked and redundant.
function CodeTag({ style, ...rest }: React.HTMLAttributes<HTMLElement>) {
  return <code {...rest} />;
}

function getTextContent(children: ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(getTextContent).join('');
  if (isValidElement(children)) {
    return getTextContent((children.props as { children?: ReactNode }).children);
  }
  return '';
}

const baseComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <p>{children}</p>,
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a href={href}>{children}</a>
  ),
  u: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul>{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol>{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li>{children}</li>,
  blockquote: ({ children }: { children?: React.ReactNode }) => <blockquote>{children}</blockquote>,
  code: ({ className, children, ...props }: { className?: string; children?: React.ReactNode }) => {
    const match = /language-(\w+)/.exec(className || '');
    return match ? (
      // useInlineStyles={false}: tokens are colored via the `.token.*` classes
      // styled in globals.css, not inline `style` attributes. The site's CSP
      // blocks inline styles (Astro's auto-hashed <style> tags make
      // 'unsafe-inline' inert), which previously rendered code white-on-white.
      <SyntaxHighlighter
        useInlineStyles={false}
        language={match[1]}
        PreTag="div"
        CodeTag={CodeTag}
        {...props}
        className="code-block"
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className="font-mono text-[0.875em] px-1.5 py-0.5 bg-muted/80 text-foreground/90 rounded">
        {children}
      </code>
    );
  },
  pre: ({ className, ...props }: React.HTMLAttributes<HTMLPreElement>) => {
    return <pre className={cn('bg-transparent p-0', className)} {...props} />;
  },
  img: ({ src, alt }: { src?: string; alt?: string }) => {
    return (
      <img src={src} alt={alt || ''} className="h-auto w-full" loading="lazy" decoding="async" />
    );
  },
  h1: ({ children }: { children?: React.ReactNode }) => {
    const id = slugify(getTextContent(children));
    return <h2 id={id}>{children}</h2>;
  },
  h2: ({ children }: { children?: React.ReactNode }) => {
    const id = slugify(getTextContent(children));
    return <h3 id={id}>{children}</h3>;
  },
  h3: ({ children }: { children?: React.ReactNode }) => {
    const id = slugify(getTextContent(children));
    return <h4 id={id}>{children}</h4>;
  },
  h4: ({ children }: { children?: React.ReactNode }) => {
    const id = slugify(getTextContent(children));
    return <h5 id={id}>{children}</h5>;
  },
  h5: ({ children }: { children?: React.ReactNode }) => {
    const id = slugify(getTextContent(children));
    return <h6 id={id}>{children}</h6>;
  },
  h6: ({ children }: { children?: React.ReactNode }) => {
    const id = slugify(getTextContent(children));
    return <h6 id={id}>{children}</h6>;
  },
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-muted/50">{children}</thead>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => <tbody>{children}</tbody>,
  tr: ({ children }: { children?: React.ReactNode }) => (
    <tr className="border-b border-border">{children}</tr>
  ),
  td: ({ children }: { children?: React.ReactNode }) => <td className="p-2 text-sm">{children}</td>,
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="p-2 text-sm font-semibold text-left">{children}</th>
  ),
};

const galleryFigcaption = ({ children }: { children?: React.ReactNode }) => (
  <figcaption className="photos-cap">
    <span className="cap-title">{children}</span>
  </figcaption>
);

const galleryImg = ({ src, alt }: { src?: string; alt?: string }) => {
  if (!src) return null;
  const fileId = photoFileId(src.split('/').pop() || src);
  return (
    <div className="bm-photo bm-photo--inspect">
      <img className="bm-photo-base" src={src} alt={alt || ''} loading="lazy" decoding="async" />
      <img
        className="bm-photo-line"
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
      />
      <div className="bm-hud" aria-hidden="true">
        <div className="bm-hud-brackets">
          <span className="tl" />
          <span className="tr" />
          <span className="bl" />
          <span className="br" />
        </div>
        <div className="bm-hud-reticle">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
            <line x1="24" y1="6" x2="24" y2="42" strokeWidth="1.25" />
            <line x1="6" y1="24" x2="42" y2="24" strokeWidth="1.25" />
          </svg>
        </div>
        <div className="bm-hud-telemetry">
          <div className="bm-hud-col">
            <span className="bm-hud-lbl">File</span>
            <span className="bm-hud-val">{fileId}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ContentRenderer({ content, gallery = false }: ContentRendererProps) {
  const components = gallery
    ? { ...baseComponents, figcaption: galleryFigcaption, img: galleryImg }
    : baseComponents;

  return (
    <div className="prose prose-slate max-w-none mb-12 prose-headings:font-serif prose-headings:font-medium prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-accent prose-a:no-underline hover:prose-a:text-accent/80 prose-strong:text-foreground prose-strong:font-semibold prose-blockquote:border-accent prose-blockquote:text-muted-foreground">
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
