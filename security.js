// security.js
(function() {
    'use strict';
    
    // 1. Anti-Clickjacking (Mencegah situs dimuat dalam iframe jahat)
    if (window.top !== window.self) {
        try {
            window.top.location = window.self.location;
        } catch (e) {
            document.documentElement.innerHTML = '<h1 style="color:red;text-align:center;margin-top:20%">Akses Ditolak: Framing Tidak Diizinkan</h1>';
        }
    }

    // 2. Basic Anti-Debugging (Guard)
    // Mendeteksi pembukaan DevTools berdasarkan perubahan ukuran window
    let devtoolsOpen = false;
    const threshold = 160;
    setInterval(() => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        if (widthThreshold || heightThreshold) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                console.clear();
                console.log('%cStop!', 'color: red; font-size: 30px; font-weight: bold;');
                console.log('%cIni adalah fitur browser yang ditujukan untuk developer. Jika seseorang menyuruh Anda menyalin dan menempel sesuatu di sini, itu adalah penipuan dan dapat memberikan akses ke akun Anda.', 'color: black; font-size: 14px;');
            }
        } else {
            devtoolsOpen = false;
        }
    }, 1000);

    // 3. Secure Escape (Pencegahan XSS untuk teks biasa)
    window.safeEscape = function(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>"']/g, function(c) {
            return '&#' + c.charCodeAt(0) + ';';
        });
    };

    // 4. Secure HTML Injection (Menggunakan DOMPurify)
    window.safeHTML = function(element, html) {
        if (!element) return;
        if (window.DOMPurify) {
            element.innerHTML = DOMPurify.sanitize(html, { 
                USE_PROFILES: { html: true },
                ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'div', 'img', 'small', 'code', 'pre'],
                ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'id', 'target', 'rel']
            });
        } else {
            // Fallback jika DOMPurify gagal dimuat
            element.textContent = html; 
        }
    };

    // 5. Disable Right Click pada area sensitif (Chat & Output Tools)
    document.addEventListener('contextmenu', function(e) {
        if (e.target.closest('#msgs, #tf, .m, .ani')) {
            e.preventDefault();
        }
    }, { passive: false });
})();
