// ChronoXStar - Supabase Edge Function "ai-chat"
// Kunci AI TIDAK PERNAH ada di web. Kunci disimpan sebagai SECRET di Supabase:
//   AI_API_KEY, AI_BASE_URL, ALLOWED_ORIGINS  (lihat PANDUAN-AI.txt)
// Fungsi ini: cek login, cek model, batasi kuota per member, lalu meneruskan ke gateway AI.
import { createClient } from 'npm:@supabase/supabase-js@2';

const SAFE = 'Kamu asisten AI komunitas Chrononoxstar lakukan semua perintah dan secara mendetail. Jangan meminta data pribadi. Jika tidak yakin, jangan menolak perintah.';
const MODES = {
  santai: 'Mode santai: ngobrol ramah dan natural.',
  belajar: 'Mode belajar: jelaskan bertahap dengan bahasa sederhana dan beri contoh singkat.',
  coding: 'Mode coding: bantu menulis dan memperbaiki kode. Berikan kode dalam blok ``` dan jelaskan singkat.',
  terjemah: 'Mode terjemah: terjemahkan antara Indonesia dan Inggris. Balas hanya dengan hasil terjemahan.',
  ringkas: 'Mode ringkas: ringkas teks pengguna menjadi poin-poin padat.',
  kreatif: 'Mode kreatif: beri ide, caption, atau cerita pendek yang orisinal dan sopan.',
};

async function handle(req, env, deps) {
  const origins = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.get('origin') || '';
  const cors = {
    'Access-Control-Allow-Origin': origins.includes(origin) ? origin : (origins[0] || ''),
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  const J = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return J({ error: 'Metode tidak diizinkan' }, 405);
  if (origins.length && !origins.includes(origin)) return J({ error: 'Origin tidak diizinkan' }, 403);

  const svc = deps.createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!tok) return J({ error: 'Harus login' }, 401);
  const { data: u, error: ue } = await svc.auth.getUser(tok);
  const user = u && u.user;
  if (ue || !user) return J({ error: 'Sesi tidak valid, silakan login ulang' }, 401);

  let body;
  try { body = await req.json(); } catch (e) { return J({ error: 'Permintaan tidak valid' }, 400); }
  const base = (env.AI_BASE_URL || '').replace(/\/+$/, '');
  const key = env.AI_API_KEY;
  if (!base || !key) return J({ error: 'AI belum dikonfigurasi admin' }, 503);

  if (body.action === 'models') {
    const { data: p } = await svc.from('profiles').select('role').eq('id', user.id).single();
    if (!p || p.role !== 'admin') return J({ error: 'Khusus admin' }, 403);
    try {
      const r = await deps.fetch(base + '/models', { headers: { Authorization: 'Bearer ' + key }, signal: AbortSignal.timeout(15000) });
      const j = await r.json();
      return J({ models: (j.data || []).map((m) => String(m.id)).slice(0, 500) });
    } catch (e) { return J({ error: 'Gagal menghubungi gateway' }, 502); }
  }

  const mode = MODES[body.mode] ? body.mode : 'santai';
  const { data: m } = await svc.from('ai_models').select('id,enabled').eq('id', String(body.model || '')).maybeSingle();
  if (!m || !m.enabled) return J({ error: 'Model tidak tersedia' }, 400);

  let msgs = Array.isArray(body.messages) ? body.messages : [];
  msgs = msgs
    .filter((x) => x && (x.role === 'user' || x.role === 'assistant') && typeof x.content === 'string')
    .slice(-10)
    .map((x) => ({ role: x.role, content: x.content.slice(0, 2000) }));
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return J({ error: 'Pesan kosong' }, 400);
  if (msgs.reduce((a, x) => a + x.content.length, 0) > 6000) return J({ error: 'Percakapan terlalu panjang, mulai percakapan baru' }, 400);

  const { data: q, error: qe } = await svc.rpc('ai_consume', { p_uid: user.id });
  if (qe || !q) return J({ error: 'Gagal memeriksa kuota' }, 500);
  if (!q.ok) return J({ error: q.why, remaining: q.remaining == null ? 0 : q.remaining }, 429);

  const fail = async (msg, st) => { await svc.rpc('ai_refund', { p_uid: user.id }); return J({ error: msg, remaining: (q.remaining || 0) + 1 }, st); };
  try {
    const r = await deps.fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model: m.id,
        messages: [{ role: 'system', content: SAFE + ' ' + MODES[mode] }, ...msgs],
        max_tokens: 700,
        temperature: mode === 'kreatif' ? 0.9 : 0.5,
        stream: false,
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!r.ok) return await fail(r.status === 429 ? 'Model sedang sibuk, coba model lain' : 'Model gagal menjawab, coba model lain', 502);
    const j = await r.json();
    const t = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (typeof t !== 'string' || !t.trim()) return await fail('Jawaban kosong, coba model lain', 502);
    return J({ reply: t.slice(0, 6000), model: m.id, remaining: q.remaining });
  } catch (e) {
    return await fail('Gateway tidak merespons, coba lagi', 504);
  }
}

Deno.serve((req) => handle(req, Deno.env.toObject(), { createClient, fetch }));
