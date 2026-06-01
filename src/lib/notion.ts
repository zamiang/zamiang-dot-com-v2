import { Client } from '@notionhq/client';
import { ImageBlockObjectResponse } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/';
import { NotionToMarkdown } from 'notion-to-md';

import { config } from './config';
import { downloadImage, getFilename } from './download-image';
import { ValidationError, logError } from './errors';

export interface Post {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  date: string;
  dateModified?: string;
  excerpt?: string;
  content: string;
  author: string;
  section?: string; // 'All' | 'VBC';
  showToc?: boolean;
}

export function getWordCount(content: string): number {
  const cleanText = content
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleanText.length === 0 ? 0 : cleanText.split(' ').length;
}

export const fetchPublishedPosts = async (notion: Client, dataSourceID: string) => {
  const queryParams = {
    data_source_id: dataSourceID!,
    filter: {
      and: [
        {
          property: 'Status',
          status: {
            equals: 'Published',
          },
        },
      ],
    },
    sorts: [
      {
        property: 'Published Date',
        direction: 'descending' as const,
      },
    ],
  };

  // Paginate past the 100-item per-query limit so large databases aren't
  // silently truncated to the first page.
  const all: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const response = await notion.dataSources.query(
      cursor ? { ...queryParams, start_cursor: cursor } : queryParams,
    );
    all.push(...(response.results as PageObjectResponse[]));
    cursor = response.has_more && response.next_cursor ? response.next_cursor : undefined;
  } while (cursor);

  return all;
};

export async function getPostFromNotion(pageId: string): Promise<Post | null> {
  try {
    const notion = new Client({
      auth: process.env.NOTION_TOKEN || config.notion.token,
    });
    const n2m = new NotionToMarkdown({ notionClient: notion });

    n2m.setCustomTransformer('image', async (block) => {
      const { image } = block as ImageBlockObjectResponse;
      const src = image.type === 'external' ? image.external.url : image.file.url;
      const filename = getFilename(src);
      if (!filename) return '';

      await downloadImage(src);

      return `<figure><img src="/images/${filename}" /></figure>`;
    });

    n2m.setCustomTransformer('column_list', async (block) => {
      const mdBlocks = await n2m.pageToMarkdown(block.id);

      const strings = mdBlocks.map((block) => {
        const { parent: contentString } = n2m.toMarkdownString(block.children);
        return `<div>
    ${contentString}</div>`;
      });

      return `<div class="column">${strings.join('')}</div>`;
    });

    const page = (await notion.pages.retrieve({
      page_id: pageId,
    })) as PageObjectResponse;
    const mdBlocks = await n2m.pageToMarkdown(pageId);

    const { parent: contentString } = n2m.toMarkdownString(mdBlocks);

    const properties = page.properties;

    const imageName = properties['Image Name'];
    const title = properties['Title'];
    const slug = properties['Slug'];
    const excerpt = properties['Excerpt'];
    const date = properties['Published Date'];
    const section = properties['Section'];
    const showTocProp = properties['Show TOC'];

    const titleText =
      title.type === 'title' && title.title[0]?.plain_text ? title.title[0].plain_text : undefined;

    if (!titleText) {
      throw new ValidationError(`Missing title for page ${pageId}`, 'title');
    }

    const slugText =
      slug.type === 'rich_text' && slug.rich_text[0]?.plain_text
        ? slug.rich_text[0]?.plain_text
        : 'no-slug';

    if (!slugText) {
      throw new ValidationError(`Missing slug for post: ${titleText}`, 'slug');
    }

    const coverImage =
      imageName?.type === 'rich_text' && imageName.rich_text && imageName.rich_text[0]
        ? imageName.rich_text[0].plain_text
        : undefined;

    if (!coverImage) {
      throw new ValidationError(`Missing cover image for post: ${titleText}`, 'coverImage');
    }

    const sectionText =
      section?.type === 'select' && section.select ? section.select.name : undefined;

    const showToc = showTocProp?.type === 'checkbox' ? showTocProp.checkbox : undefined;

    const excerptText =
      excerpt.type === 'rich_text' && excerpt.rich_text[0]?.plain_text
        ? excerpt.rich_text[0]?.plain_text
        : undefined;

    if (!excerptText) {
      throw new ValidationError(`Missing excerpt for post: ${titleText}`, 'excerpt');
    }

    const dateText = date.type === 'date' && date.date?.start ? date.date?.start : undefined;

    if (!dateText) {
      throw new ValidationError(`Missing date for post: ${titleText}`, 'date');
    }

    const post: Post = {
      id: page.id,
      title: titleText,
      slug: slugText,
      excerpt: excerptText,
      coverImage,
      date: dateText,
      dateModified: page.last_edited_time,
      content: contentString,
      section: sectionText,
      showToc,
      author: 'Brennan Moore',
    };

    return post;
  } catch (error) {
    logError('getPostFromNotion', error, { pageId });
    return null;
  }
}
