# Trump Shit - Daily Digest

A daily digest aggregator that fetches and analyzes Trump-related news articles from multiple sources using AI-powered sentiment analysis and summarization.

Check out [Trump Shit](https://trumpshit.vercel.app/) hosted on Vercel

## Features

- 📰 **Multi-source aggregation** - Fetches articles from GNews API and RSS feeds
- 🤖 **AI-powered analysis** - Uses Hugging Face models for sentiment analysis and article summarization
- 🎨 **Modern UI** - Beautiful, responsive design with dark mode support
- ⚡ **Auto-updates** - Automatically refreshes daily via Vercel cron jobs
- 📊 **Sentiment tracking** - Categorizes articles as positive, negative, or neutral

## Tech Stack

- **Framework**: Next.js 15
- **Styling**: Tailwind CSS v4
- **AI/ML**: Hugging Face Inference API
- **Deployment**: Vercel
- **Data Sources**: GNews API, RSS feeds (BBC, NPR, RealClearPolitics)

The cron job will automatically run daily at 9:00 AM UTC (configured in `vercel.json`).

## Project Structure

```
trump-shit/
├── pages/
│   ├── api/
│   │   └── digest.js          # API endpoint for generating digest
│   ├── index.js                # Main page component
│   ├── _app.js                 # App wrapper
│   └── _document.js            # Document wrapper
├── src/
│   └── lib/
│       ├── fetchArticles.js    # Article fetching logic
│       └── analyzeArticles.js  # AI analysis logic
├── public/
│   └── digest.json             # Generated digest file
└── vercel.json                  # Vercel cron configuration
```

## License

MIT

