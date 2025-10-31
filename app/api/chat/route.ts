// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { ask, type ChatMessage } from '@/lib/cpm';

export const dynamic = 'force-dynamic';

function deriveHeuristics(input: string) {
  const q = (input || '').toLowerCase();

  const shouldPinApple =
    /(^|\W)(apple|squircle|esquina|esquinas)(\W|$)/i.test(input);

  const extraPrompts: string[] = shouldPinApple ? ['apple-context-check.md'] : [];

  const tags: string[] = [];
  if (/apple|ui|ux|squircle/i.test(input)) {
    tags.push('apple', 'ui', 'context');
  }
  if (/finstacking|finanzas|fintech/i.test(input)) {
    tags.push('finstacking', 'finance');
  }

  return { extraPrompts, tags };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') ?? '').trim() || 'Hello';

    const { extraPrompts, tags } = deriveHeuristics(q);

    const { text, raw } = await ask({
      question: q,
      provider: process.env.CPM_PROVIDER || 'openai',
      model: process.env.CPM_MODEL || 'gpt-4o-mini',
      ...(extraPrompts.length ? { extraPrompts } : {}),
      ...(tags.length ? { tags } : {}),
      debugEcho: true, 
    });

    return NextResponse.json({ ok: true, text, raw });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'unexpected error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      question?: string; q?: string; messages?: ChatMessage[];
      provider?: string; model?: string; stream?: boolean; context?: Record<string, unknown>;
      tags?: string[]; extraPrompts?: string[];
    };

    const question =
      (typeof body?.question === 'string' && body.question) ||
      (typeof body?.q === 'string' && body.q) ||
      '';

    const derived = deriveHeuristics(question);
    const extraPrompts = Array.isArray(body?.extraPrompts) ? body!.extraPrompts : derived.extraPrompts;
    const tags = Array.isArray(body?.tags) ? body!.tags : derived.tags;

    const { text, raw } = await ask({
      question,
      messages: body?.messages,
      provider: body?.provider ?? process.env.CPM_PROVIDER ?? 'openai',
      model: body?.model ?? process.env.CPM_MODEL ?? 'gpt-4o-mini',
      stream: body?.stream,
      context: body?.context,
      ...(extraPrompts.length ? { extraPrompts } : {}),
      ...(tags.length ? { tags } : {}),
      debugEcho: true, 
    });

    return NextResponse.json({ ok: true, text, raw });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'unexpected error' }, { status: 500 });
  }
}
