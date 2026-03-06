---
layout: default
title: Morphology
section: morphology
---

<section class="hero card">
  <p class="kicker">MOPSOS</p>
  <h1>Morphological analysis and visualization</h1>
  <p class="lead">Analysis and visualization of ancient Greek morphology.</p>
</section>

<div class="stats-grid" id="statsGrid">
  <div class="stat-card"><span class="stat-label">Rows loaded</span><strong id="statRows">0</strong></div>
  <div class="stat-card"><span class="stat-label">After morphology</span><strong id="statMorph">0</strong></div>
  <div class="stat-card"><span class="stat-label">After ending filter</span><strong id="statFinal">0</strong></div>
</div>



<div class="card">
  <h2>Quick table of contents</h2>
  <div class="field">
    <label for="morphToc"><strong>Jump to section</strong></label>
    <select id="morphToc" onchange="if(this.value) location.hash=this.value;">
      <option value="">Choose section...</option>
      <option value="sec-start">1. Start with a dataset</option>
      <option value="sec-save">1b. Save / Manage datasets</option>
      <option value="sec-default">1c. Set a default CSV in assets</option>
      <option value="sec-morph">2. Morphology filter</option>
      <option value="sec-endings">3. Ending filter</option>
      <option value="sec-viz">4. Visualization Studio</option>
      <option value="sec-analysis">5. Analysis dropdowns</option>
      <option value="sec-download">6. Download filtered CSV</option>
      <option value="sec-preview">Status / Preview</option>
    </select>
  </div>
</div>

<h2 id="sec-start">1. Start with a dataset</h2>

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

  <div class="grid-2">
    <div class="field">
      <label for="bundledDatasetChoice"><strong>Bundled dataset</strong></label>
      <select id="bundledDatasetChoice">
        <option value="default.csv">default.csv (Epic corpus)</option>
        <option value="default2.csv">default2.csv (Entire Greek corpus)</option>
      </select>
      <div class="help" style="margin-top:.35rem;">Direct file links: <a href="{{ '/assets/data/default.csv' | relative_url }}" target="_blank" rel="noopener">default.csv</a> · <a href="{{ '/assets/data/default2.csv' | relative_url }}" target="_blank" rel="noopener">default2.csv</a></div>
    </div>
    <div class="field startup-actions">
      <button id="btnLoadBundled" class="btn">Load selected bundled CSV</button>
    </div>
  </div>

  <div class="divider">or upload a new CSV</div>

  <label for="csvFile"><strong>CSV file</strong></label>
  <input id="csvFile" type="file" accept=".csv,text/csv" />
  <div class="help">Expected columns include morphology fields such as <code>pos</code>, <code>person</code>, <code>number</code>, <code>tense</code>, <code>mood</code>, <code>voice</code>, <code>gender</code>, <code>case</code> (any subset is fine).</div>
  <div id="loadStatus" class="status muted">No file loaded yet.</div>
</div>

<h2 id="sec-save">1b. Save / Manage datasets</h2>

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


<h2 id="sec-default">1c. Set a default CSV in assets</h2>

<div class="card">
  <ol>
    <li>Place your bundled files at <code>assets/data/default.csv</code> (Epic corpus) and <code>assets/data/default2.csv</code> (Entire Greek corpus).</li>
    <li>Keep headers compatible with this app (e.g. <code>pos</code>, <code>person</code>, <code>number</code>, <code>tense</code>, <code>mood</code>, <code>voice</code>, <code>gender</code>, <code>case</code>, plus <code>form</code> or similar).</li>
    <li>Choose one from <strong>Bundled dataset</strong> and click <strong>Load selected bundled CSV</strong> at startup.</li>
  </ol>
  <div class="help">If you want different names/paths, edit <code>BUNDLED_DATASET_URLS</code> in <code>assets/js/app.js</code>. You can still upload your own CSV anytime.</div>
</div>

<h2 id="sec-morph">2. Morphology filter (sequential)</h2>

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

<h2 id="sec-endings">3. Ending filter</h2>

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

<h2 id="sec-viz">4. Visualization Studio</h2>

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
    <div class="field">
      <label for="vizType"><strong>Plot type</strong></label>
      <select id="vizType">
        <option value="bars">Bars</option>
        <option value="percent">Percent bars</option>
        <option value="table">Compact table</option>
        <option value="dot">Dot plot</option>
      </select>
    </div>
  </div>

  <div class="grid-3">
    <div class="field startup-actions">
      <button id="btnViz" class="btn btn-primary" disabled>Render visualization</button>
    </div>
  </div>

  <div id="vizWrap" class="viz-wrap"></div>
</div>

<h2 id="sec-analysis">5. Analysis dropdowns</h2>

<div class="tab-row" role="tablist" aria-label="Analysis panels">
  <button class="tab-btn is-active" type="button" data-panel-tab="analysis" id="tabAnalysis">Analysis</button>
  <button class="tab-btn" type="button" data-panel-tab="clustering" id="tabClustering">Clustering</button>
</div>

<div class="card panel-card is-active" data-panel="analysis">
  <div class="grid-3">
    <div class="field">
      <label for="analysisType"><strong>Analysis</strong></label>
      <select id="analysisType">
        <option value="summary">Dataset summary</option>
        <option value="valueCounts">Value counts (one column)</option>
        <option value="crossTab">Cross-tab (two columns)</option>
        <option value="missingness">Missingness report</option>
        <option value="distinctness">Distinctness report</option>
        <option value="lengthProfile">Token length profile</option>
      </select>
    </div>
    <div class="field">
      <label for="analysisColA"><strong>Primary column</strong></label>
      <select id="analysisColA" disabled></select>
    </div>
    <div class="field">
      <label for="analysisColB"><strong>Secondary column</strong></label>
      <select id="analysisColB" disabled></select>
    </div>
  </div>

  <div class="btn-row">
    <button id="btnRunAnalysis" class="btn btn-primary" disabled>Run analysis</button>
  </div>

  <div id="analysisWrap" class="analysis-wrap"></div>
</div>

<h2 id="sec-download">6. Download filtered CSV</h2>

<div class="card">
  <div class="help">Tip: when you run morphology/ending filters, snapshots are automatically shared to the Stylometry page as <code>morph_filtered</code> and <code>ending_filtered</code>.</div>


  <div class="field">
    <label for="baseName"><strong>Base filename</strong></label>
    <input id="baseName" type="text" value="filtered_output" />
  </div>

  <div class="btn-row">
    <button id="btnDownload" class="btn btn-success" disabled>3) Download current dataframe (.csv)</button>
  </div>
</div>

<h2 id="sec-preview">Status / Preview</h2>

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
