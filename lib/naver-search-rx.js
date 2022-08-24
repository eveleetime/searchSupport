// ==UserScript==
// @exclude       *

// ==UserLibrary==
// @name          com.naver.search.rx
// @description   네이버 검색 RX 스크립트
// @license       Apache-2.0
// @version       1.0.0

// ==/UserScript==

// ==/UserLibrary==

// ==OpenUserJS==
// ==/OpenUserJS==
// ---------------------
(function(){Array.prototype.flat||Object.defineProperty(Array.prototype,"flat",{configurable:!0,value:function r(){var t=isNaN(arguments[0])?1:Number(arguments[0]);return t?Array.prototype.reduce.call(this,function(a,e){return Array.isArray(e)?a.push.apply(a,r.call(e,t-1)):a.push(e),a},[]):Array.prototype.slice.call(this)},writable:!0}),Array.prototype.flatMap||Object.defineProperty(Array.prototype,"flatMap",{configurable:!0,value:function(r){return Array.prototype.map.apply(this,arguments).flat()},writable:!0})})();
(function(){Object.fromEntries||Object.defineProperty(Object,"fromEntries",{configurable:!0,value:function r(){var t=arguments[0];return [...t].reduce((o,[k,v])=>(o[k]=v,o), {})},writable:!0})})();
// ---------------------
(function(window) {
    window.GM_xmlhttpRequestAsync = function(url, options) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest(Object.assign({ method: 'GET', url: url.toString(), onerror: reject, onload: resolve, }, options));
        });
    }
})(window);
// ---------------------
(function(window){
    function flatten(object, path = null, separator = '.') {
        return Object.keys(object).reduce((acc, key) => {
            const value = object[key];
            const newPath = Array.isArray(object) ? `${path ? path : ''}[${key}]` : [path, key].filter(Boolean).join(separator);
            const isObject = [typeof value === 'object', value !== null, !(value instanceof Date), !(value instanceof RegExp), !(Array.isArray(value) && value.length === 0),].every(Boolean);
            return isObject ? { ...acc, ...flatten(value, newPath, separator) } : { ...acc, [newPath]: value };
        }, {});
    }
    function map_categories(nlu_category = '') {
        const categories = [];
        categories.push({ name: '문학·책', id: 5 });
        categories.push({ name: '영화', id: 6 });
        categories.push({ name: '미술·디자인', id: 8 });
        categories.push({ name: '공연·전시', id: 7 });
        categories.push({ name: '음악', id: 11 });
        categories.push({ name: '드라마', id: 9 });
        categories.push({ name: '스타·연예인', id: 12 });
        categories.push({ name: '만화·애니', id: 13 });
        categories.push({ name: '방송', id: 10 });
        categories.push({ name: '일상·생각', id: 14 });
        categories.push({ name: '육아·결혼', id: 15 });
        categories.push({ name: '애완·반려동물', id: 16 });
        categories.push({ name: '좋은글·이미지', id: 17 });
        categories.push({ name: '패션·미용', id: 18 });
        categories.push({ name: '인테리어·DIY', id: 19 });
        categories.push({ name: '요리·레시피', id: 20 });
        categories.push({ name: '상품리뷰', id: 21 });
        categories.push({ name: '원예·재배', id: 36 });
        categories.push({ name: '게임', id: 22 });
        categories.push({ name: '스포츠', id: 23 });
        categories.push({ name: '사진', id: 24 });
        categories.push({ name: '자동차', id: 25 });
        categories.push({ name: '취미', id: 26 });
        categories.push({ name: '국내여행', id: 27 });
        categories.push({ name: '세계여행', id: 28 });
        categories.push({ name: '맛집', id: 29 });
        categories.push({ name: 'IT·컴퓨터', id: 30 });
        categories.push({ name: '사회·정치', id: 31 });
        categories.push({ name: '건강·의학', id: 32 });
        categories.push({ name: '비즈니스·경제', id: 33 });
        categories.push({ name: '어학·외국어', id: 35 });
        categories.push({ name: '교육·학문', id: 34 });
        return (nlu_category || '').split(' ').map((id) => categories.find((o)=>o.id == id)).filter(v=>!!v).map(o=>o.name);
    }
    async function NR_Request(keyword, where = 'm_view') {
        const ref = new URL('https://search.naver.com/search.naver?ie=UTF-8&query=&sm=chr_hty');
        const uri = new URL('https://m.search.naver.com/search.naver?where=m_view&sm=mtb_jum&query=');
        if(location.hostname.includes('search.naver.com')) uri.search = location.search;
        uri.searchParams.set('where', where);
        uri.searchParams.set('query', keyword);
        uri.searchParams.set('mode', 'normal');
        ref.searchParams.set('query', keyword);
        return GM_xmlhttpRequestAsync(uri, { headers: { 'referer': ref.toString() } });
    }
    window.NR_info = async function NR_info(keyword, where) {
        const res = await NR_Request(keyword, where);
        const doc = new DOMParser().parseFromString(res.responseText, 'text/html');
        const api = doc.querySelector('.review_loading[data-api], [data-loading-class="u_pg_new_loading"][data-api]'); if(!api) return {};
        const url = api && api.dataset.api, uri = new URL(url);
        const prm = Object.fromEntries(uri.searchParams.entries());
        const map = Object.keys(prm).reduce((map, key) => (map[key] = ((v)=>{ try { return JSON.parse(v) } catch(e){ return v; } })(prm[key]), map), {});
        const obj = Object.assign({}, flatten(map, null, '$'), map);
        if(obj && obj.nlu_query && obj.nlu_query.r_category) {
            obj.nlu_query.r_category = map_categories(obj.nlu_query.r_category).join(', ') || '(알 수 없음)';
            obj['nlu_query$r_category'] = obj.nlu_query.r_category;
        }
        return obj;
    }
    window.NR_terms = async function NR_terms(keyword)  {
        const m_view = await NR_info(keyword, 'm_view');
        const m_blog = await NR_info(keyword, 'm_blog');
        return Object.assign({ query: m_view.query || m_blog.query }, m_view.nqx_theme, m_blog.nlu_query);
    }
    window.NR_termsAll = async function NR_termsParagraph(...keywords) {
        const uniqs = keywords.filter((word, index, keywords)=>keywords.indexOf(word) == index);
        const terms = []; while(uniqs.length) { terms.push((await Promise.all(uniqs.splice(0, 5).map(NR_terms))).flat()); }
        return terms.flat();
    }
})(window);