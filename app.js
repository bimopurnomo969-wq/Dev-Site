// app.js
(function() {
    'use strict';

    const $ = s => document.querySelector(s);
    let me = null, pf = null, cur = 'home';
    let S = { channel: 'https://whatsapp.com/channel/0029Vb9kIdD2f3ELjmdI5p3i', admin_wa: '6283189141345', ig: 'chronoxstar', info: 'Selamat datang di ChronoXStar' };
    const isAd = () => pf?.role === 'admin';
    const sb = supabase.createClient(API.supabaseUrl, API.supabaseKey);

    function toast(t) {
        const e = $('#ts');
        e.textContent = t;
        e.hidden = false;
        clearTimeout(toast.i);
        toast.i = setTimeout(() => e.hidden = true, 3200);
    }

    function go(v) {
        cur = v;
        document.querySelectorAll('.v').forEach(e => e.hidden = e.id !== 'v-' + v);
        document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.go === v));
        window.scrollTo(0, 0);
    }

    document.addEventListener('click', e => {
        const g = e.target.closest('[data-go]');
        if (g) go(g.dataset.go);
    });

    // --- Inisialisasi & Boot ---
    const B = {
        set(p, m) {
            const bar = $('#bbar'), pc = $('#bpc'), msg = $('#bmsg');
            if(bar) bar.style.width = p + '%';
            if(pc) pc.textContent = p + '%';
            if(msg && m) msg.textContent = m;
        },
        ok(n) {
            const k = $('#k' + n);
            if(k) k.classList.add('ok');
        },
        end() {
            const b = $('#boot');
            if (!b || B.d) return;
            B.d = 1;
            b.classList.add('off');
            setTimeout(() => b.remove(), 800);
        }
    };

    async function init() {
        setInterval(() => {
            const clk = $('#clk');
            if(clk) clk.textContent = new Date().toLocaleTimeString('id-ID', { hour12: false });
        }, 1000);

        $('#bskip').onclick = () => B.end();
        const https = location.protocol === 'https:';
        if ($('#bpr')) $('#bpr').textContent = https ? 'HTTPS' : 'LOKAL';
        if ($('#bnet')) $('#bnet').textContent = navigator.onLine ? 'ONLINE' : 'OFFLINE';
        if ($('#bsec')) $('#bsec').textContent = https ? 'KONEKSI AMAN' : 'MODE LOKAL';

        try {
            B.set(10, 'memeriksa koneksi...');
            await new Promise(r => setTimeout(r, 400));
            if (https) B.ok(1);
            if (navigator.onLine) B.ok(2);

            B.set(35, 'memuat pengaturan...');
            // Simulasi load settings (bisa dihubungkan ke API jika perlu)
            B.ok(3);

            B.set(65, 'memeriksa sesi login...');
            const { data: { session } } = await sb.auth.getSession();
            me = session?.user || null;
            B.ok(4);

            B.set(88, 'menyiapkan antarmuka...');
            sb.auth.onAuthStateChange((_e, s) => {
                if ((s?.user?.id || null) === (me?.id || null)) return;
                setTimeout(async () => {
                    me = s?.user || null;
                    go(cur === 'admin' && !isAd() ? 'home' : cur);
                }, 0);
            });
        } catch (e) {
            const msg = $('#bmsg');
            if(msg) msg.textContent = 'gagal terhubung, mode terbatas';
        }

        go('home');
        await new Promise(r => setTimeout(r, Math.max(0, 2600 - (Date.now() - performance.now()))));
        B.set(100, 'sistem siap');
        const bst = $('#bst');
        if(bst) bst.textContent = 'ready';
        await new Promise(r => setTimeout(r, 500));
        B.end();
        
        // Inisialisasi Tools UI
        renderTools();
    }

    // --- Logika Tools ---
    function renderTools() {
        const tcat = 'Semua';
        const tgrid = $('#tgrid');
        const tcatEl = $('#tcat');
        if(!tcatEl || !tgrid) return;

        tcatEl.innerHTML = ['Semua', ...Object.keys(TOOLS.TC)].map(c => 
            `<button class="btn${c === 'Semua' ? ' on' : ''}" data-c="${c}">${c}</button>`
        ).join('');

        tcatEl.onclick = e => {
            const c = e.target.dataset.c;
            if (!c) return;
            document.querySelectorAll('#tcat .btn').forEach(b => b.classList.toggle('on', b.dataset.c === c));
            toolGrid(c);
        };

        toolGrid('Semua');
    }

    function toolGrid(cat) {
        const q = ($('#tq')?.value || '').toLowerCase().trim();
        let h = '';
        for (const c in TOOLS.TC) {
            for (const n of TOOLS.TC[c]) {
                if ((cat === 'Semua' || cat === c) && (n + ' ' + (TOOLS.TD[n] || '')).toLowerCase().includes(q)) {
                    h += `<button class="gl fc tt" data-n="${n}"><span class="ico"><svg viewBox="0 0 24 24">${TOOLS.TI[c] || TOOLS.TI['Info']}</svg></span><small>${c}</small><b>${n}</b><span class="td">${TOOLS.TD[n] || ''}</span></button>`;
                }
            }
        }
        const tgrid = $('#tgrid');
        if(tgrid) tgrid.innerHTML = h || '<div class="card" style="grid-column:1/-1">Tidak ada tools yang cocok</div>';
    }

    if ($('#tq')) {
        $('#tq').oninput = () => toolGrid(document.querySelector('#tcat .btn.on')?.dataset.c || 'Semua');
    }

    if ($('#tgrid')) {
        $('#tgrid').onclick = e => {
            const t = e.target.closest('[data-n]');
            if (t) runTool(t.dataset.n);
        };
    }

    if ($('#tback')) {
        $('#tback').onclick = () => {
            const run = $('#tl-run');
            const list = $('#tl-list');
            if(run) run.hidden = true;
            if(list) list.hidden = false;
        };
    }

    function runTool(n) {
        const t = TOOLS.T[n];
        if (!t) return;
        const runEl = $('#tl-run');
        const listEl = $('#tl-list');
        const tf = $('#tf');
        
        if(runEl) runEl.hidden = false;
        if(listEl) listEl.hidden = true;

        if(tf) {
            tf.innerHTML = `<h3>${safeEscape(n)}</h3><small>${safeEscape(TOOLS.TD[n] || '')}</small>` + 
                Object.entries(t.f).map(([k, d]) => {
                    const l = k[0].toUpperCase() + k.slice(1);
                    return Array.isArray(d) 
                        ? `<label>${l}</label><select id="t-${k}">${d.map(o => `<option>${safeEscape(o)}</option>`).join('')}</select>` 
                        : `<label>${l}</label><input id="t-${k}" value="${safeEscape(d)}">`;
                }).join('') + '<button class="btn p" id="tr" style="width:100%;margin-top:10px">Jalankan</button><div id="to"></div>';

            const runBtn = $('#tr');
            const outEl = $('#to');
            
            const execute = async () => {
                const v = {};
                for (const k in t.f) {
                    const el = $(`#t-${k}`);
                    v[k] = el ? el.value.trim() : '';
                }
                
                if(outEl) {
                    outEl.innerHTML = '<div class="out ld">Memuat...</div>';
                    runBtn.classList.add('ld');
                }

                try {
                    const r = await t.run(v);
                    if (outEl) {
                        if (typeof r === 'string') {
                            outEl.innerHTML = `<div class="out">${safeEscape(r).replace(/\n/g, '<br>')}</div><button class="btn" id="tcp" style="margin-top:8px">Salin hasil</button>`;
                            const tcpBtn = $('#tcp');
                            if(tcpBtn) {
                                tcpBtn.onclick = async () => {
                                    try {
                                        await navigator.clipboard.writeText(r);
                                        toast('Disalin');
                                    } catch {
                                        toast('Gagal menyalin');
                                    }
                                };
                            }
                        } else if (r.html) {
                            safeHTML(outEl, `<div class="out">${r.html}</div>`);
                        }
                    }
                } catch (e) {
                    if(outEl) outEl.innerHTML = `<div class="out" style="color:#ff6b86">Gagal: ${safeEscape(e.message)}</div>`;
                }
                
                if(runBtn) runBtn.classList.remove('ld');
            };

            if(runBtn) runBtn.onclick = execute;
            
            // Allow Enter key to trigger execution
            if(tf) {
                tf.querySelectorAll('input').forEach(i => {
                    i.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); execute(); } };
                });
            }
        }
    }

    // Jalankan saat DOM siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Pembersihan saat halaman ditutup untuk mencegah memory leak
    window.addEventListener('beforeunload', () => {
        API.cancelAll();
    });
})();
