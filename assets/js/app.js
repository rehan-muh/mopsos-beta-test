(() => {
  const PREFERRED_MORPH_COLS = ["pos","person","number","tense","mood","voice","gender","case"];
  const DEFAULTS = { pos: "n", number: "p", case: "d" };

  const state = {
    rawRows: [],
    columns: [],
    morphCols: [],
    morphOrder: [],
    dropdowns: {}, // col -> select
    updatingWidgets: false,
    dfMorph: null,
    dfFinal: null,
    requirePosFirst: true,
    fileName: null
  };

  // ---------- DOM ----------
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
  };

  function byId(id) { return document.getElementById(id); }
  function q(sel, root=document) { return root.querySelector(sel); }
  function qa(sel, root=document) { return Array.from(root.querySelectorAll(sel)); }

  function getMatchMode() {
    const checked = q('input[name="matchMode"]:checked');
    return checked ? checked.value : "endswith";
  }

  // ---------- Helpers ----------
  function normStr(x) {
    return String(x ?? "").trim();
  }

  function parseCsvList(s) {
    return String(s ?? "")
      .split(",")
      .map(x => x.trim())
      .filter(Boolean);
  }

  function safeSlug(s) {
    return String(s ?? "")
      .replace(/[^A-Za-z0-9._-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "") || "filtered";
  }

  function stripGreekDiacritics(s) {
    s = String(s ?? "").trim();
    s = s.normalize("NFD");
    s = s.replace(/\p{M}/gu, ""); // combining marks
    s = s.normalize("NFC").toLowerCase();
    s = s.replace(/[ \t\r\n]+/g, "");
    s = s.replace(/[·.,;:!?"'“”‘’)\]}]+$/g, "");
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
    return rows.filter(row => {
      for (const [c, v] of Object.entries(qObj)) {
        if (normStr(row[c]) !== v) return false;
      }
      return true;
    });
  }

  function firstExisting(cols, candidates) {
    for (const c of candidates) if (cols.includes(c)) return c;
    return null;
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
    if (preferredValue && options.includes(preferredValue)) {
      select.value = preferredValue;
    } else if (options.includes(current)) {
      select.value = current;
    } else {
      select.value = options[0] ?? "";
    }
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
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const header = columns.map(esc).join(",");
    const lines = rows.map(r => columns.map(c => esc(r[c])).join(","));
    return [header, ...lines].join("\n");
  }

  function downloadCsv(rows, suggestedName) {
    if (!rows || !rows.length) return;
    const cols = Object.keys(rows[0]);
    const csv = toCsv(rows, cols);
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

  function renderTable(rows, maxRows = 25) {
    if (!rows || rows.length === 0) {
      el.tableWrap.innerHTML = `<div class="small-muted" style="padding:0.75rem;">No rows to display.</div>`;
      el.previewMeta.textContent = "";
      return;
    }
    const cols = Object.keys(rows[0]);
    const nShow = Math.min(maxRows, rows.length);

    let html = `<table class="preview"><thead><tr>`;
    for (const c of cols) html += `<th>${escapeHtml(c)}</th>`;
    html += `</tr></thead><tbody>`;

    for (let i = 0; i < nShow; i++) {
      html += `<tr>`;
      const r = rows[i];
      for (const c of cols) html += `<td>${escapeHtml(r[c])}</td>`;
      html += `</tr>`;
    }
    html += `</tbody></table>`;
    el.tableWrap.innerHTML = html;
    el.previewMeta.textContent = `showing ${nShow} of ${rows.length} rows`;
  }

  function escapeHtml(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function status(text) {
    el.statusBox.textContent = text;
  }

  // ---------- UI Construction ----------
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

  // ---------- Sequential constraints ----------
  function refreshConstraintDropdowns() {
    if (state.updatingWidgets || !state.rawRows.length) return;

    state.updatingWidgets = true;
    try {
      if (state.dropdowns["pos"]) {
        const vals = uniqueSortedValues(state.rawRows, "pos");
        const opts = ["(any)", ...vals];
        const ddPos = state.dropdowns["pos"];
        ddPos.disabled = false;
        setSelectOptions(ddPos, opts);
      }

      const posNotChosen = !!(state.dropdowns["pos"] && state.dropdowns["pos"].value === "(any)");

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

        const qPrefix = prefixQueryForIndex(i);
        const sub = filterRowsByQuery(state.rawRows, qPrefix);

        if (sub.length === 0) {
          dd.disabled = true;
          setSelectOptions(dd, ["(any)"], "(any)");
          for (const c2 of state.morphOrder.slice(i + 1)) {
            const dd2 = state.dropdowns[c2];
            if (dd2) {
              dd2.disabled = true;
              setSelectOptions(dd2, ["(any)"], "(any)");
            }
          }
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

    let txt = "";
    txt += `Current morphology query: ${Object.keys(qObj).length ? JSON.stringify(qObj) : "(no filters)"}\n`;
    txt += `Rows matching current query: ${sub.length}\n\n`;
    txt += `Sequential availability (given earlier fields only):\n`;

    for (let i = 0; i < state.morphOrder.length; i++) {
      const c = state.morphOrder[i];
      const qPrefix = prefixQueryForIndex(i);
      const subPrefix = filterRowsByQuery(state.rawRows, qPrefix);
      const vals = uniqueSortedValues(subPrefix, c);
      const preview = vals.slice(0, 12);
      const suffix = vals.length <= 12 ? "" : ` ... (+${vals.length - 12} more)`;
      txt += `  ${c}: [${preview.join(", ")}]${suffix}\n`;
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

  // ---------- Actions ----------
  function applyMorphFilters() {
    const qObj = currentQuery();
    state.dfMorph = filterRowsByQuery(state.rawRows, qObj).map(r => ({ ...r }));
    state.dfFinal = null;

    const txt =
      `Morphological query used: ${Object.keys(qObj).length ? JSON.stringify(qObj) : "(no filters)"}\n` +
      `Morph-filtered shape: (${state.dfMorph.length}, ${state.columns.length})`;
    status(txt);
    renderTable(state.dfMorph, 25);
    updateButtonStates();
  }

  function applyEndingsFilters() {
    const base = (state.dfMorph ?? state.rawRows).map(r => ({ ...r }));
    const fc = el.formCol.value;
    if (!fc || !state.columns.includes(fc)) {
      status(`Form column '${fc}' not found.`);
      return;
    }

    const endingsRaw = parseCsvList(el.endings.value);
    if (!endingsRaw.length) {
      status("Please enter at least one ending.");
      return;
    }

    const accentInsensitive = el.accentInsensitive.checked;
    const lowercaseCompare = el.lowercaseCompare.checked;
    const matchMode = getMatchMode();

    let endings = endingsRaw.slice();
    let posEndingsRaw = parseCsvList(el.binaryPositive.value);
    let posEndings = posEndingsRaw.length ? posEndingsRaw.slice() : endingsRaw.slice();

    function normalizeFormValue(x) {
      let s = String(x ?? "");
      if (accentInsensitive) return stripGreekDiacritics(s);
      s = s.trim().replace(/[·.,;:!?"'“”‘’)\]}]+$/g, "");
      if (lowercaseCompare) s = s.toLowerCase();
      return s;
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
      return arr.some(e => comp.endsWith(e)); // endswith
    }

    const out = [];
    const addBinary = el.addBinary.checked;
    const binaryName = (el.binaryName.value || "").trim() || "ending_match_binary";

    for (const row of base) {
      const comp = normalizeFormValue(row[fc]);
      if (matches(comp, endings)) {
        const newRow = { ...row };
        if (addBinary) {
          newRow[binaryName] = matches(comp, posEndings) ? 1 : 0;
        }
        out.push(newRow);
      }
    }

    state.dfFinal = out;

    const txt =
      `Base used: ${state.dfMorph ? "morph-filtered dataframe" : "full df"}\n` +
      `Form column: ${fc}\n` +
      `Endings (typed): ${JSON.stringify(endingsRaw)}\n` +
      `Match mode: ${matchMode}\n` +
      `Accent-insensitive: ${accentInsensitive}\n` +
      `Endings-filtered shape: (${out.length}, ${out[0] ? Object.keys(out[0]).length : state.columns.length + (addBinary ? 1 : 0)})`;
    status(txt);
    renderTable(out, 30);
    updateButtonStates();
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
  }

  function downloadCurrent() {
    const cur = state.dfFinal ?? state.dfMorph;
    if (!cur) {
      status("Nothing to download yet. Run a morphology filter and/or ending filter first.");
      return;
    }

    const qObj = currentQuery();
    const qPart = Object.keys(qObj).length
      ? Object.entries(qObj).map(([k,v]) => `${k}_${safeSlug(v)}`).join("_")
      : "no_morph_filter";

    const ePart = state.dfFinal ? safeSlug(el.endings.value) : "no_endings_filter";
    const base = (el.baseName.value || "").trim() || "filtered_output";
    const fname = safeSlug(`${base}__${qPart}__${ePart}`) + ".csv";

    downloadCsv(cur, fname);
    status(`Generated download: ${fname}\nRows: ${cur.length}`);
  }

  // ---------- Event handlers ----------
  function onDropdownChange(evt) {
    if (state.updatingWidgets) return;

    const changedCol = evt.target.dataset.col;
    const idx = state.morphOrder.indexOf(changedCol);

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
      } finally {
        state.updatingWidgets = false;
      }
    }

    refreshConstraintDropdowns();
    showConstraintStatus();
  }

  function onAutoLockChange() {
    refreshConstraintDropdowns();
    showConstraintStatus();
  }

  async function onFileChosen(file) {
    if (!file) return;
    state.fileName = file.name;
    el.loadStatus.textContent = `Loading ${file.name} ...`;

    const text = await file.text();

    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (res) => {
        if (res.errors && res.errors.length) {
          el.loadStatus.textContent = `Loaded with ${res.errors.length} parse warning(s).`;
        } else {
          el.loadStatus.textContent = `Loaded ${file.name}`;
        }

        const rows = (res.data || []).map((r, i) => ({ ...r, _row_order: i }));
        const cols = res.meta?.fields || (rows[0] ? Object.keys(rows[0]) : []);

        state.rawRows = rows;
        state.columns = cols;

        state.morphCols = PREFERRED_MORPH_COLS.filter(c => cols.includes(c));
        if (!state.morphCols.length) {
          status(
            `No expected morphology columns found.\n` +
            `Expected any of: ${PREFERRED_MORPH_COLS.join(", ")}\n` +
            `Columns present: ${cols.join(", ")}`
          );
          renderTable(rows, 12);
          el.btnMorph.disabled = true;
          el.btnEndings.disabled = true;
          el.btnReset.disabled = true;
          el.btnDownload.disabled = true;
          return;
        }

        state.morphOrder = [
          ...PREFERRED_MORPH_COLS.filter(c => state.morphCols.includes(c)),
          ...state.morphCols.filter(c => !PREFERRED_MORPH_COLS.includes(c))
        ];
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

        const formCandidates = getFormCandidates(cols);
        status(
          `Rows in analysis: ${rows.length}\n` +
          `Detected columns:\n` +
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

  function updateButtonStates() {
    const hasData = state.rawRows.length > 0;
    el.btnMorph.disabled = !hasData;
    el.btnEndings.disabled = !hasData || !el.formCol.value;
    el.btnReset.disabled = !hasData;
    el.btnDownload.disabled = !(state.dfMorph || state.dfFinal);
  }

  // ---------- Wire up ----------
  el.csvFile.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    onFileChosen(file);
  });
  el.autoLockSingletons.addEventListener("change", onAutoLockChange);
  el.btnMorph.addEventListener("click", applyMorphFilters);
  el.btnEndings.addEventListener("click", applyEndingsFilters);
  el.btnReset.addEventListener("click", resetAll);
  el.btnDownload.addEventListener("click", downloadCurrent);

  // Initial UI state
  updateButtonStates();
})();
