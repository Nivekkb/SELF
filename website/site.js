(function () {
  const cfg = window.SELF_SITE || {};
  const docsUrl = typeof cfg.docsUrl === "string" ? cfg.docsUrl : null;
  const requestUrl = typeof cfg.requestUrl === "string" ? cfg.requestUrl : null;
  const demoApiUrl = typeof cfg.demoApiUrl === "string" ? cfg.demoApiUrl : null;
  const demoFlagUrl =
    typeof cfg.demoFlagUrl === "string"
      ? cfg.demoFlagUrl
      : demoApiUrl
        ? demoApiUrl.replace(/\/chat\/?$/, "/flag")
        : null;
  const demoReportUrl =
    typeof cfg.demoReportUrl === "string"
      ? cfg.demoReportUrl
      : demoApiUrl
        ? demoApiUrl.replace(/\/chat\/?$/, "/report")
        : null;
  const demoHeroesUrl =
    typeof cfg.demoHeroesUrl === "string"
      ? cfg.demoHeroesUrl
      : demoApiUrl
        ? demoApiUrl.replace(/\/chat\/?$/, "/heroes")
        : null;
  const demoMetricsUrl =
    typeof cfg.demoMetricsUrl === "string"
      ? cfg.demoMetricsUrl
      : demoApiUrl
        ? demoApiUrl.replace(/\/chat\/?$/, "/metrics")
        : null;

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

  const baselineOutputEl = document.getElementById("selfBaselineOutput");
  const governedOutputEl = document.getElementById("selfGovernedOutput");
  const baselineMetaEl = document.getElementById("selfBaselineMeta");
  const governedMetaEl = document.getElementById("selfGovernedMeta");
  const formEl = document.getElementById("selfChatForm");
  const inputEl = document.getElementById("selfChatInput");
  const sendEl = document.getElementById("selfChatSend");
  const resetEl = document.getElementById("selfChatReset");
  const whyEl = document.getElementById("selfWhyDetails");
  const auditEl = document.getElementById("selfAudit");
  const statePillEl = document.getElementById("selfStatePill2");
  const stateCodeEl = document.getElementById("selfStateCode2");
  const stateLabelEl = document.getElementById("selfStateLabel2");
  const flagBtnEl = document.getElementById("selfFlagBtn");
  const flagReasonEl = document.getElementById("selfFlagReason");
  const flagPublicEl = document.getElementById("selfFlagPublicToggle");
  const flagStatusEl = document.getElementById("selfFlagStatus");
  const downloadPdfEl = document.getElementById("selfDownloadPdfBtn");
  const metricsUpdatedEl = document.getElementById("selfMetricsUpdated");
  const metricsTotalEl = document.getElementById("selfMetricsTotalFlags");
  const metricsPublicEl = document.getElementById("selfMetricsPublicOptIn");
  const metricsByStateEl = document.getElementById("selfMetricsByState");
  const reportBtnEl = document.getElementById("selfReportBtn");
  const reportDialogEl = document.getElementById("selfReportDialog");
  const reportCloseEl = document.getElementById("selfReportClose");
  const reportFormEl = document.getElementById("selfReportForm");
  const reportNameEl = document.getElementById("selfReportName");
  const reportTierEl = document.getElementById("selfReportTier");
  const reportWhyEl = document.getElementById("selfReportWhy");
  const reportPromptEl = document.getElementById("selfReportPrompt");
  const reportResponseEl = document.getElementById("selfReportResponse");
  const reportScreenshotEl = document.getElementById("selfReportScreenshot");
  const reportScreenshotNoteEl = document.getElementById("selfReportScreenshotNote");
  const reportStatusEl = document.getElementById("selfReportStatus");
  const reportSubmitEl = document.getElementById("selfReportSubmit");
  const reportConsentLeaderboardEl = document.getElementById("selfReportConsentLeaderboard");
  const reportRuleNoHarmEl = document.getElementById("selfReportRuleNoHarm");
  const reportRuleNoSpamEl = document.getElementById("selfReportRuleNoSpam");
  const reportRuleNoHostageEl = document.getElementById("selfReportRuleNoHostage");
  const heroesBtnEl = document.getElementById("selfHeroesBtn");
  const heroesDialogEl = document.getElementById("selfHeroesDialog");
  const heroesCloseEl = document.getElementById("selfHeroesClose");
  const heroesUpdatedEl = document.getElementById("selfHeroesUpdated");
  const heroesListEl = document.getElementById("selfHeroesList");

  if (!baselineOutputEl || !governedOutputEl || !formEl || !inputEl || !sendEl || !auditEl || !statePillEl || !stateCodeEl || !stateLabelEl) return;
  if (!demoApiUrl) {
    baselineOutputEl.textContent = "Demo endpoint is not configured.";
    governedOutputEl.textContent = "Demo endpoint is not configured.";
    if (baselineMetaEl) baselineMetaEl.textContent = "Demo offline";
    if (governedMetaEl) governedMetaEl.textContent = "Demo offline";
    return;
  }

  const stateLabels = {
    S0: "calm",
    S1: "elevated",
    S2: "dysregulation risk",
    S3: "crisis trigger",
  };

  const checkLabels = {
    safety_check_passed: "Safety check passed",
    safety_check_failed: "Safety check failed",
    boundary_no_clinical_authority: 'Boundary rule enforced: "no clinical authority claims"',
    tone_lock_calm_warm_nondirective: "Tone lock: calm, warm, non-directive",
    word_cap_enforced: "Word cap enforced",
    question_cap_enforced: "Question cap enforced",
    repair_applied: "Repair applied",
    baseline_real_model_output: "Baseline is a real model output (Groq)",
    baseline_offline_fallback: "Baseline fallback (demo offline)",
    baseline_blocked_unsafe: "Baseline blocked: unsafe content",
    governed_unsafe_detected: "Governed output flagged: unsafe categories detected",
  };

  const safeText = (value) => String(value || "");

  const newSessionId = () => {
    try {
      if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    } catch {}
    return `sid_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  };

  const sessionStorageKey = "self_demo_session_id";
  let sessionId = "";
  try {
    sessionId = safeText(localStorage.getItem(sessionStorageKey));
  } catch {}
  if (!sessionId) {
    sessionId = newSessionId();
    try {
      localStorage.setItem(sessionStorageKey, sessionId);
    } catch {}
  }

  const history = [];
  let lastTurn = null; // last demo payload (for flagging)
  let lastUserMessage = "";

  const pdfEscape = (s) =>
    safeText(s)
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/\r/g, "")
      .replace(/\t/g, "    ");

  const wrapLines = (text, maxChars) => {
    const lines = [];
    const raw = safeText(text).split("\n");
    for (const part of raw) {
      const words = part.split(/\s+/).filter(Boolean);
      let line = "";
      for (const w of words) {
        const next = line ? `${line} ${w}` : w;
        if (next.length > maxChars && line) {
          lines.push(line);
          line = w;
        } else {
          line = next;
        }
      }
      if (line) lines.push(line);
      if (!words.length) lines.push("");
    }
    return lines;
  };

  const buildTranscriptPdf = (data) => {
    if (!data || !data.audit || !data.audit.eventId) throw new Error("no_event_to_export");

    const provider = data.provider || {};
    const policy = data.policy || {};
    const audit = data.audit || {};
    const outputs = data.outputs || {};

    const title = "SELF Governance Transcript";
    const subtitle = `Event ID: ${audit.eventId}`;

    const sections = [
      ["Prompt", lastUserMessage || ""],
      ["Baseline", (outputs.baseline && outputs.baseline.output) || ""],
      ["Governed", (outputs.governed && outputs.governed.output) || ""],
      [
        "Governance Metadata",
        [
          `Provider: ${provider.name || "unknown"}${provider.model ? ` (${provider.model})` : ""}`,
          `State: ${policy.state || "?"}`,
          `Hard caps: max ${policy.maxWords || "?"} words, max ${policy.maxQuestions || "?"} questions`,
          `Checks: ${(audit.checks || []).join(", ") || "—"}`,
          `Hash: ${audit.eventHash || "—"}`,
          `Signature: ${audit.eventSignature || "—"}`,
        ].join("\n"),
      ],
    ];

    const lines = [];
    lines.push(title);
    lines.push(subtitle);
    lines.push("");
    for (const [h, body] of sections) {
      lines.push(String(h));
      lines.push(...wrapLines(String(body || ""), 92));
      lines.push("");
    }

    // Very small PDF generator: single/multi-page text, Helvetica.
    const pageWidth = 612; // 8.5in * 72
    const pageHeight = 792; // 11in * 72
    const margin = 54;
    const fontSize = 11;
    const lineHeight = 14;
    const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);

    const pages = [];
    for (let i = 0; i < lines.length; i += maxLinesPerPage) pages.push(lines.slice(i, i + maxLinesPerPage));

    const objects = [];
    const offsets = [];
    const addObj = (s) => {
      offsets.push(objects.join("").length);
      objects.push(s);
    };

    const pageObjectIds = [];
    const contentObjectIds = [];

    // Placeholder IDs; we’ll append objects in order and track IDs by index.
    // 1: catalog, 2: pages, then each page + content, then font.
    let id = 1;
    const catalogId = id++;
    const pagesId = id++;
    const fontId = id++;

    // Build content streams + page objects.
    for (const pageLines of pages) {
      const contentId = id++;
      const pageId = id++;
      contentObjectIds.push(contentId);
      pageObjectIds.push(pageId);

      const textOps = [];
      textOps.push("BT");
      textOps.push(`/F1 ${fontSize} Tf`);
      textOps.push(`${margin} ${pageHeight - margin} Td`);
      for (let i = 0; i < pageLines.length; i += 1) {
        const line = pdfEscape(pageLines[i] || "");
        if (i > 0) textOps.push(`0 -${lineHeight} Td`);
        textOps.push(`(${line}) Tj`);
      }
      textOps.push("ET");
      const stream = textOps.join("\n");
      addObj(`${contentId} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`);

      addObj(
        `${pageId} 0 obj\n<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`,
      );
    }

    addObj(`${fontId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);
    addObj(
      `${pagesId} 0 obj\n<< /Type /Pages /Count ${pageObjectIds.length} /Kids [${pageObjectIds
        .map((pid) => `${pid} 0 R`)
        .join(" ")}] >>\nendobj\n`,
    );
    addObj(`${catalogId} 0 obj\n<< /Type /Catalog /Pages ${pagesId} 0 R >>\nendobj\n`);

    const header = "%PDF-1.4\n";
    const body = objects.join("");
    const xrefStart = header.length + body.length;
    let xref = "xref\n0 " + (id) + "\n";
    xref += "0000000000 65535 f \n";
    // offsets are relative to body start; adjust by header.
    // Note: offsets array order matches object add order (content/page/font/pages/catalog), but IDs are explicit inside strings.
    // We will compute offsets by searching each "<id> 0 obj" location to avoid mismatch.
    const full = header + body;
    const findOffset = (objId) => {
      const token = `\n${objId} 0 obj\n`;
      const idx = full.indexOf(token);
      return idx >= 0 ? idx + 1 : full.indexOf(`${objId} 0 obj`);
    };
    for (let objId = 1; objId < id; objId += 1) {
      const off = findOffset(objId);
      const n = String(Math.max(0, off)).padStart(10, "0");
      xref += `${n} 00000 n \n`;
    }
    const trailer =
      `trailer\n<< /Size ${id} /Root ${catalogId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
    const pdf = full + xref + trailer;

    return new Blob([pdf], { type: "application/pdf" });
  };

  const setPanelText = (el, text) => {
    if (!el) return;
    el.textContent = safeText(text);
  };

  const setPanelMeta = (el, text) => {
    if (!el) return;
    el.textContent = safeText(text);
  };

  const resetPanels = () => {
    setPanelText(baselineOutputEl, "Awaiting input.");
    setPanelText(governedOutputEl, "Awaiting input.");
    setPanelMeta(baselineMetaEl, "—");
    setPanelMeta(governedMetaEl, "—");
    auditEl.textContent = "Audit log will appear here.";
  };

  const setState = (state) => {
    const code = safeText(state);
    const label = stateLabels[code] || "state";
    statePillEl.dataset.state = code;
    stateCodeEl.textContent = code || "S0";
    stateLabelEl.textContent = label;
  };

  const renderAudit = (data) => {
    const audit = data && data.audit ? data.audit : null;
    const detection = data && data.detection ? data.detection : null;
    const policy = data && data.policy ? data.policy : null;
    const transition = data && data.transition ? data.transition : null;
    const provider = data && data.provider ? data.provider : null;
    const outputs = data && data.outputs ? data.outputs : null;

    const checks = Array.isArray(audit && audit.checks) ? audit.checks : [];
    const violations = Array.isArray(audit && audit.violations) ? audit.violations : [];

    const grid = document.createElement("div");
    grid.className = "audit-grid";

    for (const check of checks) {
      const item = document.createElement("div");
      item.className = "audit-item";
      item.textContent = checkLabels[check] || safeText(check);
      grid.appendChild(item);
    }

    const metaLines = [];
    if (provider && provider.name) {
      metaLines.push(`Model: ${provider.name}${provider.model ? ` (${provider.model})` : ""}`);
    }
    const baselineCats = outputs && outputs.baseline && Array.isArray(outputs.baseline.unsafeCategories) ? outputs.baseline.unsafeCategories : [];
    const governedCats = outputs && outputs.governed && Array.isArray(outputs.governed.unsafeCategories) ? outputs.governed.unsafeCategories : [];
    if (outputs && outputs.baseline && outputs.baseline.blocked && baselineCats.length) metaLines.push(`Baseline blocked: ${baselineCats.join(", ")}`);
    if (outputs && outputs.governed && outputs.governed.blocked && governedCats.length) metaLines.push(`Governed blocked: ${governedCats.join(", ")}`);
    if (policy && policy.state) metaLines.push(`State: ${policy.state} (max ${policy.maxWords} words, max ${policy.maxQuestions} questions)`);
    if (transition && transition.from && transition.to && transition.from !== transition.to) metaLines.push(`Transition: ${transition.from} → ${transition.to}`);
    if (detection && Array.isArray(detection.reasons) && detection.reasons.length) {
      metaLines.push(`Signals: ${detection.reasons.slice(0, 4).join(" · ")}`);
    }
    if (violations.length) metaLines.push(`Violations: ${violations.slice(0, 3).join(" · ")}`);
    if (audit && audit.eventId) metaLines.push(`Event: ${audit.eventId}`);
    if (audit && audit.eventHash) metaLines.push(`Hash: ${audit.eventHash}`);
    if (audit && audit.eventSignature) metaLines.push(`Signature: ${audit.eventSignature}`);

    const meta = document.createElement("div");
    meta.innerHTML = metaLines.map((l) => `<div><code>${l.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></div>`).join("");

    auditEl.innerHTML = "";
    auditEl.appendChild(grid);
    auditEl.appendChild(meta);

    if (whyEl) whyEl.open = true;
  };

  const setFlagStatus = (text) => {
    if (!flagStatusEl) return;
    flagStatusEl.textContent = safeText(text);
  };

  const setReportStatus = (text) => {
    if (!reportStatusEl) return;
    reportStatusEl.textContent = safeText(text);
  };

  const renderMetrics = (metrics) => {
    if (!metrics) return;
    if (metricsTotalEl) metricsTotalEl.textContent = safeText(metrics.totalFlags);
    if (metricsPublicEl) metricsPublicEl.textContent = safeText(metrics.totalPublicOptIn);
    if (metricsUpdatedEl) metricsUpdatedEl.textContent = metrics.updatedAt ? `Updated: ${metrics.updatedAt}` : "—";
    if (metricsByStateEl) {
      const byState = metrics.byState || {};
      const parts = ["S0", "S1", "S2", "S3"].map((s) => `${s}: ${byState[s] || 0}`);
      metricsByStateEl.textContent = parts.join(" · ");
    }
  };

  const fetchMetrics = async () => {
    if (!demoMetricsUrl) return;
    const res = await fetch(demoMetricsUrl, { method: "GET" });
    const payload = await res.json().catch(() => null);
    if (!res.ok) return;
    if (payload && payload.metrics) renderMetrics(payload.metrics);
  };

  const callDemo = async (message) => {
    const res = await fetch(demoApiUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "compare",
        message,
        sessionId,
        history,
      }),
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      const err = payload && payload.error ? payload.error : `http_${res.status}`;
      throw new Error(err);
    }
    return payload;
  };

  const submitFlag = async () => {
    if (!demoFlagUrl) {
      setFlagStatus("Flag endpoint is not configured.");
      return;
    }
    if (!lastTurn || !lastTurn.audit || !lastTurn.audit.eventId || !lastTurn.policy || !lastTurn.policy.state) {
      setFlagStatus("Send a message first, then flag the response you want reviewed.");
      return;
    }
    const reason = flagReasonEl ? flagReasonEl.value : "other";
    const includePublic = !!(flagPublicEl && flagPublicEl.checked);
    const body = {
      eventId: lastTurn.audit.eventId,
      state: lastTurn.policy.state,
      reason,
      includePublic,
      sessionId,
      message: lastUserMessage,
    };
    setFlagStatus("Submitting flag…");
    const res = await fetch(demoFlagUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      setFlagStatus(`Flag failed: ${payload && payload.error ? payload.error : `http_${res.status}`}`);
      return;
    }
    setFlagStatus("Flag submitted. Thank you.");
    if (payload && payload.metrics) renderMetrics(payload.metrics);
  };

  let reportScreenshot = null; // { mime, dataUrl, bytes, width, height }

  const compressScreenshotToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("screenshot_read_failed"));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("screenshot_decode_failed"));
        img.onload = () => {
          const maxW = 900;
          const scale = img.width > maxW ? maxW / img.width : 1;
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("canvas_unavailable"));
          ctx.drawImage(img, 0, 0, w, h);
          const quality = 0.72;
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          const b64 = dataUrl.split(",")[1] || "";
          const bytes = Math.floor((b64.length * 3) / 4);
          resolve({ mime: "image/jpeg", dataUrl, bytes, width: w, height: h });
        };
        img.src = String(reader.result || "");
      };
      reader.readAsDataURL(file);
    });

  const openReportDialog = () => {
    if (!reportDialogEl) return;
    if (reportPromptEl) reportPromptEl.value = safeText(lastUserMessage || "");
    if (reportResponseEl) {
      const governed =
        lastTurn && lastTurn.outputs && lastTurn.outputs.governed ? lastTurn.outputs.governed.output : "";
      reportResponseEl.value = safeText(governed || "");
    }
    if (reportNameEl) reportNameEl.value = "";
    if (reportConsentLeaderboardEl) reportConsentLeaderboardEl.checked = false;
    if (reportWhyEl) reportWhyEl.value = "";
    if (reportTierEl) reportTierEl.value = "1";
    if (reportScreenshotEl) reportScreenshotEl.value = "";
    reportScreenshot = null;
    if (reportScreenshotNoteEl) reportScreenshotNoteEl.textContent = "Optional, but recommended. Max ~350KB after compression.";
    setReportStatus("");

    try {
      if (typeof reportDialogEl.showModal === "function") reportDialogEl.showModal();
      else reportDialogEl.setAttribute("open", "open");
    } catch {
      reportDialogEl.setAttribute("open", "open");
    }
  };

  const closeReportDialog = () => {
    if (!reportDialogEl) return;
    try {
      if (typeof reportDialogEl.close === "function") reportDialogEl.close();
      else reportDialogEl.removeAttribute("open");
    } catch {
      reportDialogEl.removeAttribute("open");
    }
  };

  const submitReport = async () => {
    if (!demoReportUrl) {
      setReportStatus("Report endpoint is not configured.");
      return;
    }
    if (!lastTurn || !lastTurn.audit || !lastTurn.audit.eventId || !lastTurn.policy || !lastTurn.policy.state) {
      setReportStatus("Send a message first, then report the specific failure you want reviewed.");
      return;
    }
    const tier = reportTierEl ? Number(reportTierEl.value) : 1;
    const why = reportWhyEl ? safeText(reportWhyEl.value).trim() : "";
    if (!why) {
      setReportStatus("Please explain why you believe this is a governance/ethics failure.");
      return;
    }
    const prompt = reportPromptEl ? safeText(reportPromptEl.value) : safeText(lastUserMessage || "");
    const governed = reportResponseEl ? safeText(reportResponseEl.value) : "";
    const consentLeaderboard = !!(reportConsentLeaderboardEl && reportConsentLeaderboardEl.checked);
    const displayName = reportNameEl ? safeText(reportNameEl.value).trim() : "";
    if (consentLeaderboard && !displayName) {
      setReportStatus("If you consent to the leaderboard, please add a display name.");
      return;
    }

    const rules = {
      noHarmEncouragement: !!(reportRuleNoHarmEl && reportRuleNoHarmEl.checked),
      noSpamFloods: !!(reportRuleNoSpamEl && reportRuleNoSpamEl.checked),
      noEmotionalHostage: !!(reportRuleNoHostageEl && reportRuleNoHostageEl.checked),
    };
    if (!rules.noHarmEncouragement || !rules.noSpamFloods || !rules.noEmotionalHostage) {
      setReportStatus("Please confirm the rules before submitting.");
      return;
    }

    const screenshotPayload =
      reportScreenshot && reportScreenshot.dataUrl
        ? {
            mime: reportScreenshot.mime,
            dataUrl: reportScreenshot.dataUrl,
            bytes: reportScreenshot.bytes,
            width: reportScreenshot.width,
            height: reportScreenshot.height,
          }
        : null;

    const body = {
      eventId: lastTurn.audit.eventId,
      state: lastTurn.policy.state,
      tier,
      consentLeaderboard,
      displayName,
      prompt,
      governedResponse: governed,
      baselineResponse: lastTurn.outputs && lastTurn.outputs.baseline ? lastTurn.outputs.baseline.output : "",
      why,
      sessionId,
      audit: lastTurn.audit,
      rules,
      screenshot: screenshotPayload,
    };

    setReportStatus("Submitting report…");
    if (reportSubmitEl) reportSubmitEl.disabled = true;

    const res = await fetch(demoReportUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      const err = payload && payload.error ? payload.error : `http_${res.status}`;
      setReportStatus(err === "rate_limited" ? "Rate limit: 3 reports per week per tester." : `Report failed: ${err}`);
      if (reportSubmitEl) reportSubmitEl.disabled = false;
      return;
    }

    setReportStatus("Thank you — SELF improves under stress-testing because of people like you.");
    if (reportSubmitEl) reportSubmitEl.disabled = false;
  };

  const renderHeroes = (payload) => {
    const heroes = payload && payload.heroes ? payload.heroes : null;
    if (!heroesListEl || !heroes) return;
    const updatedAt = payload && payload.updatedAt ? payload.updatedAt : "";
    if (heroesUpdatedEl) heroesUpdatedEl.textContent = updatedAt ? `Updated: ${updatedAt}` : "—";

    heroesListEl.innerHTML = "";
    if (!Array.isArray(heroes) || heroes.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No opt-in heroes yet.";
      heroesListEl.appendChild(li);
      return;
    }
    for (const h of heroes) {
      const li = document.createElement("li");
      li.className = "demo-heroes-item";
      const left = document.createElement("span");
      left.className = "demo-heroes-name";
      left.textContent = safeText(h.name || "anonymous");
      const right = document.createElement("span");
      right.className = "demo-heroes-score";
      right.textContent = `Score ${safeText(h.score)} · Reports ${safeText(h.reports)}`;
      li.appendChild(left);
      li.appendChild(right);
      heroesListEl.appendChild(li);
    }
  };

  const fetchHeroes = async () => {
    if (!demoHeroesUrl) return null;
    const res = await fetch(demoHeroesUrl, { method: "GET" });
    const payload = await res.json().catch(() => null);
    if (!res.ok) return null;
    renderHeroes(payload);
    return payload;
  };

  const openHeroesDialog = () => {
    if (!heroesDialogEl) return;
    try {
      if (typeof heroesDialogEl.showModal === "function") heroesDialogEl.showModal();
      else heroesDialogEl.setAttribute("open", "open");
    } catch {
      heroesDialogEl.setAttribute("open", "open");
    }
    fetchHeroes().catch(() => {});
  };

  const closeHeroesDialog = () => {
    if (!heroesDialogEl) return;
    try {
      if (typeof heroesDialogEl.close === "function") heroesDialogEl.close();
      else heroesDialogEl.removeAttribute("open");
    } catch {
      heroesDialogEl.removeAttribute("open");
    }
  };

  resetPanels();

  formEl.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const message = safeText(inputEl.value).trim();
    if (!message) return;

    inputEl.value = "";
    lastUserMessage = message;
    sendEl.disabled = true;
    setPanelText(baselineOutputEl, "Working…");
    setPanelText(governedOutputEl, "Working…");
    setPanelMeta(baselineMetaEl, "Running");
    setPanelMeta(governedMetaEl, "Running");

    try {
      const data = await callDemo(message);

      const outputs = data && data.outputs ? data.outputs : {};
      const baseline = outputs.baseline && outputs.baseline.output ? outputs.baseline.output : "";
      const baselineBlocked = !!(outputs.baseline && outputs.baseline.blocked);
      const governed = outputs.governed && outputs.governed.output ? outputs.governed.output : "";
      const provider = data && data.provider ? data.provider : null;
      const providerLabel =
        provider && provider.name === "groq" ? `Groq${provider.model ? `: ${provider.model}` : ""}` : "offline";
      const state = data && data.policy && data.policy.state ? data.policy.state : "S0";

      if (baselineBlocked) {
        setPanelText(
          baselineOutputEl,
          [
            "Baseline outcome: Blocked by safety filter",
            "What you don’t see (by design): potentially unsafe instructions",
            "Why this matters: governance should prevent unsafe output before it’s generated and provide safer support behavior, not only a hard stop.",
            "This preserves proof without displaying risky text.",
          ].join("\n\n"),
        );
      } else {
        setPanelText(baselineOutputEl, baseline || "(no baseline)");
      }
      setPanelText(governedOutputEl, governed || "(no response)");
      setPanelMeta(baselineMetaEl, providerLabel);
      setPanelMeta(governedMetaEl, `State ${state}`);

      if (data && data.policy && data.policy.state) setState(data.policy.state);
      renderAudit(data);
      lastTurn = data;
      setFlagStatus("");

      history.push({ role: "user", content: message });
      history.push({ role: "assistant", content: governed || "" });
      if (history.length > 24) history.splice(0, history.length - 24);
    } catch (err) {
      const errText = `Demo request failed: ${safeText(err && err.message ? err.message : err)}`;
      setPanelText(baselineOutputEl, errText);
      setPanelText(governedOutputEl, errText);
      setPanelMeta(baselineMetaEl, "Error");
      setPanelMeta(governedMetaEl, "Error");
    } finally {
      sendEl.disabled = false;
      inputEl.focus();
    }
  });

  document.querySelectorAll("[data-self-prompt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const prompt = btn.getAttribute("data-self-prompt") || "";
      inputEl.value = prompt;
      inputEl.focus();
      formEl.requestSubmit();
    });
  });

  if (resetEl) {
    resetEl.addEventListener("click", () => {
      history.length = 0;
      lastUserMessage = "";
      // Keep the last audit + event available for flagging, even if the chat is cleared.
      // (Reset should clear the chat view, not "reset flags/metrics".)
      resetPanels();
    });
  }

  if (reportBtnEl) {
    reportBtnEl.addEventListener("click", () => openReportDialog());
  }
  if (reportCloseEl) {
    reportCloseEl.addEventListener("click", () => closeReportDialog());
  }
  if (reportDialogEl) {
    reportDialogEl.addEventListener("click", (ev) => {
      if (ev && ev.target === reportDialogEl) closeReportDialog();
    });
  }
  if (reportScreenshotEl) {
    reportScreenshotEl.addEventListener("change", async () => {
      const file = reportScreenshotEl.files && reportScreenshotEl.files[0] ? reportScreenshotEl.files[0] : null;
      if (!file) {
        reportScreenshot = null;
        if (reportScreenshotNoteEl) reportScreenshotNoteEl.textContent = "Optional, but recommended. Max ~350KB after compression.";
        return;
      }
      setReportStatus("");
      if (reportScreenshotNoteEl) reportScreenshotNoteEl.textContent = "Compressing screenshot…";
      try {
        const compressed = await compressScreenshotToDataUrl(file);
        reportScreenshot = compressed;
        const kb = Math.round((compressed.bytes || 0) / 1024);
        if (reportScreenshotNoteEl) reportScreenshotNoteEl.textContent = `Attached: ${kb}KB (${compressed.width}×${compressed.height}).`;
      } catch (err) {
        reportScreenshot = null;
        if (reportScreenshotNoteEl) reportScreenshotNoteEl.textContent = "Could not attach screenshot (try a smaller image).";
        setReportStatus(`Screenshot failed: ${safeText(err && err.message ? err.message : err)}`);
      }
    });
  }
  if (reportFormEl) {
    reportFormEl.addEventListener("submit", (ev) => {
      ev.preventDefault();
      submitReport().catch((err) => setReportStatus(`Report failed: ${safeText(err && err.message ? err.message : err)}`));
    });
  }

  if (heroesBtnEl) {
    heroesBtnEl.addEventListener("click", () => openHeroesDialog());
  }
  if (heroesCloseEl) {
    heroesCloseEl.addEventListener("click", () => closeHeroesDialog());
  }
  if (heroesDialogEl) {
    heroesDialogEl.addEventListener("click", (ev) => {
      if (ev && ev.target === heroesDialogEl) closeHeroesDialog();
    });
  }

  if (flagBtnEl) {
    flagBtnEl.addEventListener("click", () => {
      submitFlag().catch((err) => setFlagStatus(`Flag failed: ${safeText(err && err.message ? err.message : err)}`));
    });
  }

  if (downloadPdfEl) {
    downloadPdfEl.addEventListener("click", () => {
      try {
        if (!lastTurn) throw new Error("no_event_to_export");
        const blob = buildTranscriptPdf(lastTurn);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const eventId = lastTurn && lastTurn.audit && lastTurn.audit.eventId ? lastTurn.audit.eventId : "self";
        a.href = url;
        a.download = `self-transcript-${eventId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5_000);
      } catch (err) {
        setFlagStatus(`PDF export failed: ${safeText(err && err.message ? err.message : err)}`);
      }
    });
  }

  fetchMetrics().catch(() => {});
  setInterval(() => fetchMetrics().catch(() => {}), 15_000);
})();
