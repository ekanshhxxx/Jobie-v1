import { NextRequest, NextResponse } from 'next/server';

const API_KEY = '08aa64d2c8b241afbf10e47fe7146210';
const BASE_URL = 'https://newsapi.org/v2/everything';

// Reputable tech/career sources only — blocks sports, celebrity, etc.
const DOMAINS =
  'techcrunch.com,wired.com,theverge.com,arstechnica.com,venturebeat.com,' +
  'zdnet.com,cnet.com,mashable.com,engadget.com,thenextweb.com,' +
  'businessinsider.com,forbes.com,fortune.com,bloomberg.com,reuters.com,' +
  'cnbc.com,hbr.org,fastcompany.com,inc.com,siliconangle.com,' +
  'infoworld.com,computerworld.com,sdtimes.com,devops.com,dev.to,' +
  'stackoverflow.blog,github.blog,openai.com,deepmind.google';

const QUERIES: Record<string, string> = {
  all: '("artificial intelligence" OR "machine learning" OR "tech jobs" OR hiring OR "job market" OR "software engineer" OR "generative AI" OR startup OR "big tech")',
  jobs: '("job market" OR hiring OR "tech jobs" OR "software jobs" OR "career opportunities" OR layoffs OR "job growth" OR recruitment OR "remote work" OR "salary")',
  ai: '("artificial intelligence" OR "machine learning" OR "large language model" OR "generative AI" OR ChatGPT OR "AI agents" OR "deep learning" OR LLM OR "foundation model" OR "AI startup")',
  tech: '("software engineering" OR "startup funding" OR "big tech" OR developer OR "open source" OR "cloud computing" OR "SaaS" OR "venture capital" OR "Series A" OR "product launch")',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') ?? 'all';
  const q = QUERIES[category] ?? QUERIES.all;

  const pageSize = searchParams.get('pageSize') ?? '9';
  const page = searchParams.get('page') ?? '1';

  const url = new URL(BASE_URL);
  url.searchParams.set('q', q);
  url.searchParams.set('domains', DOMAINS);
  url.searchParams.set('language', 'en');
  url.searchParams.set('sortBy', 'publishedAt');
  url.searchParams.set('pageSize', pageSize);
  url.searchParams.set('page', page);
  url.searchParams.set('apiKey', API_KEY);

  try {
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: 'NewsAPI error', status: res.status }, { status: res.status });
    }
    const data = await res.json();
    // Strip articles with [Removed], missing image/title, or clearly non-tech titles
    const BAD_PATTERNS = /\b(football|soccer|nfl|nba|nhl|mlb|cricket|rugby|tennis|golf|matchday|fixture|goal|scored|stadium|coach|league table|transfer|wembley|premier league|bundesliga|champions league|la liga|serie a|ligue 1|wrexham|chelsea|manchester|arsenal|liverpool|barcelona|real madrid|bayern)\b/i;
    const articles = (data.articles ?? []).filter(
      (a: { title?: string; urlToImage?: string }) =>
        a.title &&
        a.title !== '[Removed]' &&
        a.urlToImage &&
        !BAD_PATTERNS.test(a.title)
    );
    return NextResponse.json({ articles });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
