---
layout: default
title: Clustering
section: clustering
---

<section class="hero card">
  <p class="kicker">Greek NLP Workspace</p>
  <h1>Book Clustering Studio</h1>
  <p class="lead">Run 10 clustering strategies over books using forms, lemmas, or configurable n-gram collocations, with MDS and multiple visual diagnostics.</p>
</section>

<div class="card">
  <h2>1. Load dataset</h2>
  <div class="grid-3">
    <div class="field">
      <label for="clusterCsvFile"><strong>CSV file</strong></label>
      <input id="clusterCsvFile" type="file" accept=".csv,text/csv" />
    </div>
    <div class="field">
      <label for="clusterBundledDataset"><strong>Bundled dataset</strong></label>
      <select id="clusterBundledDataset">
        <option value="default.csv">default.csv (Epic corpus)</option>
        <option value="default2.csv">default2.csv (Entire Greek corpus)</option>
      </select>
      <div class="btn-row" style="margin-top:.35rem;"><button id="btnClusterLoadBundled" class="btn">Load bundled CSV</button></div>
    </div>
    <div class="field">
      <label for="clusterSharedDataset"><strong>From Morphology filters</strong></label>
      <select id="clusterSharedDataset"></select>
      <div class="btn-row" style="margin-top:.35rem;"><button id="btnClusterLoadShared" class="btn">Load selected filtered dataset</button></div>
    </div>
  </div>
  <div id="clusterLoadStatus" class="status muted">No clustering dataset loaded yet.</div>
</div>

<div class="card">
  <h2>2. Configure features</h2>
  <div class="grid-3">
    <div class="field"><label for="clusterBookCol"><strong>Book column</strong></label><select id="clusterBookCol" disabled></select></div>
    <div class="field"><label for="clusterTokenCol"><strong>Token column</strong></label><select id="clusterTokenCol" disabled></select></div>
    <div class="field"><label for="clusterFeatureMode"><strong>Feature mode</strong></label><select id="clusterFeatureMode"><option value="token">Direct tokens</option><option value="collocation">Collocations (n-grams)</option></select></div>
  </div>
  <div class="grid-3">
    <div class="field"><label for="clusterNgram"><strong>Collocation size n</strong></label><input id="clusterNgram" type="text" value="2" /></div>
    <div class="field"><label for="clusterVectorModel"><strong>Vector model</strong></label><select id="clusterVectorModel"><option value="binary">Binary presence</option><option value="count">Raw counts</option><option value="tfidf" selected>TF-IDF</option></select></div>
    <div class="field"><label for="clusterDistance"><strong>Distance metric</strong></label><select id="clusterDistance"><option value="cosine" selected>Cosine</option><option value="jaccard">Jaccard</option><option value="euclidean">Euclidean</option><option value="manhattan">Manhattan</option></select></div>
  </div>
</div>

<div class="card">
  <h2>3. Choose clustering strategy (10 options)</h2>
  <div class="grid-3">
    <div class="field"><label for="clusterMethod"><strong>Clustering method</strong></label><select id="clusterMethod">
      <option value="threshold">1) Threshold graph components</option>
      <option value="single">2) Agglomerative single-link</option>
      <option value="complete">3) Agglomerative complete-link</option>
      <option value="average">4) Agglomerative average-link</option>
      <option value="ward">5) Agglomerative ward (euclidean-ish)</option>
      <option value="kmeans">6) K-means</option>
      <option value="kmedoids">7) K-medoids</option>
      <option value="dbscan">8) DBSCAN</option>
      <option value="labelprop">9) Label propagation (graph)</option>
      <option value="mds_kmeans">10) MDS + K-means</option>
    </select></div>
    <div class="field"><label for="clusterK"><strong>Target clusters (k)</strong></label><input id="clusterK" type="text" value="6" /></div>
    <div class="field"><label for="clusterThreshold"><strong>Similarity threshold</strong></label><input id="clusterThreshold" type="text" value="0.25" /></div>
  </div>
  <div class="grid-3">
    <div class="field"><label for="clusterEps"><strong>DBSCAN epsilon (distance)</strong></label><input id="clusterEps" type="text" value="0.65" /></div>
    <div class="field"><label for="clusterMinPts"><strong>DBSCAN minPts</strong></label><input id="clusterMinPts" type="text" value="2" /></div>
    <div class="field"><label for="clusterTopFeatures"><strong>Top features per cluster</strong></label><input id="clusterTopFeatures" type="text" value="10" /></div>
  </div>
  <div class="btn-row"><button id="btnRunCluster" class="btn btn-primary" disabled>Run clustering pipeline</button><button id="btnClusterBenchmark" class="btn" disabled>Benchmark methods</button><button id="btnClusterExport" class="btn">Export assignments (CSV)</button></div>
</div>

<div class="card">
  <h2>4. Visualizations</h2>
  <div id="clusterSummary" class="analysis-wrap"></div>
  <div class="viz-wrap"><h3>Method benchmark</h3><div id="clusterBenchmark"></div></div>
  <div class="grid-2">
    <div class="viz-wrap"><h3>MDS scatter</h3><svg id="clusterMdsSvg" class="cluster-svg" viewBox="0 0 760 420"></svg></div>
    <div class="viz-wrap"><h3>Cluster size bars</h3><div id="clusterSizeBars"></div></div>
  </div>
  <div class="grid-2">
    <div class="viz-wrap"><h3>Similarity heatmap</h3><div id="clusterHeatmap"></div></div>
    <div class="viz-wrap"><h3>Network (threshold edges)</h3><svg id="clusterNetworkSvg" class="cluster-svg" viewBox="0 0 760 420"></svg></div>
  </div>
  <div class="viz-wrap"><h3>Cluster feature signatures</h3><div id="clusterFeatures"></div></div>
</div>
