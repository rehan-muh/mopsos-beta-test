---
layout: default
title: Prosody
section: prosody
---

<section class="hero card">
  <p class="kicker">MOPSOS</p>
  <h1>Scansion</h1>
  <p class="lead">Metrical Scansion and Rhythm</p>
</section>

<div class="card">
  <h2>1. Input verses</h2>
  <p class="help">Enter one verse per line. You can use a custom template or quick presets for common meters.</p>
  <div class="grid-3">
    <div class="field">
      <label for="prosodyPreset"><strong>Meter preset</strong></label>
      <select id="prosodyPreset">
        <option value="">Custom / none</option>
        <option value="hex">Dactylic hexameter</option>
        
      </select>
    </div>
    <div class="field startup-actions">
      <button id="btnApplyPreset" class="btn">Apply preset</button>
    </div>
    <div class="field startup-actions">
      <button id="btnProsodyExport" class="btn">Export scansion report (CSV)</button>
    </div>
  </div>
  <div class="grid-2">
    <div class="field">
      <label for="prosodyInput"><strong>Verse text</strong></label>
      <textarea id="prosodyInput" class="big-textarea">μῆνιν ἄειδε θεὰ Πηληϊάδεω Ἀχιλῆος
οὐλομένην, ἣ μυρί᾽ Ἀχαιοῖς ἄλγε᾽ ἔθηκε</textarea>
    </div>
    <div class="field">
      <label for="prosodyTemplate"><strong>Meter template (optional)</strong></label>
      <textarea id="prosodyTemplate" class="big-textarea">– ⏑ ⏑ | – ⏑ ⏑ | – ⏑ ⏑ | – ⏑ ⏑ | – ⏑ ⏑ | – –</textarea>
    </div>
  </div>
  <div class="btn-row">
    <button id="btnRunProsody" class="btn btn-primary">Run scansion</button>
    <button id="btnProsodySample" class="btn">Load sample</button>
  </div>
</div>


<div class="card">
  <h2>2. Homer scansion corpus (assets/data/scansion)</h2>
  <p class="help">Load precomputed Homeric scansion tables (files, lines, words, syllables) for corpus-level metrical statistics.</p>
  <div class="grid-3">
    <div class="field">
      <label for="scansionWork"><strong>Corpus scope</strong></label>
      <select id="scansionWork">
        <option value="all" selected>All works</option>
        <option value="iliad">Iliad</option>
        <option value="odyssey">Odyssey</option>
        <option value="homer">Combined Homer files</option>
      </select>
    </div>
    <div class="field startup-actions">
      <button id="btnLoadScansionCorpus" class="btn">Load scansion corpus</button>
    </div>
    <div class="field startup-actions">
      <button id="btnScansionRefresh" class="btn">Refresh statistics</button>
    </div>
  </div>
  <div id="scansionLoadStatus" class="status muted">Scansion corpus not loaded yet.</div>
  <div id="scansionCorpusSummary" class="analysis-wrap"></div>
  <div class="grid-2">
    <div class="viz-wrap"><h3>Lines by work</h3><div id="scansionLinesByWork"></div></div>
    <div class="viz-wrap"><h3>Top feet patterns</h3><div id="scansionFeetPatterns"></div></div>
  </div>
  <div class="grid-2">
    <div class="viz-wrap"><h3>Syllable quantity profile</h3><div id="scansionQuantityProfile"></div></div>
    <div class="viz-wrap"><h3>Line-level pacing</h3><div id="scansionPacingProfile"></div></div>
  </div>
</div>

<div class="card">
  <h2>3. Scansion + text</h2>
  <div id="prosodySummary" class="analysis-wrap"></div>
  <div class="viz-wrap">
    <h3>Verse alignment (text + scansion)</h3>
    <div id="prosodyAlignment"></div>
  </div>
  <div class="grid-2">
    <div class="viz-wrap">
      <h3>Syllable profile</h3>
      <div id="prosodyBars"></div>
    </div>
    <div class="viz-wrap">
      <h3>Template + caesura diagnostics</h3>
      <div id="prosodyDiagnostics"></div>
    </div>
  </div>
</div>
