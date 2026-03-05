(() => {
  const PREFERRED_MORPH_COLS = ["pos","person","number","tense","mood","voice","gender","case"];
  const DEFAULTS = { pos: "n", number: "p", case: "d" };
  const STORAGE_KEY = "gmf_saved_datasets_v1";
  const LAST_AUTO_SLOT = "last_uploaded_auto";

  const VALUE_LABELS = {
    pos: { p: "pronoun", v: "verb", r: "preposition", n: "noun", m: "numeral", l: "demonstrative", i: "interjection", g: "g", d: "adverb", c: "conjunction", a: "adjective" },
    number: { d: "dual", s: "singular", p: "plural" },
    mood: { i: "indicative", m: "imperative", o: "optative", p: "participle", s: "subjunctive" },
    gender: { f: "feminine", m: "masculine", n: "neuter" },
    tense: { a: "aorist", f: "future", i: "imperfect", l: "pluperfect", p: "p", r: "perfect", t: "future perfect" },
    voice: { a: "active", e: "mediopassive", m: "middle", p: "passive" }
  };

  const state = { rawRows: [], columns: [], morphCols: [], morphOrder: [], dropdowns: {}, updatingWidgets: false, dfMorph: null, dfFinal: null, requirePosFirst: true, fileName: null };

  const el = {
    csvFile: byId("csvFile"), loadStatus: byId("loadStatus"), morphControls: byId("morphControls"), autoLockSingletons: byId("autoLockSingletons"),
    formCol: byId("formCol"), endings: byId("endings"), accentInsensitive: byId("accentInsensitive"), lowercaseCompare: byId("lowercaseCompare"), addBinary: byId("addBinary"),
    binaryName: byId("binaryName"), binaryPositive: byId("binaryPositive"), baseName: byId("baseName"), btnMorph: byId("btnMorph"), btnEndings: byId("btnEndings"),
    btnDownload: byId("btnDownload"), btnReset: byId("btnReset"), statusBox: byId("statusBox"), tableWrap: byId("tableWrap"), previewMeta: byId("previewMeta"),
    previewSearch: byId("previewSearch"), saveSlotName: byId("saveSlotName"), savedDatasets: byId("savedDatasets"), btnSaveLocal: byId("btnSaveLocal"), btnLoadLocal: byId("btnLoadLocal"),
    btnDeleteLocal: byId("btnDeleteLocal"), statRows: byId("statRows"), statMorph: byId("statMorph"), statFinal: byId("statFinal"),
    startupSavedDatasets: byId("startupSavedDatasets"), btnStartupLoad: byId("btnStartupLoad"), vizDataset: byId("vizDataset"), vizPrimary: byId("vizPrimary"), vizSecondary: byId("vizSecondary"),
    vizTopN: byId("vizTopN"), vizSort: byId("vizSort"), btnViz: byId("btnViz"), vizWrap: byId("vizWrap")
  };

  function byId(id) { return document.getElementById(id); }
  function q(sel) { return document.querySelector(sel); }
  function normStr(x) { return String(x ?? "").trim(); }
  function safeSlug(s) { return String(s ?? "").replace(/[^A-Za-z0-9._-]+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "") || "filtered"; }
  function parseCsvList(s) { return String(s ?? "").split(",").map(x => x.trim()).filter(Boolean); }

  function stripGreekDiacritics(s) {
    s = String(s ?? "").trim().normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC").toLowerCase();
    return s.replace(/[ \t\r\n]+/g, "").replace(/[·.,;:!?"'“”‘’)\]}]+$/g, "");
  }

  function formatMorphValue(col, value) {
    const base = String(value);
    const expanded = VALUE_LABELS[col]?.[base];
    return expanded ? `${base} = ${expanded}` : base;
  }

  function currentQuery() {
    const qObj = {};
    for (const c of Object.keys(state.dropdowns)) {
      const v = state.dropdowns[c].value;
      if (v !== "(any)") qObj[c] = v;
    }
    return qObj;
  }

  function filterRowsByQuery(rows, qObj) {
    if (!qObj || !Object.keys(qObj).length) return rows;
    return rows.filter(row => Object.entries(qObj).every(([c, v]) => normStr(row[c]) === v));
  }

  function uniqueSortedValues(rows, col) {
    const s = new Set();
    for (const r of rows) {
      const v = normStr(r[col]);
      if (v && v !== "nan" && v !== "None") s.add(v);
    }
    return Array.from(s).sort((a,b) => a.localeCompare(b, undefined, { numeric: true }));
  }

  function setSelectOptions(select, options, preferredValue = null, col = null) {
    const current = select.value;
    select.innerHTML = "";
    for (const opt of options) {
      const o = document.createElement("option");
      o.value = opt;
      o.textContent = opt === "(any)" ? opt : (col ? formatMorphValue(col, opt) : opt);
      select.appendChild(o);
    }
    if (preferredValue && options.includes(preferredValue)) select.value = preferredValue;
    else if (options.includes(current)) select.value = current;
    else select.value = options[0] ?? "";
  }

  function prefixQueryForIndex(i) {
    const qObj = {};
    for (const c of state.morphOrder.slice(0, i)) {
      const v = state.dropdowns[c].value;
      if (v !== "(any)") qObj[c] = v;
    }
    return qObj;
  }

  function getFormCandidates(cols) {
    const lowers = cols.map(c => c.toLowerCase());
    const preferred = ["form","token","word","surface","surface_form","orth","text"];
    return preferred.map(p => lowers.indexOf(p)).filter(i => i >= 0).map(i => cols[i]);
  }

  function toCsv(rows, columns) {
    const esc = (v) => {
      const s = String(v ?? "");
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [columns.map(esc).join(","), ...rows.map(r => columns.map(c => esc(r[c])).join(","))].join("\n");
  }

  function escapeHtml(v) { return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function status(text) { el.statusBox.textContent = text; }

  function getPreviewRows(rows) {
    const term = normStr(el.previewSearch.value).toLowerCase();
    if (!term) return rows;
    return rows.filter(r => Object.values(r).some(v => String(v ?? "").toLowerCase().includes(term)));
  }

  function renderTable(rows, maxRows = 25) {
    const filteredRows = getPreviewRows(rows || []);
    if (!filteredRows.length) {
      el.tableWrap.innerHTML = `<div class="small-muted" style="padding:0.75rem;">No rows to display.</div>`;
      el.previewMeta.textContent = rows?.length ? "0 rows match preview search" : "";
      return;
    }
    const cols = Object.keys(filteredRows[0]);
    const nShow = Math.min(maxRows, filteredRows.length);
    let html = `<table class="preview"><thead><tr>`;
    for (const c of cols) html += `<th>${escapeHtml(c)}</th>`;
    html += `</tr></thead><tbody>`;
    for (let i = 0; i < nShow; i++) {
      html += `<tr>`;
      for (const c of cols) html += `<td>${escapeHtml(filteredRows[i][c])}</td>`;
      html += `</tr>`;
    }
    html += `</tbody></table>`;
    el.tableWrap.innerHTML = html;
    el.previewMeta.textContent = `showing ${nShow} of ${filteredRows.length} rows${rows.length !== filteredRows.length ? ` (filtered from ${rows.length})` : ""}`;
  }

  function downloadCsv(rows, suggestedName) {
    if (!rows?.length) return;
    const blob = new Blob([toCsv(rows, Object.keys(rows[0]))], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = suggestedName;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function updateStats() {
    el.statRows.textContent = String(state.rawRows.length || 0);
    el.statMorph.textContent = String(state.dfMorph ? state.dfMorph.length : 0);
    el.statFinal.textContent = String(state.dfFinal ? state.dfFinal.length : 0);
  }

  function readSavedDatasets() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function writeSavedDatasets(payload) { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); }

  function refreshSavedDatasetSelects() {
    const datasets = readSavedDatasets();
    const names = Object.keys(datasets).sort((a,b) => (a === LAST_AUTO_SLOT ? -1 : b === LAST_AUTO_SLOT ? 1 : a.localeCompare(b)));
    const targets = [el.savedDatasets, el.startupSavedDatasets];

    for (const select of targets) {
      select.innerHTML = "";
      const first = document.createElement("option");
      first.value = "";
      first.textContent = names.length ? "Choose saved dataset..." : "No saved datasets yet";
      select.appendChild(first);
      for (const name of names) {
        const o = document.createElement("option");
        o.value = name;
        o.textContent = `${name}${name === LAST_AUTO_SLOT ? " (auto-saved latest upload)" : ""} • ${datasets[name].rowCount || 0} rows`;
        select.appendChild(o);
      }
    }
    el.btnLoadLocal.disabled = !names.length;
    el.btnDeleteLocal.disabled = !names.length;
    el.btnStartupLoad.disabled = !names.length;
  }

  function saveDataset(slot) {
    const payload = readSavedDatasets();
    payload[slot] = {
      savedAt: new Date().toISOString(),
      fileName: state.fileName || "manual.csv",
      columns: state.columns,
      rowCount: state.rawRows.length,
      csv: toCsv(state.rawRows, state.columns)
    };
    writeSavedDatasets(payload);
    refreshSavedDatasetSelects();
  }

  function saveCurrentDataset() {
    if (!state.rawRows.length) return status("Load a CSV before saving a dataset.");
    const slot = safeSlug(el.saveSlotName.value || state.fileName || "dataset");
    saveDataset(slot);
    el.savedDatasets.value = slot;
    el.startupSavedDatasets.value = slot;
    status(`Saved dataset '${slot}' locally (${state.rawRows.length} rows).`);
  }

  function deleteSavedDataset() {
    const slot = el.savedDatasets.value;
    if (!slot) return;
    const payload = readSavedDatasets();
    delete payload[slot];
    writeSavedDatasets(payload);
    refreshSavedDatasetSelects();
    status(`Deleted saved dataset '${slot}'.`);
  }

  function loadSavedDataset(slot, fromStartup = false) {
    if (!slot) return;
    const item = readSavedDatasets()[slot];
    if (!item?.csv) return status(`Saved dataset '${slot}' is missing or invalid.`);
    parseAndLoadCsv(item.csv, `${slot}.csv`, true);
    if (fromStartup) status(`Loaded saved dataset '${slot}' from startup selector.`);
  }

  function buildMorphControls() {
    el.morphControls.innerHTML = "";
    state.dropdowns = {};
    for (const c of state.morphOrder) {
      const wrap = document.createElement("div");
      wrap.className = "field";
      const label = document.createElement("label");
      label.innerHTML = `<strong>${escapeHtml(c)}</strong>`;
      const sel = document.createElement("select");
      sel.dataset.col = c;
      sel.disabled = true;
      sel.innerHTML = `<option>(any)</option>`;
      sel.addEventListener("change", onDropdownChange);
      wrap.appendChild(label);
      wrap.appendChild(sel);
      el.morphControls.appendChild(wrap);
      state.dropdowns[c] = sel;
    }
  }

  function populateFormColumnSelect() {
    el.formCol.innerHTML = "";
    for (const c of state.columns) {
      const o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      el.formCol.appendChild(o);
    }
    const candidates = getFormCandidates(state.columns);
    const defaultCol = state.columns.includes("form") ? "form" : (candidates[0] || state.columns[0] || "");
    if (defaultCol) el.formCol.value = defaultCol;
    el.formCol.disabled = !state.columns.length;
  }

  function refreshConstraintDropdowns() {
    if (state.updatingWidgets || !state.rawRows.length) return;
    state.updatingWidgets = true;
    try {
      if (state.dropdowns.pos) {
        const vals = uniqueSortedValues(state.rawRows, "pos");
        state.dropdowns.pos.disabled = false;
        setSelectOptions(state.dropdowns.pos, ["(any)", ...vals], null, "pos");
      }

      const posNotChosen = !!(state.dropdowns.pos && state.dropdowns.pos.value === "(any)");
      for (let i = 0; i < state.morphOrder.length; i++) {
        const c = state.morphOrder[i];
        if (c === "pos") continue;
        const dd = state.dropdowns[c];
        if (!dd) continue;

        if (state.requirePosFirst && posNotChosen) {
          dd.disabled = true;
          setSelectOptions(dd, ["(any)"], "(any)", c);
          continue;
        }

        const sub = filterRowsByQuery(state.rawRows, prefixQueryForIndex(i));
        if (!sub.length) {
          dd.disabled = true;
          setSelectOptions(dd, ["(any)"], "(any)", c);
          continue;
        }

        const vals = uniqueSortedValues(sub, c);
        const opts = ["(any)", ...vals];
        const forcedSingleton = el.autoLockSingletons.checked && vals.length === 1;
        dd.disabled = forcedSingleton;
        setSelectOptions(dd, opts, forcedSingleton ? vals[0] : null, c);
      }
    } finally { state.updatingWidgets = false; }
  }

  function showConstraintStatus() {
    const qObj = currentQuery();
    const sub = filterRowsByQuery(state.rawRows, qObj);
    let txt = `Current morphology query: ${Object.keys(qObj).length ? JSON.stringify(qObj) : "(no filters)"}\n`;
    txt += `Rows matching current query: ${sub.length}\n\nSequential availability (given earlier fields only):\n`;
    for (let i = 0; i < state.morphOrder.length; i++) {
      const c = state.morphOrder[i];
      const vals = uniqueSortedValues(filterRowsByQuery(state.rawRows, prefixQueryForIndex(i)), c);
      txt += `  ${c}: [${vals.slice(0, 10).join(", ")}]${vals.length > 10 ? ` ... (+${vals.length - 10} more)` : ""}\n`;
    }
    status(txt);
    renderTable(sub, 12);
  }

  function applyDefaultsSequentially() {
    for (const c of state.morphOrder) {
      const dd = state.dropdowns[c];
      const v = DEFAULTS[c];
      if (!dd || !v || dd.disabled) continue;
      if ([...dd.options].map(o => o.value).includes(v)) {
        dd.value = v;
        refreshConstraintDropdowns();
      }
    }
  }

  function applyMorphFilters() {
    const qObj = currentQuery();
    state.dfMorph = filterRowsByQuery(state.rawRows, qObj).map(r => ({ ...r }));
    state.dfFinal = null;
    status(`Morphological query used: ${Object.keys(qObj).length ? JSON.stringify(qObj) : "(no filters)"}\nMorph-filtered shape: (${state.dfMorph.length}, ${state.columns.length})`);
    renderTable(state.dfMorph, 25);
    updateButtonStates();
    updateStats();
    populateVizColumns();
  }

  function applyEndingsFilters() {
    const base = (state.dfMorph ?? state.rawRows).map(r => ({ ...r }));
    const fc = el.formCol.value;
    if (!fc || !state.columns.includes(fc)) return status(`Form column '${fc}' not found.`);

    const endingsRaw = parseCsvList(el.endings.value);
    if (!endingsRaw.length) return status("Please enter at least one ending.");

    const accentInsensitive = el.accentInsensitive.checked;
    const lowercaseCompare = el.lowercaseCompare.checked;
    const matchMode = q('input[name="matchMode"]:checked')?.value || "endswith";
    const posEndingsRaw = parseCsvList(el.binaryPositive.value);
    let endings = endingsRaw.slice();
    let posEndings = posEndingsRaw.length ? posEndingsRaw.slice() : endingsRaw.slice();

    function normalizeFormValue(x) {
      let s = String(x ?? "");
      if (accentInsensitive) return stripGreekDiacritics(s);
      s = s.trim().replace(/[·.,;:!?"'“”‘’)\]}]+$/g, "");
      return lowercaseCompare ? s.toLowerCase() : s;
    }

    if (accentInsensitive) {
      endings = endingsRaw.map(stripGreekDiacritics);
      posEndings = (posEndingsRaw.length ? posEndingsRaw : endingsRaw).map(stripGreekDiacritics);
    } else if (lowercaseCompare) {
      endings = endingsRaw.map(x => x.toLowerCase());
      posEndings = (posEndingsRaw.length ? posEndingsRaw : endingsRaw).map(x => x.toLowerCase());
    }

    const matches = (comp, arr) => matchMode === "equals" ? arr.includes(comp) : (matchMode === "contains" ? arr.some(e => comp.includes(e)) : arr.some(e => comp.endsWith(e)));
    const addBinary = el.addBinary.checked;
    const binaryName = (el.binaryName.value || "").trim() || "ending_match_binary";

    state.dfFinal = base.filter(row => matches(normalizeFormValue(row[fc]), endings)).map(row => {
      const next = { ...row };
      if (addBinary) next[binaryName] = matches(normalizeFormValue(row[fc]), posEndings) ? 1 : 0;
      return next;
    });

    status(
      `Base used: ${state.dfMorph ? "morph-filtered dataframe" : "full df"}\nForm column: ${fc}\n` +
      `Endings (typed): ${JSON.stringify(endingsRaw)}\nMatch mode: ${matchMode}\n` +
      `Accent-insensitive: ${accentInsensitive}\nEndings-filtered shape: (${state.dfFinal.length}, ${state.dfFinal[0] ? Object.keys(state.dfFinal[0]).length : state.columns.length + (addBinary ? 1 : 0)})`
    );
    renderTable(state.dfFinal, 30);
    updateButtonStates();
    updateStats();
    populateVizColumns();
  }

  function resetAll() {
    state.dfMorph = null;
    state.dfFinal = null;
    state.updatingWidgets = true;
    try {
      for (const c of Object.keys(state.dropdowns)) {
        state.dropdowns[c].disabled = false;
        setSelectOptions(state.dropdowns[c], ["(any)"], "(any)", c);
      }
    } finally { state.updatingWidgets = false; }

    refreshConstraintDropdowns();
    applyDefaultsSequentially();
    refreshConstraintDropdowns();
    showConstraintStatus();
    updateButtonStates();
    updateStats();
    populateVizColumns();
  }

  function downloadCurrent() {
    const cur = state.dfFinal ?? state.dfMorph;
    if (!cur) return status("Nothing to download yet. Run a morphology filter and/or ending filter first.");
    const qObj = currentQuery();
    const qPart = Object.keys(qObj).length ? Object.entries(qObj).map(([k,v]) => `${k}_${safeSlug(v)}`).join("_") : "no_morph_filter";
    const ePart = state.dfFinal ? safeSlug(el.endings.value) : "no_endings_filter";
    const fname = safeSlug(`${(el.baseName.value || "filtered_output").trim()}__${qPart}__${ePart}`) + ".csv";
    downloadCsv(cur, fname);
    status(`Generated download: ${fname}\nRows: ${cur.length}`);
  }

  function getVizBaseRows() {
    if (el.vizDataset.value === "morph") return state.dfMorph || [];
    if (el.vizDataset.value === "final") return state.dfFinal || [];
    return state.rawRows || [];
  }

  function populateVizColumns() {
    const rows = getVizBaseRows();
    const cols = rows.length ? Object.keys(rows[0]) : [];
    for (const select of [el.vizPrimary, el.vizSecondary]) {
      const cur = select.value;
      select.innerHTML = "";
      const blank = document.createElement("option");
      blank.value = "";
      blank.textContent = select === el.vizSecondary ? "(none)" : "Choose column...";
      select.appendChild(blank);
      for (const c of cols) {
        const o = document.createElement("option");
        o.value = c;
        o.textContent = c;
        select.appendChild(o);
      }
      if (cols.includes(cur)) select.value = cur;
      select.disabled = !cols.length;
    }
    el.btnViz.disabled = !(rows.length && el.vizPrimary.value);
  }

  function renderVisualization() {
    const rows = getVizBaseRows();
    const primary = el.vizPrimary.value;
    const secondary = el.vizSecondary.value;
    if (!rows.length || !primary) {
      el.vizWrap.innerHTML = `<div class="small-muted">Load and filter data, then pick columns to visualize.</div>`;
      return;
    }

    const map = new Map();
    for (const r of rows) {
      const p = normStr(r[primary]) || "(blank)";
      const s = secondary ? (normStr(r[secondary]) || "(blank)") : null;
      const key = secondary ? `${p} ⟶ ${s}` : p;
      map.set(key, (map.get(key) || 0) + 1);
    }

    let entries = [...map.entries()];
    const sort = el.vizSort.value;
    if (sort === "alpha") entries.sort((a,b) => a[0].localeCompare(b[0]));
    else if (sort === "asc") entries.sort((a,b) => a[1] - b[1]);
    else entries.sort((a,b) => b[1] - a[1]);

    const topN = Math.max(1, Number.parseInt(el.vizTopN.value, 10) || 20);
    entries = entries.slice(0, topN);
    const max = Math.max(...entries.map(x => x[1]), 1);

    let html = `<div class="small-muted" style="margin-bottom:.6rem;">Showing ${entries.length} categories grouped by <strong>${escapeHtml(primary)}</strong>${secondary ? ` then <strong>${escapeHtml(secondary)}</strong>` : ""}.</div>`;
    for (const [label, value] of entries) {
      const w = Math.max(2, Math.round((value / max) * 100));
      html += `<div class="viz-item"><div class="viz-row"><span class="viz-label" title="${escapeHtml(label)}">${escapeHtml(label)}</span><div class="viz-bar" style="width:${w}%"></div><span class="viz-value">${value}</span></div></div>`;
    }
    el.vizWrap.innerHTML = html;
  }

  function onDropdownChange(evt) {
    if (state.updatingWidgets) return;
    const idx = state.morphOrder.indexOf(evt.target.dataset.col);
    if (idx >= 0) {
      state.updatingWidgets = true;
      try {
        for (const c of state.morphOrder.slice(idx + 1)) {
          const dd = state.dropdowns[c];
          if (dd) { dd.disabled = false; setSelectOptions(dd, ["(any)"], "(any)", c); }
        }
      } finally { state.updatingWidgets = false; }
    }
    refreshConstraintDropdowns();
    showConstraintStatus();
  }

  function updateButtonStates() {
    const hasData = state.rawRows.length > 0;
    el.btnMorph.disabled = !hasData;
    el.btnEndings.disabled = !hasData || !el.formCol.value;
    el.btnReset.disabled = !hasData;
    el.btnDownload.disabled = !(state.dfMorph || state.dfFinal);
    el.btnSaveLocal.disabled = !hasData;
    populateVizColumns();
  }

  function parseAndLoadCsv(text, fileName = "uploaded.csv", fromSaved = false) {
    state.fileName = fileName;
    el.loadStatus.textContent = `Loading ${fileName} ...`;

    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (res) => {
        el.loadStatus.textContent = res.errors?.length ? `Loaded with ${res.errors.length} parse warning(s).` : `Loaded ${fileName}${fromSaved ? " (saved dataset)" : ""}`;
        const rows = (res.data || []).map((r, i) => ({ ...r, _row_order: i }));
        const cols = res.meta?.fields || (rows[0] ? Object.keys(rows[0]) : []);
        state.rawRows = rows;
        state.columns = cols;
        state.morphCols = PREFERRED_MORPH_COLS.filter(c => cols.includes(c));

        if (!fromSaved && rows.length) {
          saveDataset(LAST_AUTO_SLOT);
          el.startupSavedDatasets.value = LAST_AUTO_SLOT;
        }

        if (!state.morphCols.length) {
          status(`No expected morphology columns found.\nExpected any of: ${PREFERRED_MORPH_COLS.join(", ")}\nColumns present: ${cols.join(", ")}`);
          renderTable(rows, 15);
          updateButtonStates();
          updateStats();
          return;
        }

        state.morphOrder = [...PREFERRED_MORPH_COLS.filter(c => state.morphCols.includes(c)), ...state.morphCols.filter(c => !PREFERRED_MORPH_COLS.includes(c))];
        state.requirePosFirst = state.morphOrder.includes("pos");

        buildMorphControls();
        populateFormColumnSelect();
        state.dfMorph = null;
        state.dfFinal = null;

        refreshConstraintDropdowns();
        applyDefaultsSequentially();
        refreshConstraintDropdowns();
        showConstraintStatus();
        updateButtonStates();
        updateStats();

        const formCandidates = getFormCandidates(cols);
        status(`Rows in analysis: ${rows.length}\nDetected columns:\n  morph: ${state.morphCols.join(", ")}\n  form candidates: ${formCandidates.length ? formCandidates.join(", ") : "(none obvious)"}\n  selected form column: ${el.formCol.value || "(none)"}`);
        renderTable(rows, 15);
      },
      error: (err) => {
        el.loadStatus.textContent = "Failed to parse CSV.";
        status(`CSV parse error: ${String(err)}`);
      }
    });
  }

  function onFileChosen(file) {
    if (!file) return;
    file.text().then(text => parseAndLoadCsv(text, file.name, false));
  }

  el.csvFile.addEventListener("change", e => onFileChosen(e.target.files?.[0]));
  el.autoLockSingletons.addEventListener("change", () => { refreshConstraintDropdowns(); showConstraintStatus(); });
  el.btnMorph.addEventListener("click", applyMorphFilters);
  el.btnEndings.addEventListener("click", applyEndingsFilters);
  el.btnReset.addEventListener("click", resetAll);
  el.btnDownload.addEventListener("click", downloadCurrent);
  el.previewSearch.addEventListener("input", () => renderTable(state.dfFinal ?? state.dfMorph ?? state.rawRows, 30));
  el.btnSaveLocal.addEventListener("click", saveCurrentDataset);
  el.btnLoadLocal.addEventListener("click", () => loadSavedDataset(el.savedDatasets.value, false));
  el.btnDeleteLocal.addEventListener("click", deleteSavedDataset);
  el.btnStartupLoad.addEventListener("click", () => loadSavedDataset(el.startupSavedDatasets.value, true));
  el.vizDataset.addEventListener("change", populateVizColumns);
  el.vizPrimary.addEventListener("change", () => { el.btnViz.disabled = !el.vizPrimary.value; });
  el.btnViz.addEventListener("click", renderVisualization);

  refreshSavedDatasetSelects();
  updateButtonStates();
  updateStats();
  renderVisualization();
})();
