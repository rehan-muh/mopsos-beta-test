---
layout: default
title: Greek Morphology + Ending Filter
---

<section class="hero card">
  <p class="kicker">Greek NLP Workspace</p>
  <h1>Greek Morphology + Ending Filter</h1>
  <p class="lead">Upload, filter, persist, and re-use your CSV data with a streamlined visual workflow.</p>
</section>

<div class="stats-grid" id="statsGrid">
  <div class="stat-card"><span class="stat-label">Rows loaded</span><strong id="statRows">0</strong></div>
  <div class="stat-card"><span class="stat-label">After morphology</span><strong id="statMorph">0</strong></div>
  <div class="stat-card"><span class="stat-label">After ending filter</span><strong id="statFinal">0</strong></div>
</div>

## 1. Start with a dataset

<div class="card">
  <div class="grid-2">
    <div class="field">
      <label for="startupSavedDatasets"><strong>Use an already uploaded dataset</strong></label>
      <select id="startupSavedDatasets"></select>
    </div>
    <div class="field startup-actions">
      <button id="btnStartupLoad" class="btn btn-primary" disabled>Use selected saved dataset</button>
    </div>
  </div>

  <div class="divider">or upload a new CSV</div>

  <label for="csvFile"><strong>CSV file</strong></label>
  <input id="csvFile" type="file" accept=".csv,text/csv" />
  <div class="help">Expected columns include morphology fields such as <code>pos</code>, <code>person</code>, <code>number</code>, <code>tense</code>, <code>mood</code>, <code>voice</code>, <code>gender</code>, <code>case</code> (any subset is fine).</div>
  <div id="loadStatus" class="status muted">No file loaded yet.</div>
</div>

## 1b. Save / Manage datasets

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

## 4. Visualization Studio

<div class="card">
  <div class="grid-3">
    <div class="field">
      <label for="vizDataset"><strong>Dataset</strong></label>
      <select id="vizDataset">
        <option value="raw">Raw data</option>
        <option value="morph">Morphology-filtered</option>
        <option value="final">Ending-filtered</option>
      </select>
    </div>
    <div class="field">
      <label for="vizPrimary"><strong>Group by</strong></label>
      <select id="vizPrimary" disabled></select>
    </div>
    <div class="field">
      <label for="vizSecondary"><strong>Then by (optional)</strong></label>
      <select id="vizSecondary" disabled></select>
    </div>
  </div>

  <div class="grid-3">
    <div class="field">
      <label for="vizTopN"><strong>Top categories</strong></label>
      <input id="vizTopN" type="text" value="20" />
    </div>
    <div class="field">
      <label for="vizSort"><strong>Sort</strong></label>
      <select id="vizSort">
        <option value="desc">Largest first</option>
        <option value="asc">Smallest first</option>
        <option value="alpha">Alphabetical</option>
      </select>
    </div>
    <div class="field startup-actions">
      <button id="btnViz" class="btn btn-primary" disabled>Render visualization</button>
    </div>
  </div>

  <div id="vizWrap" class="viz-wrap"></div>
</div>

## 5. Download filtered CSV

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
