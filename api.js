// api.js
const API = (function() {
    'use strict';
    
    const CONTROLLERS = new Map();

    // Fetch dengan timeout dan abort controller untuk mencegah memory leak
    async function fetchWithTimeout(url, options = {}, timeout = 8000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        CONTROLLERS.set(url, controller);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    ...options.headers
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } finally {
            clearTimeout(id);
            CONTROLLERS.delete(url);
        }
    }

    function cancelAll() {
        for (const controller of CONTROLLERS.values()) {
            controller.abort();
        }
        CONTROLLERS.clear();
    }

    return {
        fetch: fetchWithTimeout,
        cancelAll,
        supabaseUrl: 'https://pxxwczitsdpktzcqmnen.supabase.co',
        supabaseKey: 'sb_publishable_rwLr533J5B6Csg_HqP1L7A_fkctYmZ3'
    };
})();
