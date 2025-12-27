(function () {
  const cfg = window.SELF_SITE || {};
  const docsUrl = typeof cfg.docsUrl === "string" ? cfg.docsUrl : null;
  const requestUrl = typeof cfg.requestUrl === "string" ? cfg.requestUrl : null;

  const setHref = (id, href) => {
    const el = document.getElementById(id);
    if (!el || !href) return;
    el.setAttribute("href", href);
  };

  setHref("docsLink", docsUrl);
  setHref("docsLink2", docsUrl);
  setHref("docsLink3", docsUrl);

  setHref("requestLink", requestUrl);
  setHref("requestLink2", requestUrl);
  setHref("requestStandard", requestUrl);
  setHref("requestPro", requestUrl);
})();
