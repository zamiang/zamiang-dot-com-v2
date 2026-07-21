import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateReadingTime(wordCount: number): string {
  const WORDS_PER_MINUTE = 225; // Average adult reading speed
  const minutes = Math.ceil(wordCount / WORDS_PER_MINUTE);
  return `${minutes} min read`;
}

/**
 * Notion posts conventionally begin their body with an H1 that repeats the
 * post title, so the rendered article shows the headline twice (the layout's
 * `<h1>` plus a body heading). Strip a leading top-level heading — or several
 * consecutive ones — that matches the title, leaving legitimate body headings
 * untouched. Only the HTML article calls this; the raw `.md` and feeds keep the
 * original source. Returns the content unchanged when nothing matches.
 */
export function stripLeadingTitleHeading(content: string, title: string): string {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  const target = normalize(title);
  if (!target) return content;

  const lines = content.split('\n');
  let cursor = 0;
  let removed = false;
  while (cursor < lines.length) {
    const line = lines[cursor].trim();
    if (line === '') {
      cursor++;
      continue;
    }
    const heading = /^#\s+(.+)$/.exec(line);
    if (heading && normalize(heading[1]) === target) {
      cursor++;
      removed = true;
      continue;
    }
    break;
  }

  if (!removed) return content;
  return lines.slice(cursor).join('\n').replace(/^\n+/, '');
}
