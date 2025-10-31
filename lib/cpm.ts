// lib/cpm.ts
export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

const CLOUD = process.env.BRINPAGE_API_BASE || 'https://cloud.brinpage.com';
const LICENSE =
  process.env.BRINPAGE_LICENSE_KEY ||
  process.env.BRINPAGE_API_KEY ||
  process.env.BRINPAGE_KEY ||
  '';

const LOCAL = process.env.BRINPAGE_SDK_ORIGIN || process.env.IA_STUDIO_ORIGIN || 'http://localhost:3027';

function resolveAskUrl() {
  if (LICENSE) return `${CLOUD}/api/sdk/ask`; 
  return `${LOCAL}/api/ask`;
}

function toQuestion(messages?: ChatMessage[]) {
  if (!messages?.length) return '';
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === 'user' && m.content?.trim()) return m.content.trim();
  }
  return messages.map(m => `${m.role}: ${m.content}`).join('\n').trim();
}

export async function ask(opts: {
  question?: string;
  messages?: ChatMessage[];
  provider?: string;
  model?: string;
  stream?: boolean;
  context?: Record<string, unknown>;
  extraPrompts?: string[];   
  debugEcho?: boolean;
}) {
  const q = (opts.question ?? toQuestion(opts.messages)).trim();
  if (!q) throw new Error("Missing 'question' input");

  const url = resolveAskUrl();
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'accept': 'application/json',
  };
  if (url.includes('/api/sdk/ask')) {
    if (!LICENSE) throw new Error('Missing BRINPAGE_LICENSE_KEY to call Cloud');
    headers['authorization'] = `Bearer ${LICENSE}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      question: q,
      provider: opts.provider,
      model: opts.model,
      stream: Boolean(opts.stream),
      context: opts.context ?? {},
      extraPrompts: opts.extraPrompts,
      debugEcho: opts.debugEcho,
    }),
    cache: 'no-store',
  });

  const rawText = await res.text();
  let data: any = null; try { data = rawText ? JSON.parse(rawText) : null; } catch {}

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || (rawText && rawText.slice(0, 400)) || `ask failed (${res.status})`;
    throw new Error(msg);
  }

  return {
    text: (data?.text ?? data?.answer ?? data?.message ?? data?.output ?? '').toString(),
    raw: data ?? rawText,
  };
}
