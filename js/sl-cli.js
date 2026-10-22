/**
 * ScoreLint Interactive In-Browser CLI v2.0.0
 * (c) 2026 Loren - MIT License
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SLCLI = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class CLI {
    constructor(container, onAction) {
      this.container = container;
      this.onAction = onAction || (() => {});
      this.currentScore = null;
      this.currentLint = null;
      this.history = [];
      this.historyIdx = 0;

      this.initUI();
    }

    setScore(score, lint) {
      this.currentScore = score;
      this.currentLint = lint;
      this.printLine(`Loaded score: <b class="text-sky">${score.name || score.title}</b>`, 'info');
    }

    initUI() {
      this.container.innerHTML = `
        <div class="cli-output" id="slCliOutput"></div>
        <div class="cli-input-line">
          <span class="cli-prompt">scorelint:~$</span>
          <input type="text" class="cli-input" id="slCliInput" autocomplete="off" spellcheck="false" placeholder="Type 'help' for commands...">
        </div>
      `;

      this.outputEl = this.container.querySelector('#slCliOutput');
      this.inputEl = this.container.querySelector('#slCliInput');

      this.printWelcome();

      this.inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const val = this.inputEl.value.trim();
          this.inputEl.value = '';
          if (val) {
            this.history.push(val);
            this.historyIdx = this.history.length;
            this.execCommand(val);
          }
        } else if (e.key === 'ArrowUp') {
          if (this.historyIdx > 0) {
            this.historyIdx--;
            this.inputEl.value = this.history[this.historyIdx];
          }
        } else if (e.key === 'ArrowDown') {
          if (this.historyIdx < this.history.length - 1) {
            this.historyIdx++;
            this.inputEl.value = this.history[this.historyIdx];
          } else {
            this.historyIdx = this.history.length;
            this.inputEl.value = '';
          }
        }
      });
    }

    printWelcome() {
      this.printLine('===================================================================', 'muted');
      this.printLine('🎼 <b class="text-sky">ScoreLint Semantic Linter Shell v2.0.0</b>', 'main');
      this.printLine('Digital Music Score Structure, Rhythmic Integrity & Engraving Linter', 'muted');
      this.printLine('Type <b class="text-emerald">help</b> for available linting commands.', 'main');
      this.printLine('===================================================================', 'muted');
    }

    printLine(html, type = 'main') {
      const line = document.createElement('div');
      line.className = `cli-line cli-${type}`;
      line.innerHTML = html;
      this.outputEl.appendChild(line);
      this.outputEl.scrollTop = this.outputEl.scrollHeight;
    }

    execCommand(input) {
      this.printLine(`<span class="text-muted">scorelint:~$</span> <b>${input}</b>`, 'cmd');
      const parts = input.trim().split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      switch (cmd) {
        case 'help':
          this.cmdHelp();
          break;
        case 'scores':
        case 'list':
          this.cmdScores();
          break;
        case 'load':
          this.cmdLoad(args[0]);
          break;
        case 'lint':
        case 'check':
          this.cmdLint();
          break;
        case 'rules':
          this.cmdRules();
          break;
        case 'diff':
          this.cmdDiff(args[0]);
          break;
        case 'metrics':
          this.cmdMetrics();
          break;
        case 'export':
          this.cmdExport();
          break;
        case 'clear':
          this.outputEl.innerHTML = '';
          break;
        case 'about':
          this.printLine('ScoreLint v2.0.0 (c) 2026 Loren (@lorenhey) - MIT License.');
          this.printLine('Exact rational timing with fractional arithmetic & MusicXML 4.0 validation.');
          break;
        default:
          this.printLine(`Unknown command: '${cmd}'. Type <b class="text-emerald">help</b> for a list.`, 'error');
          break;
      }
    }

    cmdHelp() {
      this.printLine(`Available Commands:
  <b class="text-emerald">scores</b>        List all benchmark score & pathology scenarios
  <b class="text-emerald">load &lt;id&gt;</b>     Load a score into active linter engine
  <b class="text-emerald">lint</b>          Evaluate all engraving and syntax rules
  <b class="text-emerald">rules</b>         List supported MusicXML engraving rules
  <b class="text-emerald">diff</b>         Compare current score with clean reference
  <b class="text-emerald">metrics</b>      Display measure counts, parts, and error stats
  <b class="text-emerald">export</b>       Download JSON lint report and score data
  <b class="text-emerald">clear</b>        Clear the terminal screen
  <b class="text-emerald">about</b>        Display version and license info`);
    }

    cmdScores() {
      if (!window.SLCatalog) return;
      const list = window.SLCatalog.getAllScores();
      let table = `<table class="cli-table"><thead><tr><th>ID</th><th>Title</th><th>Category</th><th>Composer</th></tr></thead><tbody>`;
      list.forEach(s => {
        table += `<tr><td><b>${s.id}</b></td><td>${s.name}</td><td>${s.category}</td><td>${s.composer}</td></tr>`;
      });
      table += `</tbody></table>`;
      this.printLine(table);
      this.printLine(`Use <b class="text-emerald">load &lt;id&gt;</b> to inspect any score.`);
    }

    cmdLoad(id) {
      if (!id) {
        this.printLine(`Please provide a score ID. Example: <b class="text-sky">load benchmark-beethoven-ode-clean</b>`, 'warn');
        return;
      }
      if (!window.SLCatalog) return;
      const score = window.SLCatalog.getScoreById(id);
      if (score) {
        this.onAction('load', score);
      } else {
        this.printLine(`Score ID '${id}' not found. Type <b class="text-emerald">scores</b> for available IDs.`, 'error');
      }
    }

    cmdLint() {
      if (!this.currentLint) {
        this.printLine('No score loaded.', 'warn');
        return;
      }
      const lint = this.currentLint;
      this.printLine(`<b>Lint Assessment:</b> <span class="text-sky">${this.currentScore.name}</span>`);
      this.printLine(`Verdict: <b>${lint.verdict}</b> (Editorial Score: <b>${lint.healthScore}/100</b>)`);
      this.printLine('-------------------------------------------------------------------', 'muted');

      if (lint.findings.length === 0) {
        this.printLine('<span class="text-emerald">✓ No problems found in score. Perfect engraving integrity.</span>');
      } else {
        lint.findings.forEach((f, i) => {
          const col = f.severity === 'ERROR' ? 'text-rose' : (f.severity === 'WARNING' ? 'text-amber' : 'text-sky');
          this.printLine(`<b>${i + 1}. <span class="${col}">${f.severity.toLowerCase()}</span></b>  ${f.location}`);
          this.printLine(`   <span class="text-sky">${f.ruleId}</span>`);
          this.printLine(`   ${f.message}`, 'muted');
        });
        this.printLine(`<b>${lint.findings.length} problems</b> detected.`);
      }
    }

    cmdRules() {
      if (!window.SLEngine) return;
      const rules = window.SLEngine.RULES;
      this.printLine(`<b>Supported Engraving Rules:</b>`);
      let table = `<table class="cli-table"><thead><tr><th>Rule ID</th><th>Category</th><th>Default Severity</th><th>Description</th></tr></thead><tbody>`;
      rules.forEach(r => {
        table += `<tr><td><b class="text-sky">${r.id}</b></td><td>${r.category}</td><td>${r.defaultSeverity}</td><td>${r.description}</td></tr>`;
      });
      table += `</tbody></table>`;
      this.printLine(table);
    }

    cmdDiff(otherId) {
      if (!this.currentScore || !window.SLCatalog || !window.SLEngine) return;
      const refScore = otherId ? window.SLCatalog.getScoreById(otherId) : window.SLCatalog.getScoreById('benchmark-beethoven-ode-clean');
      const diffs = window.SLEngine.diffScores(this.currentScore, refScore);

      this.printLine(`<b>Semantic Diff:</b> comparing current score vs <i>${refScore.name}</i>`);
      if (diffs.length === 0) {
        this.printLine('<span class="text-emerald">✓ Scores are semantically identical.</span>');
      } else {
        diffs.forEach(d => {
          this.printLine(`• <b>[${d.action}]</b> ${d.message}`);
        });
      }
    }

    cmdMetrics() {
      if (!this.currentLint || !this.currentLint.summary) return;
      const s = this.currentLint.summary;
      let table = `<table class="cli-table"><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>`;
      table += `<tr><td>Total Parts</td><td><b>${s.totalParts}</b></td></tr>`;
      table += `<tr><td>Total Measures</td><td><b>${s.totalMeasures}</b></td></tr>`;
      table += `<tr><td>Errors</td><td><b class="text-rose">${s.errorsCount}</b></td></tr>`;
      table += `<tr><td>Warnings</td><td><b class="text-amber">${s.warningsCount}</b></td></tr>`;
      table += `<tr><td>Total Problems</td><td><b>${s.totalProblems}</b></td></tr>`;
      table += `<tr><td>Editorial Health</td><td><b>${this.currentLint.healthScore}%</b></td></tr>`;
      table += `</tbody></table>`;
      this.printLine(table);
    }

    cmdExport() {
      if (!this.currentScore) return;
      this.onAction('export', { score: this.currentScore });
      this.printLine('Exporting score and findings report to JSON...', 'info');
    }
  }

  return { CLI };
});
