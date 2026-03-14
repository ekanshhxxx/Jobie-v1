import { NextRequest, NextResponse } from 'next/server';

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';

const CAT_CONTEXT: Record<string, string> = {
  jobs: 'job market, hiring trends, tech layoffs, and career opportunities',
  ai: 'artificial intelligence, LLMs, generative AI, and machine learning breakthroughs',
  tech: 'software engineering, startups, big tech, cloud computing, and developer tooling',
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 503 });
  }

  const { headlines, category } = await req.json() as { headlines: string[]; category: string };
  if (!Array.isArray(headlines) || headlines.length === 0) {
    return NextResponse.json({ error: 'No headlines provided' }, { status: 400 });
  }

  const context = CAT_CONTEXT[category] ?? CAT_CONTEXT.tech;
  const prompt = `You are a sharp editorial analyst writing for "The Jobie Dispatch" — a newspaper for tech professionals and job seekers.

Topic domain: ${context}

Latest headlines:
${headlines.slice(0, 6).map((h, i) => `${i + 1}. ${h}`).join('\n')}

Write a punchy 2-sentence editorial insight synthesizing the most important trend from these headlines. Be specific, bold, and direct — like The Economist meets Hacker News. No hedging, no fluff, no "in conclusion". Start immediately with the insight itself.`;

  try {
    const res = await fetch(GROQ_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 160,
        temperature: 0.72,
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Groq error:', res.status, err);
      return NextResponse.json({ error: 'Groq API error' }, { status: res.status });
    }

    const data = await res.json();
    const insight: string = data.choices?.[0]?.message?.content?.trim() ?? '';
    return NextResponse.json({ insight });
  } catch (e) {
    console.error('Groq fetch failed:', e);
    return NextResponse.json({ error: 'Failed to reach Groq' }, { status: 500 });
  }
}
