// ==UserScript==
// @name         네이버 검색결과 지수 분석
// @description  네이버 검색결과에서 상대평가 지수를 확인할 수 있습니다.
// @namespace    http://tampermonkey.net/
// @license      Apache-2.0
// @author       NaebangFamily
// @version      1.0.0
// @updateURL    https://github.com/NaebangFamily/searchSupport/raw/master/src/main.user.js
// @downloadURL  https://github.com/NaebangFamily/searchSupport/raw/master/src/main.user.js
// @connect      naver.com
// @match        *://search.naver.com/search.naver?*
// @match        *://m.search.naver.com/search.naver?*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/gh/NaebangFamily/searchSupport@master/lib/gm-app.js
// @require      https://cdn.jsdelivr.net/gh/NaebangFamily/searchSupport@master/lib/gm-add-style.js
// @require      https://cdn.jsdelivr.net/gh/NaebangFamily/searchSupport@master/lib/gm-add-script.js
// @require      https://cdn.jsdelivr.net/gh/NaebangFamily/searchSupport@master/lib/gm-xmlhttp-request-async.js
// @require      https://cdn.jsdelivr.net/gh/NaebangFamily/searchSupport@master/lib/naver-search-rx.js
// @require      https://cdn.jsdelivr.net/gh/NaebangFamily/searchSupport@master/lib/naver-search-nx.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuidv4.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js
// ==/UserScript==

async function observe(target) {
    const uri = new URL(location.href), query = uri.searchParams.get('query'); 

    if(!query) 
        return;

    const observer = new MutationObserver(async function(mutations) {
        let start = (30 * (Math.ceil(Math.max(0, target.children.length) / 30) - 1)) + 1;
        await update(query, start);
    });

    const config = { attributes: true, childList: true, characterData: true };
    observer.observe(target, config);
    await update(query);
}
async function update(keyword, start = 1) {
    const uri = new URL(location.href);
    const mode = uri.searchParams.get('mode');
    const where = 'view';
    const items = Array.from(document.querySelectorAll('[data-cr-gdid][data-cr-rank]'));
    const scores = await NX_score(keyword, start, where, mode);
    await Promise.map(items, async (item) => {
        const title = item.querySelector('.total_tit');
        const score = scores.find((o)=>o.crGdid == item.dataset.crGdid); Object.assign(item.dataset, score);
        if(score) delete item.dataset.crTitleScore;
        if(!score && !item.dataset.crTitleScore && title) {
            item.dataset.crTitleScore = true;
            const scores = await NX_score(title.textContent, 1, where, mode);
            const score = scores.find((o)=>o.crGdid == item.dataset.crGdid); Object.assign(item.dataset, score);
        }
    });
}
GM_App(async function main() {
    GM_addStyle(`
    :not([data-cr-area="rvw*o"])[data-cr-rank]::after { display: block; margin: 0px 15px 15px; padding: 0.5rem 1rem; font-size: 14px; color: #000; font-weight: bold;  border-radius: 8px; }
    :not([data-cr-area="rvw*o"])[data-cr-rank][data-cr-score-a][data-cr-score-b][data-cr-score-c]::after { background-color: #52565e; color: #fff; content: '전문성: ' attr(data-cr-score-a) ' / 신뢰성: ' attr(data-cr-score-b) ' / 관련성: ' attr(data-cr-score-c) }
    :not([data-cr-area="rvw*o"])[data-cr-rank][data-cr-score-a][data-cr-score-b][data-cr-score-c][data-cr-title-score]::after { content: '전문성: ' attr(data-cr-score-a) ' / 신뢰성: ' attr(data-cr-score-b) ' / 관련성: (알 수 없음)' }
    :not([data-cr-area="rvw*o"])[data-cr-rank]:not([data-cr-score-a])::after { background-color: #e4002b; color: #fff; content: '오류 : 분석 결과를 알 수 없음.'; }
    `);
    const wrp = document.querySelector('ul.lst_total'); if(wrp) observe(wrp);
})