---
layout: default
title: Syntax
section: syntax
---

<section class="hero card">
  <p class="kicker">Greek NLP Tools</p>
  <h1>Syntax Workbench</h1>
  <p class="lead">Generate dependency trees, phrase structure snapshots, corpus-level syntax statistics, and searchable constructions from token-level annotation.</p>
</section>

<div class="card">
  <h2>1. Input sentence data</h2>
  <p class="help">Use one token per line: <code>id[TAB]form[TAB]lemma[TAB]pos[TAB]head[TAB]deprel</code>. Separate sentences with a blank line.</p>
  <div class="field">
    <label for="syntaxInput"><strong>Token rows</strong></label>
    <textarea id="syntaxInput" class="big-textarea">1	μῆνιν	μῆνις	NOUN	2	obj
2	ἄειδε	ἀείδω	VERB	0	root
3	θεὰ	θεά	NOUN	2	vocative
4	Πηληϊάδεω	Πηληϊάδης	PROPN	5	nmod
5	Ἀχιλῆος	Ἀχιλλεύς	PROPN	3	appos

1	οὐλομένην	οὐλόμενος	ADJ	3	amod
2	ἣ	ὅς	PRON	3	nsubj
3	ἔθηκε	τίθημι	VERB	0	root
4	ἄλγε᾽	ἄλγος	NOUN	3	obj
5	Ἀχαιοῖς	Ἀχαιός	NOUN	3	iobj</textarea>
  </div>
  <div class="grid-3">
    <div class="field"><label for="syntaxSentenceSelect"><strong>Sentence</strong></label><select id="syntaxSentenceSelect"></select></div>
    <div class="field"><label for="syntaxRelFilter"><strong>Filter relation</strong></label><input id="syntaxRelFilter" type="text" placeholder="e.g. obj, nsubj" /></div>
    <div class="field"><label for="syntaxPosFilter"><strong>Filter POS</strong></label><input id="syntaxPosFilter" type="text" placeholder="e.g. VERB" /></div>
  </div>
  <div class="btn-row">
    <button id="btnBuildSyntax" class="btn btn-primary">Build syntax views</button>
    <button id="btnSyntaxSample" class="btn">Load sample</button>
    <button id="btnSyntaxExport" class="btn">Export syntax report (CSV)</button>
  </div>
</div>

<div class="card">
  <h2>2. Syntactic outputs</h2>
  <div id="syntaxSummary" class="analysis-wrap"></div>
  <div class="grid-2">
    <div class="viz-wrap">
      <h3>Dependency tree</h3>
      <svg id="syntaxDepSvg" class="cluster-svg" viewBox="0 0 1100 460"></svg>
    </div>
    <div class="viz-wrap">
      <h3>Phrase-structure sketch</h3>
      <pre id="syntaxPhrase" class="status" style="min-height:280px;"></pre>
    </div>
  </div>
  <div class="grid-2">
    <div class="viz-wrap">
      <h3>Corpus relation profile</h3>
      <div id="syntaxRelationBars"></div>
    </div>
    <div class="viz-wrap">
      <h3>Construction hits</h3>
      <div id="syntaxHits"></div>
    </div>
  </div>
  <div class="viz-wrap">
    <h3>Token table</h3>
    <div id="syntaxTable"></div>
  </div>
</div>
