// ==UserScript==
// @exclude       *

// ==UserLibrary==
// @name          GM_xmlhttpRequestAsync
// @description   GM_xmlhttpRequestAsync 스크립트
// @license       Apache-2.0
// @version       1.0.0

// ==/UserScript==

// ==/UserLibrary==

// ==OpenUserJS==
// ==/OpenUserJS==
(function(window) {
  window.GM_xmlhttpRequestAsync = function(url, options) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest(Object.assign({ method: 'GET', url: url.toString(), onerror: reject, onload: resolve, }, options));
    });
  }
})(window);