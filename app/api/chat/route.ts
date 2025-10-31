// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { ask, type ChatMessage } from '@/lib/cpm';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') ?? '').trim() || 'Hello';
    const { text, raw } = await ask({
      question: q,
      provider: process.env.CPM_PROVIDER || 'openai',
      model: process.env.CPM_MODEL || 'gpt-4o-mini',
      // 🔽 inyecta el doc de verificación
      extraPrompts: ['tests/apple-context-check.md'],
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
    };

    const question = (typeof body?.question === 'string' && body.question) || (typeof body?.q === 'string' && body.q) || '';

    const { text, raw } = await ask({
      question,
      messages: body?.messages,
      provider: body?.provider ?? process.env.CPM_PROVIDER ?? 'openai',
      model: body?.model ?? process.env.CPM_MODEL ?? 'gpt-4o-mini',
      stream: body?.stream,
      context: body?.context,
      // 🔽 lo enviamos también en POST por si usas esta ruta
      extraPrompts: ['tests/apple-context-check.md'],
      debugEcho: true,
    });

    return NextResponse.json({ ok: true, text, raw });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'unexpected error' }, { status: 500 });
  }
}
