
// ==UserScript==
// @exclude       *

// ==UserLibrary==
// @name          GM_addScript
// @description   GM_addScript 스크립트
// @license       Apache-2.0
// @version       1.0.0

// ==/UserScript==

// ==/UserLibrary==

// ==OpenUserJS==
// ==/OpenUserJS==
(function(window) {
  window.inject_js = function inject_js(script) {
    const container = (document.head || document.body || document.documentElement);
    const element = document.createElement('script');
    element.setAttribute('type', 'text/javascript');
    const remote = (()=>{ try { return !!new URL(script); } catch(e) { return !1; } })();
    if(remote) { element.setAttribute('src', script); } else { element.textContent = `(${script})()`; }
    container.append(element);
    element.onload = function() { try{ container.removeChild(element); } catch(e) {} };
    setTimeout(function(){ try{ container.removeChild(element); } catch(e) {} }, 300);
  }
  window.GM_addScript = window.GM_addScript || window.inject_js;
})(window);
