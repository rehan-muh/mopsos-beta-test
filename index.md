---
layout: default
title: Greek Morphology + Ending Filter
---

<section class="hero card">
  <p class="kicker">Greek NLP Workspace</p>
  <h1>Greek Morphology + Ending Filter</h1>
  <p class="lead">Upload, filter, persist, and re-use your CSV data directly in the browser.</p>
  <div class="hero-chips">
    <span class="chip">Sequential morphology filters</span>
    <span class="chip">Accent-insensitive endings</span>
    <span class="chip">Persistent local saves</span>
  </div>
</section>

<div class="stats-grid" id="statsGrid">
  <div class="stat-card"><span class="stat-label">Rows loaded</span><strong id="statRows">0</strong></div>
  <div class="stat-card"><span class="stat-label">After morphology</span><strong id="statMorph">0</strong></div>
  <div class="stat-card"><span class="stat-label">After ending filter</span><strong id="statFinal">0</strong></div>
</div>

## 1. Load CSV

<div class="card">
  <label for="csvFile"><strong>CSV file</strong></label>
  <input id="csvFile" type="file" accept=".csv,text/csv" />
  <div class="help">Expected columns include morphology fields such as <code>pos</code>, <code>person</code>, <code>number</code>, <code>tense</code>, <code>mood</code>, <code>voice</code>, <code>gender</code>, <code>case</code> (any subset is fine).</div>
  <div id="loadStatus" class="status muted">No file loaded yet.</div>
</div>

## 1b. Save / Restore Dataset (persistent)

<div class="card">
  <div class="grid-2">
    <div class="field">
      <label for="saveSlotName"><strong>Save slot name</strong></label>
      <input id="saveSlotName" type="text" value="my_greek_dataset" placeholder="e.g. attic_nouns_v1" />
    </div>
    <div class="field">
      <label for="savedDatasets"><strong>Saved datasets</strong></label>
      <select id="savedDatasets"></select>
    </div>
  </div>

  <div class="btn-row">
    <button id="btnSaveLocal" class="btn btn-primary" disabled>Save current CSV in browser</button>
    <button id="btnLoadLocal" class="btn" disabled>Load saved dataset</button>
    <button id="btnDeleteLocal" class="btn btn-warn" disabled>Delete saved dataset</button>
  </div>
  <div class="help">Saved datasets are stored in your browser local storage so you can re-open them later on the same browser/device.</div>
</div>

## 2. Morphology filter (sequential)

<div class="card">
  <label class="inline">
    <input type="checkbox" id="autoLockSingletons" checked />
    Auto-lock forced values (e.g. person = <code>-</code>)
  </label>

  <div id="morphControls" class="grid-2"></div>

  <div class="btn-row">
    <button id="btnMorph" class="btn btn-primary" disabled>1) Create morph-filtered dataframe</button>
    <button id="btnReset" class="btn btn-warn" disabled>Reset selections</button>
  </div>
</div>

## 3. Ending filter

<div class="card">
  <div class="field">
    <label for="formCol"><strong>Form column</strong></label>
    <select id="formCol" disabled></select>
  </div>

  <div class="field">
    <label for="endings"><strong>Endings</strong> (comma-separated)</label>
    <input id="endings" type="text" value="οις, οισι, οισιν" />
  </div>

  <div class="field">
    <label><strong>Match mode</strong></label>
    <div class="inline-group">
      <label class="inline"><input type="radio" name="matchMode" value="endswith" checked /> endswith</label>
      <label class="inline"><input type="radio" name="matchMode" value="equals" /> equals</label>
      <label class="inline"><input type="radio" name="matchMode" value="contains" /> contains</label>
    </div>
  </div>

  <div class="inline-group">
    <label class="inline"><input id="accentInsensitive" type="checkbox" checked /> accent-insensitive</label>
    <label class="inline"><input id="lowercaseCompare" type="checkbox" checked /> lowercase compare</label>
  </div>

  <div class="inline-group">
    <label class="inline"><input id="addBinary" type="checkbox" /> add binary column?</label>
    <input id="binaryName" type="text" value="ending_match_binary" placeholder="binary column name" />
  </div>

  <div class="field">
    <label for="binaryPositive"><strong>Positive endings</strong> (optional subset)</label>
    <input id="binaryPositive" type="text" value="" placeholder="blank = all selected endings" />
  </div>

  <div class="btn-row">
    <button id="btnEndings" class="btn btn-primary" disabled>2) Filter by endings</button>
  </div>
</div>

## 4. Download filtered CSV

<div class="card">
  <div class="field">
    <label for="baseName"><strong>Base filename</strong></label>
    <input id="baseName" type="text" value="filtered_output" />
  </div>

  <div class="btn-row">
    <button id="btnDownload" class="btn btn-success" disabled>3) Download current dataframe (.csv)</button>
  </div>
</div>

## Status / Preview

<div class="card">
  <pre id="statusBox" class="status">Load a CSV to begin.</pre>
</div>

<div class="card">
  <div class="preview-header">
    <strong>Preview (first rows)</strong>
    <span id="previewMeta" class="muted"></span>
  </div>
  <div class="field">
    <label for="previewSearch"><strong>Quick search in preview</strong></label>
    <input id="previewSearch" type="text" placeholder="Type to filter preview rows…" />
  </div>
  <div id="tableWrap" class="table-wrap"></div>
</div>
