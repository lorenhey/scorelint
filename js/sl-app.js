/**
 * ScoreLint Main App Controller v2.0.0
 * (c) 2026 Loren - MIT License
 */

(function () {
  'use strict';

  let currentScore = null;
  let currentLint = null;
  let cliInstance = null;

  document.addEventListener('DOMContentLoaded', () => {
    initApp();
  });

  function initApp() {
    // Populate Score Selector
    const select = document.getElementById('scoreSelect');
    if (select && window.SLCatalog) {
      select.innerHTML = '';
      const list = window.SLCatalog.getAllScores();
      list.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.category === 'PATHOLOGY' ? '⚠️ ' : '🎼 '} ${s.name}`;
        select.appendChild(opt);
      });

      select.addEventListener('change', (e) => {
        loadScore(e.target.value);
      });
    }

    // Initialize CLI Terminal
    const termElem = document.getElementById('cliTerminal');
    if (termElem && window.SLCLI) {
      cliInstance = new window.SLCLI.CLI(termElem, (action, data) => {
        if (action === 'load') {
          currentScore = data;
          if (select) select.value = data.id;
          updateUI();
        } else if (action === 'export') {
          handleExport('json', data.score);
        }
      });
    }

    // Tab Navigation
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        switchTab(target);
      });
    });

    // File Drag & Drop
    initFileDrop();

    // Export & Action buttons
    const btnExportJson = document.getElementById('btnExportJson');
    if (btnExportJson) btnExportJson.addEventListener('click', () => handleExport('json', currentScore));

    const btnCopyVerdict = document.getElementById('btnCopyVerdict');
    if (btnCopyVerdict) btnCopyVerdict.addEventListener('click', copyVerdictToClipboard);

    // Initial Load: First benchmark score
    if (window.SLCatalog) {
      loadScore('benchmark-beethoven-ode-clean');
    }

    // Populate Rules Table
    populateRulesTable();

    // Window Resize Handler
    window.addEventListener('resize', debounce(() => {
      renderAllCharts();
    }, 150));
  }

  function switchTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === `pane-${tabId}`);
    });
    renderAllCharts();
  }

  function loadScore(id) {
    if (!window.SLCatalog) return;
    currentScore = window.SLCatalog.getScoreById(id);
    updateUI();
  }

  function updateUI() {
    if (!currentScore) return;

    // Run Semantic Linter
    if (window.SLEngine) {
      currentLint = window.SLEngine.lintScore(currentScore);
    }

    if (cliInstance) {
      cliInstance.setScore(currentScore, currentLint);
    }

    // Update Header Metadata
    const titleEl = document.getElementById('scoreTitle');
    if (titleEl) titleEl.textContent = currentScore.name || currentScore.workTitle;

    const descEl = document.getElementById('scoreDesc');
    if (descEl) descEl.textContent = currentScore.description;

    const infoEl = document.getElementById('scoreInfo');
    if (infoEl) {
      const partsCount = currentScore.parts ? currentScore.parts.length : 1;
      const measuresCount = currentScore.parts ? currentScore.parts.reduce((acc, p) => acc + p.measures.length, 0) : 0;
      infoEl.innerHTML = `
        <span>🎼 <b>Composer:</b> ${currentScore.composer || 'Anonymous'}</span>
        <span>📜 <b>Work:</b> ${currentScore.workTitle || currentScore.name}</span>
        <span>🎻 <b>Parts:</b> ${partsCount} (${currentScore.parts.map(p => p.name || p.id).join(', ')})</span>
        <span>📏 <b>Measures:</b> ${measuresCount}</span>
      `;
    }

    // Update Lint Verdict Banner
    if (currentLint) {
      const badge = document.getElementById('verdictBadge');
      if (badge) {
        badge.textContent = currentLint.verdict;
        let col = '#10b981';
        if (currentLint.verdict.includes('ERROR')) col = '#ef4444';
        else if (currentLint.verdict.includes('WARNING')) col = '#f59e0b';

        badge.style.backgroundColor = col + '25';
        badge.style.borderColor = col;
        badge.style.color = col;
      }

      const scoreEl = document.getElementById('scoreHealthVal');
      if (scoreEl) {
        scoreEl.textContent = currentLint.healthScore;
        let col = '#10b981';
        if (currentLint.healthScore < 60) col = '#ef4444';
        else if (currentLint.healthScore < 85) col = '#f59e0b';
        scoreEl.style.color = col;
      }

      // KPI Metric Cards
      const sum = currentLint.summary;
      setVal('kpiProblems', `${sum.totalProblems}`);
      setVal('kpiProblemsSub', `${sum.errorsCount} errors, ${sum.warningsCount} warnings`);
      setVal('kpiMeasures', `${sum.totalMeasures}`);
      setVal('kpiMeasuresSub', `Across ${sum.totalParts} part(s)`);
      setVal('kpiHealth', `${currentLint.healthScore}%`);
      setVal('kpiHealthSub', currentLint.healthScore >= 90 ? '✓ Publication Grade' : '⚠️ Editorial Revisions Needed');
      setVal('kpiTies', `${currentLint.findings.filter(f => f.ruleId.startsWith('ties')).length}`);
      setVal('kpiTiesSub', 'Pitch & boundary integrity');
      setVal('kpiRhythm', `${currentLint.findings.filter(f => f.ruleId.startsWith('rhythm')).length}`);
      setVal('kpiRhythmSub', 'Measure beat budget delta');

      // Render Findings List
      renderFindings(currentLint.findings);
    }

    // Render Canvas Charts
    renderAllCharts();

    // Trigger KaTeX typesetting
    if (window.renderMathInElement) {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ]
      });
    }
  }

  function renderFindings(findings) {
    const container = document.getElementById('findingsList');
    if (!container) return;

    if (!findings || findings.length === 0) {
      container.innerHTML = `
        <div class="finding-card optimal">
          <div class="finding-header">
            <span class="finding-title text-emerald">✓ PERFECT SCORE INTEGRITY</span>
            <span class="finding-badge badge-pass">PASSED</span>
          </div>
          <p class="finding-desc">All measures, voices, ties, slurs, and rhythmic beat budgets conform to MusicXML 4.0 engraving standards.</p>
        </div>
      `;
    } else {
      container.innerHTML = findings.map(f => {
        let badgeClass = 'badge-info';
        let cardClass = 'moderate';
        if (f.severity === 'ERROR') {
          badgeClass = 'badge-fail';
          cardClass = 'critical';
        } else if (f.severity === 'WARNING') {
          badgeClass = 'badge-warn';
          cardClass = 'major';
        }

        return `
          <div class="finding-card ${cardClass}">
            <div class="finding-header">
              <span class="finding-title">[${f.location}] ${f.ruleId}</span>
              <span class="finding-badge ${badgeClass}">${f.severity}</span>
            </div>
            <p class="finding-desc">${f.message}</p>
          </div>
        `;
      }).join('');
    }
  }

  function populateRulesTable() {
    const tbody = document.getElementById('rulesTableBody');
    if (!tbody || !window.SLEngine) return;

    tbody.innerHTML = window.SLEngine.RULES.map(r => `
      <tr>
        <td><b class="text-sky">${r.id}</b></td>
        <td><span class="category-badge">${r.category}</span></td>
        <td><span class="severity-badge badge-${r.defaultSeverity.toLowerCase()}">${r.defaultSeverity}</span></td>
        <td>${r.description}</td>
        <td><small class="text-dim">${r.rationale}</small></td>
      </tr>
    `).join('');
  }

  function renderAllCharts() {
    if (!currentScore || !window.SLPlotter) return;

    const stavesCanvas = document.getElementById('canvasStaves');
    if (stavesCanvas) window.SLPlotter.drawMeasureTimeline(stavesCanvas, currentScore, currentLint);

    const diffCanvas = document.getElementById('canvasDiff');
    if (diffCanvas && window.SLEngine && window.SLCatalog) {
      const ref = window.SLCatalog.getScoreById('benchmark-beethoven-ode-clean');
      const diffList = window.SLEngine.diffScores(currentScore, ref);
      window.SLPlotter.drawScoreDiff(diffCanvas, diffList);
    }

    const gaugeCanvas = document.getElementById('canvasGauges');
    if (gaugeCanvas && currentLint) window.SLPlotter.drawScoreGauges(gaugeCanvas, currentLint);
  }

  function setVal(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function handleExport(format, score) {
    if (!score) return;
    const filename = `ScoreLint_${score.id || 'custom'}_${Date.now()}.json`;

    const exportObj = {
      score,
      lint_report: currentLint,
      generator: 'ScoreLint v2.0.0 (https://lorenhey.github.io/scorelint/)'
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  function copyVerdictToClipboard() {
    if (!currentScore || !currentLint) return;
    const text = `ScoreLint Engraving Audit:
Score: ${currentScore.name || currentScore.workTitle}
Overall Verdict: ${currentLint.verdict} (Score: ${currentLint.healthScore}/100)
Total Problems: ${currentLint.summary.totalProblems} (${currentLint.summary.errorsCount} errors, ${currentLint.summary.warningsCount} warnings)
Findings:
${currentLint.findings.map(f => `- [${f.severity}] ${f.location}: ${f.ruleId} - ${f.message}`).join('\n')}
`;
    navigator.clipboard.writeText(text).then(() => {
      alert('ScoreLint assessment copied to clipboard!');
    }).catch(() => {
      prompt('Copy verdict manually:', text);
    });
  }

  function initFileDrop() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) handleFile(files[0]);
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });
  }

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        if (file.name.endsWith('.musicxml') || file.name.endsWith('.xml')) {
          const parsed = window.SLEngine.parseMusicXml(text);
          parsed.id = `custom-${Date.now()}`;
          parsed.name = file.name;
          parsed.category = 'CUSTOM';
          parsed.description = `Imported from ${file.name}.`;

          currentScore = parsed;
          updateUI();
          alert(`Successfully parsed MusicXML score '${file.name}' with ${currentScore.parts.length} part(s)!`);
        } else if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          const score = parsed.score || parsed;
          if (score && score.parts) {
            currentScore = score;
            updateUI();
            alert(`Loaded custom score '${score.name || file.name}'.`);
          }
        } else {
          alert('Please upload a valid .musicxml, .xml or .json file.');
        }
      } catch (err) {
        alert('Failed to parse file: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  function debounce(fn, ms) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }
})();
