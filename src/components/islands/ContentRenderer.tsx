/**
 * ContentRenderer Component (React Island)
 * Renders markdown content with syntax highlighting
 */
import React, { ReactNode, isValidElement } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

import { slugify } from '../../lib/toc';
import { cn } from '../../lib/utils';

interface ContentRendererProps {
  content: string;
  gallery?: boolean;
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
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={match[1]}
        PreTag="div"
        {...props}
        className="rounded-md [&>code]:bg-transparent [&>code]:p-2 [&>code]:rounded-md"
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
    return <h5 id={id}>{children}</h5>;
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

export default function ContentRenderer({ content, gallery = false }: ContentRendererProps) {
  const components = gallery
    ? { ...baseComponents, figcaption: galleryFigcaption }
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
