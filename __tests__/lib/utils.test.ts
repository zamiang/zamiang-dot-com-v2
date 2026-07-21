import { describe, expect, it } from 'vitest';

import { calculateReadingTime, stripLeadingTitleHeading } from '../../src/lib/utils';

describe('calculateReadingTime', () => {
  it('rounds up to whole minutes at 225 wpm', () => {
    expect(calculateReadingTime(0)).toBe('0 min read');
    expect(calculateReadingTime(1)).toBe('1 min read');
    expect(calculateReadingTime(225)).toBe('1 min read');
    expect(calculateReadingTime(226)).toBe('2 min read');
  });
});

describe('stripLeadingTitleHeading', () => {
  const title = 'A workout planner for endurance + weight training';

  it('removes a leading H1 that repeats the title', () => {
    const content = `# ${title}\n\nAs I've gotten older...`;
    expect(stripLeadingTitleHeading(content, title)).toBe("As I've gotten older...");
  });

  it('removes several consecutive duplicate title headings', () => {
    const content = `\n# ${title}\n\n\n# ${title}\n\n\nBody starts here.`;
    expect(stripLeadingTitleHeading(content, title)).toBe('Body starts here.');
  });

  it('matches case- and whitespace-insensitively', () => {
    const content = `#   a WORKOUT planner   for endurance + weight training\n\nBody.`;
    expect(stripLeadingTitleHeading(content, title)).toBe('Body.');
  });

  it('leaves a non-matching leading heading untouched', () => {
    const content = `# A different heading\n\nBody.`;
    expect(stripLeadingTitleHeading(content, title)).toBe(content);
  });

  it('does not strip a matching heading that appears after body content', () => {
    const content = `Intro paragraph.\n\n# ${title}\n\nMore.`;
    expect(stripLeadingTitleHeading(content, title)).toBe(content);
  });

  it('ignores deeper headings with the same text', () => {
    const content = `## ${title}\n\nBody.`;
    expect(stripLeadingTitleHeading(content, title)).toBe(content);
  });

  it('returns content unchanged when the title is empty', () => {
    const content = `# ${title}\n\nBody.`;
    expect(stripLeadingTitleHeading(content, '')).toBe(content);
  });
});
