---
layout: default
title: Phonology
section: phonology
---

<section class="hero card">
  <p class="kicker">Greek NLP Tools</p>
  <h1>Phonology Analyzer</h1>
  <p class="lead">Analyze phonological distributions, syllable structure, onset/coda behavior, and vowel quantity patterns from Greek corpora.</p>
</section>

<div class="card">
  <h2>1. Load dataset</h2>
  <div class="grid-3">
    <div class="field">
      <label for="phonCsvFile"><strong>CSV file</strong></label>
      <input id="phonCsvFile" type="file" accept=".csv,text/csv" />
    </div>
    <div class="field">
      <label for="phonBundledDataset"><strong>Bundled dataset</strong></label>
      <select id="phonBundledDataset">
        <option value="default.csv">default.csv (Epic corpus)</option>
        <option value="default2.csv">default2.csv (Entire Greek corpus)</option>
      </select>
      <div class="btn-row" style="margin-top:.35rem;"><button id="btnPhonLoadBundled" class="btn">Load bundled CSV</button></div>
    </div>
    <div class="field">
      <label for="phonTokenCol"><strong>Token/form column</strong></label>
      <select id="phonTokenCol" disabled></select>
    </div>
  </div>
  <div class="btn-row"><button id="btnRunPhon" class="btn btn-primary" disabled>Run phonology analysis</button></div>
  <div id="phonLoadStatus" class="status muted">No phonology dataset loaded yet.</div>
</div>

<div class="card">
  <h2>2. Phonological outputs</h2>
  <div id="phonSummary" class="analysis-wrap"></div>
  <div class="grid-2">
    <div class="viz-wrap"><h3>Phoneme distribution</h3><div id="phonPhonemeBars"></div></div>
    <div class="viz-wrap"><h3>Syllable shape profile</h3><div id="phonShapeBars"></div></div>
  </div>
  <div class="grid-2">
    <div class="viz-wrap"><h3>Onset clusters</h3><div id="phonOnsetBars"></div></div>
    <div class="viz-wrap"><h3>Coda clusters</h3><div id="phonCodaBars"></div></div>
  </div>
  <div class="viz-wrap"><h3>Token-level phonology table</h3><div id="phonTable"></div></div>
</div>
