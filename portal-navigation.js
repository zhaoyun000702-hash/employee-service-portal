(() => {
  "use strict";
  function homeUrl() {
    const source = document.getElementById("portal-home-url");
    return source ? JSON.parse(source.textContent) : new URL("./index.html",location.href).href;
  }
  function url(route) {
    const bundled = document.getElementById("standalone-portal-document");
    const target = new URL(bundled ? location.href : "./portal.html",location.href);
    const revision = document.querySelector('meta[name="portal-build"]')?.content;
    if (!bundled && revision) target.searchParams.set("v",revision);
    target.hash = new URLSearchParams(route).toString();
    return target.href;
  }
  function open(route) { window.open(url(route),"_blank","noopener,noreferrer"); }
  window.PortalNavigation=Object.freeze({url,open,homeUrl});
})();
