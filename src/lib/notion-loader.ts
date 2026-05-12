/**
 * Custom Astro Content Loader for Notion
 *
 * This loader fetches content from Notion databases and converts it to markdown,
 * handling image downloads and custom block transformations.
 */
import { Client } from '@notionhq/client';
import { ImageBlockObjectResponse } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/';
import type { Loader, LoaderContext } from 'astro/loaders';
import { NotionToMarkdown } from 'notion-to-md';

import { downloadImage, getFilename } from './download-image';

export interface NotionLoaderOptions {
  /** Notion data source ID (database ID) */
  dataSourceId: string;
  /** Optional filter for the Notion query */
  filter?: {
    property: string;
    select?: { equals: string };
    status?: { equals: string };
  };
  /** Property name for the section filter */
  sectionFilter?: string;
}

export interface NotionPost {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  date: string;
  dateModified?: string;
  excerpt?: string;
  content: string;
  author: string;
  section?: string;
  showToc?: boolean;
}

/**
 * Creates a Notion content loader for Astro
 */
export function notionLoader(options: NotionLoaderOptions): Loader {
  return {
    name: 'notion-loader',
    load: async (context: LoaderContext) => {
      const { store, logger, parseData } = context;

      const token = import.meta.env.NOTION_TOKEN || process.env.NOTION_TOKEN;

      if (!token) {
        logger.warn('NOTION_TOKEN not set, skipping Notion content load');
        return;
      }

      if (!options.dataSourceId) {
        logger.warn('dataSourceId not provided, skipping Notion content load');
        return;
      }

      logger.info(`Loading content from Notion data source: ${options.dataSourceId}`);

      const notion = new Client({ auth: token });
      const n2m = new NotionToMarkdown({ notionClient: notion });

      // Custom transformer for images - downloads to local public folder
      n2m.setCustomTransformer('image', async (block) => {
        const { image } = block as ImageBlockObjectResponse;
        const src = image.type === 'external' ? image.external.url : image.file.url;
        const filename = getFilename(src);

        // Download image for local serving
        try {
          await downloadImage(src);
        } catch {
          logger.warn(`Failed to download image: ${src}`);
        }

        // Notion image blocks carry an optional rich-text caption — surface it
        // as a <figcaption> so gallery layouts can render a title beneath each
        // photo. HTML-escape to keep the raw markdown string safe.
        const captionText = image.caption
          .map((rt) => rt.plain_text)
          .join('')
          .trim();
        const escape = (s: string) =>
          s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        const caption = captionText ? `<figcaption>${escape(captionText)}</figcaption>` : '';

        return `<figure><img src="/images/${filename}" alt="${escape(captionText)}" />${caption}</figure>`;
      });

      // Custom transformer for column layouts
      n2m.setCustomTransformer('column_list', async (block) => {
        const mdBlocks = await n2m.pageToMarkdown(block.id);

        const strings = mdBlocks.map((mdBlock) => {
          const { parent: contentString } = n2m.toMarkdownString(mdBlock.children);
          return `<div>${contentString}</div>`;
        });

        return `<div class="column">${strings.join('')}</div>`;
      });

      try {
        // Build the filter
        const filterConditions: Array<{
          property: string;
          status?: { equals: string };
          select?: { equals: string };
        }> = [
          {
            property: 'Status',
            status: { equals: 'Published' },
          },
        ];

        // Add section filter if specified
        if (options.filter?.property && options.filter?.select) {
          filterConditions.push({
            property: options.filter.property,
            select: options.filter.select,
          });
        }

        // Fetch published posts from Notion
        const response = await notion.dataSources.query({
          data_source_id: options.dataSourceId,
          filter: { and: filterConditions } as Parameters<
            typeof notion.dataSources.query
          >[0]['filter'],
          sorts: [
            {
              property: 'Published Date',
              direction: 'descending',
            },
          ],
        });

        const pages = response.results as PageObjectResponse[];
        logger.info(`Found ${pages.length} pages in Notion`);

        // Process each page
        for (const page of pages) {
          try {
            const post = await processNotionPage(page, n2m, logger);

            if (post) {
              // Parse and validate data against schema
              const data = await parseData({
                id: post.slug,
                data: post as unknown as Record<string, unknown>,
              });

              store.set({
                id: post.slug,
                data,
              });

              logger.debug(`Loaded: ${post.title}`);
            }
          } catch (error) {
            logger.error(`Failed to process page ${page.id}: ${error}`);
          }
        }

        logger.info(`Successfully loaded ${store.keys().length} posts`);
      } catch (error) {
        logger.error(`Failed to load from Notion: ${error}`);
        throw error;
      }
    },
  };
}

/**
 * Process a single Notion page into a post object
 */
async function processNotionPage(
  page: PageObjectResponse,
  n2m: NotionToMarkdown,
  logger: LoaderContext['logger'],
): Promise<NotionPost | null> {
  try {
    const mdBlocks = await n2m.pageToMarkdown(page.id);
    const { parent: contentString } = n2m.toMarkdownString(mdBlocks);

    const properties = page.properties;

    // Extract properties
    const imageName = properties['Image Name'];
    const title = properties['Title'];
    const slug = properties['Slug'];
    const excerpt = properties['Excerpt'];
    const date = properties['Published Date'];
    const section = properties['Section'];
    const showTocProp = properties['Show TOC'];

    // Extract title
    const titleText =
      title?.type === 'title' && title.title[0]?.plain_text ? title.title[0].plain_text : undefined;

    if (!titleText) {
      logger.warn(`Skipping page ${page.id}: missing title`);
      return null;
    }

    // Extract slug
    const slugText =
      slug?.type === 'rich_text' && slug.rich_text[0]?.plain_text
        ? slug.rich_text[0].plain_text
        : undefined;

    if (!slugText) {
      logger.warn(`Skipping page ${page.id}: missing slug`);
      return null;
    }

    // Extract cover image
    const coverImage =
      imageName?.type === 'rich_text' && imageName.rich_text && imageName.rich_text[0]
        ? imageName.rich_text[0].plain_text
        : undefined;

    if (!coverImage) {
      logger.warn(`Skipping page ${page.id}: missing cover image`);
      return null;
    }

    // Extract section
    const sectionText =
      section?.type === 'select' && section.select ? section.select.name : undefined;

    // Extract show TOC
    const showToc = showTocProp?.type === 'checkbox' ? showTocProp.checkbox : undefined;

    // Extract excerpt
    const excerptText =
      excerpt?.type === 'rich_text' && excerpt.rich_text[0]?.plain_text
        ? excerpt.rich_text[0].plain_text
        : undefined;

    // Extract date
    const dateText = date?.type === 'date' && date.date?.start ? date.date.start : undefined;

    if (!dateText) {
      logger.warn(`Skipping page ${page.id}: missing date`);
      return null;
    }

    return {
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
  } catch (error) {
    logger.error(`Error processing page ${page.id}: ${error}`);
    return null;
  }
}
