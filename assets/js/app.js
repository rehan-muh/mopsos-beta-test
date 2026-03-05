(() => {
  const PREFERRED_MORPH_COLS = ["pos","person","number","tense","mood","voice","gender","case"];
  const DEFAULTS = { pos: "n", number: "p", case: "d" };
  const STORAGE_KEY = "gmf_saved_datasets_v1";

  const state = {
    rawRows: [],
    columns: [],
    morphCols: [],
    morphOrder: [],
    dropdowns: {},
    updatingWidgets: false,
    dfMorph: null,
    dfFinal: null,
    requirePosFirst: true,
    fileName: null
  };

  const el = {
    csvFile: byId("csvFile"),
    loadStatus: byId("loadStatus"),
    morphControls: byId("morphControls"),
    autoLockSingletons: byId("autoLockSingletons"),
    formCol: byId("formCol"),
    endings: byId("endings"),
    accentInsensitive: byId("accentInsensitive"),
    lowercaseCompare: byId("lowercaseCompare"),
    addBinary: byId("addBinary"),
    binaryName: byId("binaryName"),
    binaryPositive: byId("binaryPositive"),
    baseName: byId("baseName"),
    btnMorph: byId("btnMorph"),
    btnEndings: byId("btnEndings"),
    btnDownload: byId("btnDownload"),
    btnReset: byId("btnReset"),
    statusBox: byId("statusBox"),
    tableWrap: byId("tableWrap"),
    previewMeta: byId("previewMeta"),
    previewSearch: byId("previewSearch"),
    saveSlotName: byId("saveSlotName"),
    savedDatasets: byId("savedDatasets"),
    btnSaveLocal: byId("btnSaveLocal"),
    btnLoadLocal: byId("btnLoadLocal"),
    btnDeleteLocal: byId("btnDeleteLocal"),
    statRows: byId("statRows"),
    statMorph: byId("statMorph"),
    statFinal: byId("statFinal")
  };

  function byId(id) { return document.getElementById(id); }
  function q(sel, root=document) { return root.querySelector(sel); }

  function getMatchMode() {
    const checked = q('input[name="matchMode"]:checked');
    return checked ? checked.value : "endswith";
  }

  function normStr(x) { return String(x ?? "").trim(); }

  function parseCsvList(s) {
    return String(s ?? "").split(",").map(x => x.trim()).filter(Boolean);
  }

  function safeSlug(s) {
    return String(s ?? "")
      .replace(/[^A-Za-z0-9._-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "") || "filtered";
  }

  function stripGreekDiacritics(s) {
    s = String(s ?? "").trim().normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC").toLowerCase();
    s = s.replace(/[ \t\r\n]+/g, "").replace(/[·.,;:!?"'“”‘’)\]}]+$/g, "");
    return s;
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

  function getFormCandidates(cols) {
    const lowers = cols.map(c => c.toLowerCase());
    const preferred = ["form","token","word","surface","surface_form","orth","text"];
    const found = [];
    for (const p of preferred) {
      const idx = lowers.indexOf(p);
      if (idx >= 0) found.push(cols[idx]);
    }
    return found;
  }

  function uniqueSortedValues(rows, col) {
    const s = new Set();
    for (const r of rows) {
      const v = normStr(r[col]);
      if (v && v !== "nan" && v !== "None") s.add(v);
    }
    return Array.from(s).sort((a,b) => a.localeCompare(b, undefined, { numeric: true }));
  }

  function setSelectOptions(select, options, preferredValue = null) {
    const current = select.value;
    select.innerHTML = "";
    for (const opt of options) {
      const o = document.createElement("option");
      o.value = opt;
      o.textContent = opt;
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

  function toCsv(rows, columns) {
    const esc = (v) => {
      const s = String(v ?? "");
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [columns.map(esc).join(","), ...rows.map(r => columns.map(c => esc(r[c])).join(","))].join("\n");
  }

  function downloadCsv(rows, suggestedName) {
    if (!rows || !rows.length) return;
    const csv = toCsv(rows, Object.keys(rows[0]));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = suggestedName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function getPreviewRows(rows) {
    const term = normStr(el.previewSearch?.value).toLowerCase();
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
      const r = filteredRows[i];
      for (const c of cols) html += `<td>${escapeHtml(r[c])}</td>`;
      html += `</tr>`;
    }
    html += `</tbody></table>`;
    el.tableWrap.innerHTML = html;
    el.previewMeta.textContent = `showing ${nShow} of ${filteredRows.length} rows${rows.length !== filteredRows.length ? ` (filtered from ${rows.length})` : ""}`;
  }

  function escapeHtml(v) {
    return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function status(text) { el.statusBox.textContent = text; }

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

  function writeSavedDatasets(payload) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function refreshSavedDatasetSelect() {
    const datasets = readSavedDatasets();
    const names = Object.keys(datasets).sort();
    el.savedDatasets.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = names.length ? "Choose saved dataset..." : "No saved datasets yet";
    el.savedDatasets.appendChild(placeholder);

    for (const name of names) {
      const item = datasets[name];
      const o = document.createElement("option");
      o.value = name;
      o.textContent = `${name} (${item.rowCount || 0} rows)`;
      el.savedDatasets.appendChild(o);
    }
    el.btnLoadLocal.disabled = !names.length;
    el.btnDeleteLocal.disabled = !names.length;
  }

  function saveCurrentDataset() {
    if (!state.rawRows.length) {
      status("Load a CSV before saving a dataset.");
      return;
    }
    const slot = safeSlug(el.saveSlotName.value || state.fileName || "dataset");
    const payload = readSavedDatasets();
    payload[slot] = {
      savedAt: new Date().toISOString(),
      fileName: state.fileName || "manual.csv",
      columns: state.columns,
      rowCount: state.rawRows.length,
      csv: toCsv(state.rawRows, state.columns)
    };
    writeSavedDatasets(payload);
    refreshSavedDatasetSelect();
    el.savedDatasets.value = slot;
    status(`Saved dataset '${slot}' locally (${state.rawRows.length} rows).`);
  }

  function loadSavedDataset() {
    const slot = el.savedDatasets.value;
    if (!slot) return;
    const payload = readSavedDatasets();
    const item = payload[slot];
    if (!item?.csv) {
      status(`Saved dataset '${slot}' is missing or invalid.`);
      return;
    }
    parseAndLoadCsv(item.csv, `${slot}.csv`, true);
  }

  function deleteSavedDataset() {
    const slot = el.savedDatasets.value;
    if (!slot) return;
    const payload = readSavedDatasets();
    delete payload[slot];
    writeSavedDatasets(payload);
    refreshSavedDatasetSelect();
    status(`Deleted saved dataset '${slot}'.`);
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
    const cols = state.columns;
    el.formCol.innerHTML = "";
    for (const c of cols) {
      const o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      el.formCol.appendChild(o);
    }
    const candidates = getFormCandidates(cols);
    const defaultCol = cols.includes("form") ? "form" : (candidates[0] || cols[0] || "");
    if (defaultCol) el.formCol.value = defaultCol;
    el.formCol.disabled = !cols.length;
  }

  function refreshConstraintDropdowns() {
    if (state.updatingWidgets || !state.rawRows.length) return;
    state.updatingWidgets = true;
    try {
      if (state.dropdowns.pos) {
        const vals = uniqueSortedValues(state.rawRows, "pos");
        const ddPos = state.dropdowns.pos;
        ddPos.disabled = false;
        setSelectOptions(ddPos, ["(any)", ...vals]);
      }

      const posNotChosen = !!(state.dropdowns.pos && state.dropdowns.pos.value === "(any)");
      for (let i = 0; i < state.morphOrder.length; i++) {
        const c = state.morphOrder[i];
        if (c === "pos") continue;
        const dd = state.dropdowns[c];
        if (!dd) continue;

        if (state.requirePosFirst && posNotChosen) {
          dd.disabled = true;
          setSelectOptions(dd, ["(any)"], "(any)");
          continue;
        }

        const sub = filterRowsByQuery(state.rawRows, prefixQueryForIndex(i));
        if (!sub.length) {
          dd.disabled = true;
          setSelectOptions(dd, ["(any)"], "(any)");
          break;
        }

        const vals = uniqueSortedValues(sub, c);
        const opts = ["(any)", ...vals];
        const forcedSingleton = el.autoLockSingletons.checked && vals.length === 1;
        if (forcedSingleton) {
          dd.disabled = true;
          setSelectOptions(dd, opts, vals[0]);
        } else {
          dd.disabled = false;
          setSelectOptions(dd, opts);
        }
      }
    } finally {
      state.updatingWidgets = false;
    }
  }

  function showConstraintStatus() {
    const qObj = currentQuery();
    const sub = filterRowsByQuery(state.rawRows, qObj);
    let txt = `Current morphology query: ${Object.keys(qObj).length ? JSON.stringify(qObj) : "(no filters)"}\n`;
    txt += `Rows matching current query: ${sub.length}\n\nSequential availability (given earlier fields only):\n`;

    for (let i = 0; i < state.morphOrder.length; i++) {
      const c = state.morphOrder[i];
      const vals = uniqueSortedValues(filterRowsByQuery(state.rawRows, prefixQueryForIndex(i)), c);
      const preview = vals.slice(0, 12);
      txt += `  ${c}: [${preview.join(", ")}]${vals.length > 12 ? ` ... (+${vals.length - 12} more)` : ""}\n`;
    }
    status(txt);
    renderTable(sub, 12);
  }

  function applyDefaultsSequentially() {
    for (const c of state.morphOrder) {
      if (!(c in DEFAULTS)) continue;
      const dd = state.dropdowns[c];
      if (!dd || dd.disabled) continue;
      const v = DEFAULTS[c];
      if ([...dd.options].map(o => o.value).includes(v)) {
        dd.value = v;
        refreshConstraintDropdowns();
      }
    }
  }

  function applyMorphFilters() {
    state.dfMorph = filterRowsByQuery(state.rawRows, currentQuery()).map(r => ({ ...r }));
    state.dfFinal = null;
    status(`Morphological query used: ${JSON.stringify(currentQuery()) || "(no filters)"}\nMorph-filtered shape: (${state.dfMorph.length}, ${state.columns.length})`);
    renderTable(state.dfMorph, 25);
    updateButtonStates();
    updateStats();
  }

  function applyEndingsFilters() {
    const base = (state.dfMorph ?? state.rawRows).map(r => ({ ...r }));
    const fc = el.formCol.value;
    if (!fc || !state.columns.includes(fc)) return status(`Form column '${fc}' not found.`);

    const endingsRaw = parseCsvList(el.endings.value);
    if (!endingsRaw.length) return status("Please enter at least one ending.");

    const accentInsensitive = el.accentInsensitive.checked;
    const lowercaseCompare = el.lowercaseCompare.checked;
    const matchMode = getMatchMode();
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

    function matches(comp, arr) {
      if (matchMode === "equals") return arr.includes(comp);
      if (matchMode === "contains") return arr.some(e => comp.includes(e));
      return arr.some(e => comp.endsWith(e));
    }

    const addBinary = el.addBinary.checked;
    const binaryName = (el.binaryName.value || "").trim() || "ending_match_binary";
    state.dfFinal = base.filter(row => matches(normalizeFormValue(row[fc]), endings)).map(row => {
      const next = { ...row };
      if (addBinary) next[binaryName] = matches(normalizeFormValue(row[fc]), posEndings) ? 1 : 0;
      return next;
    });

    status(
      `Base used: ${state.dfMorph ? "morph-filtered dataframe" : "full df"}\n` +
      `Form column: ${fc}\nEndings (typed): ${JSON.stringify(endingsRaw)}\n` +
      `Match mode: ${matchMode}\nAccent-insensitive: ${accentInsensitive}\n` +
      `Endings-filtered shape: (${state.dfFinal.length}, ${state.dfFinal[0] ? Object.keys(state.dfFinal[0]).length : state.columns.length + (addBinary ? 1 : 0)})`
    );
    renderTable(state.dfFinal, 30);
    updateButtonStates();
    updateStats();
  }

  function resetAll() {
    state.dfMorph = null;
    state.dfFinal = null;
    state.updatingWidgets = true;
    try {
      for (const c of Object.keys(state.dropdowns)) {
        const dd = state.dropdowns[c];
        dd.disabled = false;
        setSelectOptions(dd, ["(any)"], "(any)");
      }
    } finally {
      state.updatingWidgets = false;
    }
    refreshConstraintDropdowns();
    applyDefaultsSequentially();
    refreshConstraintDropdowns();
    showConstraintStatus();
    updateButtonStates();
    updateStats();
  }

  function downloadCurrent() {
    const cur = state.dfFinal ?? state.dfMorph;
    if (!cur) return status("Nothing to download yet. Run a morphology filter and/or ending filter first.");

    const qObj = currentQuery();
    const qPart = Object.keys(qObj).length ? Object.entries(qObj).map(([k,v]) => `${k}_${safeSlug(v)}`).join("_") : "no_morph_filter";
    const ePart = state.dfFinal ? safeSlug(el.endings.value) : "no_endings_filter";
    const base = (el.baseName.value || "").trim() || "filtered_output";
    const fname = safeSlug(`${base}__${qPart}__${ePart}`) + ".csv";
    downloadCsv(cur, fname);
    status(`Generated download: ${fname}\nRows: ${cur.length}`);
  }

  function onDropdownChange(evt) {
    if (state.updatingWidgets) return;
    const idx = state.morphOrder.indexOf(evt.target.dataset.col);
    if (idx >= 0) {
      state.updatingWidgets = true;
      try {
        for (const c of state.morphOrder.slice(idx + 1)) {
          const dd = state.dropdowns[c];
          if (dd) {
            dd.disabled = false;
            setSelectOptions(dd, ["(any)"], "(any)");
          }
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

        if (!state.morphCols.length) {
          status(`No expected morphology columns found.\nExpected any of: ${PREFERRED_MORPH_COLS.join(", ")}\nColumns present: ${cols.join(", ")}`);
          renderTable(rows, 12);
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
        status(
          `Rows in analysis: ${rows.length}\nDetected columns:\n` +
          `  morph: ${state.morphCols.join(", ")}\n` +
          `  form candidates: ${formCandidates.length ? formCandidates.join(", ") : "(none obvious)"}\n` +
          `  selected form column: ${el.formCol.value || "(none)"}`
        );
        renderTable(rows, 12);
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

  el.csvFile.addEventListener("change", (e) => onFileChosen(e.target.files?.[0]));
  el.autoLockSingletons.addEventListener("change", () => { refreshConstraintDropdowns(); showConstraintStatus(); });
  el.btnMorph.addEventListener("click", applyMorphFilters);
  el.btnEndings.addEventListener("click", applyEndingsFilters);
  el.btnReset.addEventListener("click", resetAll);
  el.btnDownload.addEventListener("click", downloadCurrent);
  el.previewSearch.addEventListener("input", () => renderTable(state.dfFinal ?? state.dfMorph ?? state.rawRows, 30));
  el.btnSaveLocal.addEventListener("click", saveCurrentDataset);
  el.btnLoadLocal.addEventListener("click", loadSavedDataset);
  el.btnDeleteLocal.addEventListener("click", deleteSavedDataset);

  refreshSavedDatasetSelect();
  updateButtonStates();
  updateStats();
})();
