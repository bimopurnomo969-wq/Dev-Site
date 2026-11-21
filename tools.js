// tools.js
const TOOLS = (function() {
    'use strict';
    
    // Helper untuk kalkulator aman
    function calc(s) {
        let i = 0;
        const ws = () => { while (s[i] === ' ') i++; };
        const num = () => {
            const m = /^\d*\.?\d+/.exec(s.slice(i));
            if (!m) throw Error('Ekspresi tidak valid');
            i += m[0].length; return +m[0];
        };
        const prim = () => {
            ws(); const c = s[i];
            if (c === '(') { i++; const v = add(); ws(); if (s[i++] !== ')') throw Error('Kurung tidak seimbang'); return v; }
            if (c === '-') { i++; return -prim(); }
            if (c === '+') { i++; return prim(); }
            return num();
        };
        const pow = () => { const v = prim(); ws(); if (s[i] === '^') { i++; return Math.pow(v, pow()); } return v; };
        const mul = () => {
            let v = pow();
            for (;;) { ws(); const c = s[i]; if (c !== '*' && c !== '/' && c !== '%') return v; i++; const r = pow(); v = c === '*' ? v * r : c === '/' ? v / r : v % r; }
        };
        const add = () => {
            let v = mul();
            for (;;) { ws(); const c = s[i]; if (c !== '+' && c !== '-') return v; i++; const r = mul(); v = c === '+' ? v + r : v - r; }
        };
        const r = add(); ws(); if (i < s.length) throw Error('Ekspresi tidak valid'); return r;
    }

    const rnd = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
    const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
    const X = (f, run) => ({ f, run, u: 1 });
    const MO = {A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.'};
    const UN = {m:[1,'p'],km:[1e3,'p'],cm:[.01,'p'],mm:[.001,'p'],mil:[1609.344,'p'],kaki:[.3048,'p'],inci:[.0254,'p'],kg:[1,'b'],g:[.001,'b'],lb:[.45359237,'b'],oz:[.028349523,'b']};

    const T = {
        'Cuaca': { f: { kota: 'Jakarta' }, run: async v => {
            const g = (await API.fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&language=id&name=' + encodeURIComponent(v.kota))).results?.[0];
            if (!g) return 'Kota tidak ditemukan';
            const c = (await API.fetch(`https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`)).current;
            return `${g.name}, ${g.country}\nSuhu ${c.temperature_2m}°C | Kelembapan ${c.relative_humidity_2m}% | Angin ${c.wind_speed_10m} km/j`;
        }},
        'Kurs': { f: { jumlah: '1', dari: 'USD', ke: 'IDR' }, run: async v => {
            const r = (await API.fetch('https://open.er-api.com/v6/latest/' + encodeURIComponent(v.dari.toUpperCase()))).rates;
            const k = r?.[v.ke.toUpperCase()];
            return k ? `${v.jumlah} ${v.dari.toUpperCase()} = ${(v.jumlah * k).toLocaleString('id-ID')} ${v.ke.toUpperCase()}` : 'Mata uang tidak dikenal';
        }},
        'Jadwal Sholat': { f: { kota: 'Jakarta' }, run: async v => {
            const t = (await API.fetch('https://api.aladhan.com/v1/timingsByCity?country=Indonesia&method=20&city=' + encodeURIComponent(v.kota))).data.timings;
            return [['Subuh','Fajr'],['Dzuhur','Dhuhr'],['Ashar','Asr'],['Maghrib','Maghrib'],['Isya','Isha']].map(([n,k]) => n + ': ' + t[k]).join('\n');
        }},
        'Terjemah': { f: { teks: 'Selamat pagi', dari: 'id', ke: 'en' }, run: async v => 
            (await API.fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(v.teks)}&langpair=${encodeURIComponent(v.dari + '|' + v.ke)}`)).responseData.translatedText 
        },
        'QR Code': { f: { teks: 'https://whatsapp.com/channel/0029Vb9kIdD2f3ELjmdI5p3i' }, run: async v => 
            ({ html: `<img src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(v.teks)}" width="240" height="240" alt="QR">` }) 
        },
        // FITUR BARU: META SEARCH
        'Meta Search': { f: { query: 'ChronoXStar', sumber: ['Wikipedia', 'DuckDuckGo'] }, run: async v => {
            if (!v.query || v.query.trim() === '') return 'Masukkan kata kunci pencarian.';
            const q = encodeURIComponent(v.query.trim());
            let results = `🔍 Hasil pencarian untuk: "${safeEscape(v.query)}"\n\n`;
            
            if (v.sumber.includes('Wikipedia')) {
                try {
                    const data = await API.fetch(`https://id.wikipedia.org/api/rest_v1/page/summary/${q.replace(/ /g, '_')}`);
                    if (data && data.extract) {
                        results += `📚 *WIKIPEDIA*\n*${safeEscape(data.title)}*\n${safeEscape(data.extract)}\n\n`;
                    } else {
                        results += `📚 *WIKIPEDIA*: Tidak ditemukan.\n\n`;
                    }
                } catch (e) { results += `⚠️ *WIKIPEDIA*: Gagal memuat.\n\n`; }
            }
            
            if (v.sumber.includes('DuckDuckGo')) {
                try {
                    const data = await API.fetch(`https://api.duckduckgo.com/?q=${q}&format=json&no_redirect=1`);
                    if (data && data.AbstractText) {
                        results += `🌐 *DUCKDUCKGO*\n*${safeEscape(data.Heading)}*\n${safeEscape(data.AbstractText)}\n\n`;
                    } else {
                        results += `🌐 *DUCKDUCKGO*: Tidak ada hasil instan. Coba perluas kata kunci.\n\n`;
                    }
                } catch (e) { results += `⚠️ *DUCKDUCKGO*: Gagal memuat (mungkin diblokir CORS/AdBlock).\n\n`; }
            }
            return results;
        }},
        'Wikipedia': { f: { judul: 'Indonesia' }, run: async v => {
            const r = await fetch('https://id.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(v.judul.replace(/ /g, '_')));
            if (!r.ok) return 'Artikel tidak ditemukan';
            const j = await r.json();
            return j.title + '\n\n' + j.extract;
        }},
        'Cek IP': { f: {}, run: async () => 'IP publik kamu: ' + (await API.fetch('https://api.ipify.org?format=json')).ip },
        'Password': X({ panjang: '16', simbol: ['ya', 'tidak'] }, v => {
            const n = Math.min(Math.max(+v.panjang || 16, 6), 64);
            const s = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' + (v.simbol === 'ya' ? '!@#$%^&*()-_=+' : '');
            return Array.from({ length: n }, () => s[rnd(s.length)]).join('');
        }),
        'Kalkulator': X({ ekspresi: '(12+8)*3/2' }, v => String(calc(v.ekspresi.replace(/,/g, '.'))))
    };

    // Kategori Tools untuk UI
    const TC = {
        'Info': ['Cuaca', 'Jadwal Sholat', 'Kurs', 'Wikipedia', 'Terjemah', 'Meta Search'],
        'Web': ['Cek IP', 'QR Code'],
        'Teks': ['Password'],
        'Hitung': ['Kalkulator']
    };
    const TD = { 'Meta Search': 'Cari dari Wikipedia & DuckDuckGo sekaligus' };
    const TI = { 'Info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', 'Web': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>', 'Teks': '<path d="M5 6h14M12 6v13M8 19h8"/>', 'Hitung': '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01"/>' };

    return { T, TC, TD, TI };
})();
