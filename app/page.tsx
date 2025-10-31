// app/page.tsx
'use client';
import { useEffect, useRef, useState } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function Home() {
  const [input, setInput] = useState('Give me a 1-sentence hello.');
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, loading]);

  const send = async () => {
    const message = input.trim();
    if (!message) return;
    setMsgs(m => [...m, { role: 'user', content: message }]);
    setInput(''); setLoading(true);

    try {
      const res = await fetch('/api/chat?q=' + encodeURIComponent(message));
      const data = await res.json();
      const text =
        data?.text ||
        data?.answer ||
        data?.output ||
        data?.choices?.[0]?.message?.content ||
        JSON.stringify(data);

      setMsgs(m => [...m, { role: 'assistant', content: String(text) }]);
    } catch (e: any) {
      setMsgs(m => [...m, { role: 'assistant', content: `Error: ${e?.message || 'Backend error'}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center bg-neutral-900">
      <div className="w-full max-w-2xl p-4 sm:p-6">
        <h1 className="text-2xl font-semibold mb-4">BrinPage CPM · Working Quickstart</h1>
        <div className='border border-white/20 rounded-3xl bg-neutral-50/12 p-4'>
          <div className="h-[60vh] overflow-y-auto space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={'whitespace-pre-wrap rounded-2xl px-3 py-2 ' +
                (m.role === 'user' ? 'bg-blue-50 border border-blue-100' : 'bg-gray-100 border border-gray-200')}>
                <div className="text-xs uppercase tracking-wide mb-1 text-neutral-800">
                  {m.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div className="text-sm text-neutral-900">{m.content}</div>
              </div>
            ))}
            {loading && <div className="text-sm text-neutral-400">Thinking…</div>}
            <div ref={bottomRef} />
          </div>
          <div className="mt-4 flex gap-1">
            <input
              className="flex-1 border border-white/20 bg-neutral-900 rounded-2xl px-3 py-2 text-sm placeholder:text-neutral-400"
              placeholder="Type a message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <button onClick={send} className="px-4 py-2 border border-white/20 bg-neutral-900 text-white rounded-2xl text-sm cursor-pointer">
              Send
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
