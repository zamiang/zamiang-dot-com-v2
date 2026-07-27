# Notion Blog with Astro

A personal blog built with [Astro](https://astro.build/) using [Notion](https://developers.notion.com) as a headless CMS. Static site generation with React islands for interactivity.

**Live Site:** [www.zamiang.com](https://www.zamiang.com/)

## Tech Stack

- **Astro 7** – Static site generation
- **React 19** – Interactive components (islands)
- **Tailwind CSS 4** – Styling
- **Notion API** – Content management
- **Cloudflare Pages** – Deployment

## Getting Started

### Prerequisites

- Node.js 24.x
- Notion integration token ([setup guide](https://developers.notion.com/docs/getting-started))

### Environment Variables

Create a `.env` file:

```env
NOTION_TOKEN=secret_xxx
NOTION_DATA_SOURCE_ID=xxx
NOTION_PHOTOS_DATA_SOURCE_ID=xxx
SITE_URL=https://your-site.com
```

### Development

```bash
npm install
npm run dev      # Start dev server at localhost:4321
```

### Production

```bash
npm run build    # Build static site to dist/
npm run preview  # Preview build locally
```

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Build for production     |
| `npm run preview` | Preview production build |
| `npm test`        | Run tests                |
| `npm run lint`    | Run ESLint               |
| `npm run check`   | Astro type checking      |

## License

[MIT](LICENSE)
