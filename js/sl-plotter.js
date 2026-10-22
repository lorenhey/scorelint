/**
 * ScoreLint Canvas 2D Visualizer v2.0.0
 * Measure Timelines, Visual Staves, Engraving Quality Gauges & Semantic Diff
 * (c) 2026 Loren - MIT License
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SLPlotter = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.width || 1200;
    const height = rect.height || canvas.height || 380;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, width, height };
  }

  // Pitch to Y coordinate on standard treble staff
  const PITCH_STEPS = {
    'C3': -4, 'D3': -3, 'E3': -2, 'F3': -1, 'G3': 0, 'A3': 1, 'B3': 2,
    'C4': 3, 'D4': 4, 'E4': 5, 'F4': 6, 'F#4': 6, 'Gb4': 6, 'G4': 7, 'G#4': 7, 'Ab4': 7, 'A4': 8, 'A#4': 8, 'Bb4': 8, 'B4': 9,
    'C5': 10, 'C#5': 10, 'D5': 11, 'D#5': 11, 'Eb5': 11, 'E5': 12, 'F5': 13, 'F#5': 13, 'G5': 14, 'A5': 15, 'B5': 16
  };

  /**
   * 1. MEASURE TIMELINE & STAVES VISUALIZER
   */
  function drawMeasureTimeline(canvas, score, lintResult, hoverData = null) {
    if (!canvas || !score || !score.parts) return;
    const { ctx, width, height } = setupCanvas(canvas);

    ctx.fillStyle = '#080c16';
    ctx.fillRect(0, 0, width, height);

    const parts = score.parts;
    const totalParts = parts.length;
    const partHeight = (height - 40) / Math.max(1, totalParts);

    // Collect all measures across parts to compute horizontal grid
    const maxMeasures = Math.max(...parts.map(p => p.measures.length), 1);
    const padL = 90;
    const padR = 30;
    const padT = 30;
    const plotW = width - padL - padR;
    const measureW = plotW / maxMeasures;

    // Collect finding locations for error highlighting
    const findings = (lintResult && lintResult.findings) || [];
    const errorMeasures = new Set();
    const warnMeasures = new Set();

    findings.forEach(f => {
      if (f.measureNum) {
        if (f.severity === 'ERROR') errorMeasures.add(`${f.partId}_${f.measureNum}`);
        else warnMeasures.add(`${f.partId}_${f.measureNum}`);
      }
    });

    parts.forEach((part, pIdx) => {
      const topY = padT + pIdx * partHeight;
      const midY = topY + partHeight / 2;

      // Part label
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(part.name || part.id, 12, midY + 4);

      // Draw 5 Staff Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      const lineSpacing = 7;
      const staffTop = midY - 2 * lineSpacing;

      for (let l = 0; l < 5; l++) {
        const sy = staffTop + l * lineSpacing;
        ctx.beginPath();
        ctx.moveTo(padL - 10, sy);
        ctx.lineTo(padL + plotW, sy);
        ctx.stroke();
      }

      // Clef sign placeholder
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '22px serif';
      ctx.fillText('𝄞', padL - 8, midY + 8);

      // Draw each measure
      part.measures.forEach((measure, mIdx) => {
        const mx = padL + mIdx * measureW;
        const key = `${part.id}_${measure.number}`;
        const hasError = errorMeasures.has(key);
        const hasWarn = warnMeasures.has(key);

        // Highlight background if anomalous
        if (hasError) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
          ctx.fillRect(mx, topY + 4, measureW, partHeight - 8);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(mx, topY + 4, measureW, partHeight - 8);
        } else if (hasWarn) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
          ctx.fillRect(mx, topY + 4, measureW, partHeight - 8);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(mx, topY + 4, measureW, partHeight - 8);
        }

        // Measure Barline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(mx + measureW, staffTop);
        ctx.lineTo(mx + measureW, staffTop + 4 * lineSpacing);
        ctx.stroke();

        // Measure Number Header
        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`M${measure.number}`, mx + measureW / 2, topY + 12);

        // Time Signature
        if (mIdx === 0 && measure.timeSignature) {
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 11px system-ui, sans-serif';
          ctx.fillText(`${measure.timeSignature.beats}`, mx + 16, midY - 2);
          ctx.fillText(`${measure.timeSignature.beatType}`, mx + 16, midY + 12);
        }

        // Measure Events / Notes
        const voices = Object.entries(measure.voices);
        const divisions = measure.divisions || 2;
        const totalMeasureDivisions = (measure.timeSignature ? (measure.timeSignature.beats * 4 / measure.timeSignature.beatType) : 4) * divisions;

        voices.forEach(([voiceId, voice], vIdx) => {
          let currentDiv = 0;
          const noteColor = voiceId === '2' ? '#c084fc' : (hasError ? '#f87171' : '#38bdf8');

          voice.events.forEach((ev, evIdx) => {
            const evFraction = currentDiv / totalMeasureDivisions;
            const evX = mx + 25 + evFraction * (measureW - 35);
            const durDiv = ev.duration;

            if (ev.type === 'note') {
              const stepIdx = PITCH_STEPS[ev.pitch] || 5;
              const noteY = staffTop + 4 * lineSpacing - (stepIdx - 1) * (lineSpacing / 2);

              // Draw Notehead
              ctx.save();
              ctx.fillStyle = noteColor;
              ctx.beginPath();
              ctx.ellipse(evX, noteY, 5, 4, -Math.PI / 6, 0, Math.PI * 2);
              ctx.fill();

              // Stem
              ctx.strokeStyle = noteColor;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(evX + 4, noteY);
              ctx.lineTo(evX + 4, noteY - 18);
              ctx.stroke();

              // Accidental (# / b)
              if (ev.pitch && ev.pitch.includes('#')) {
                ctx.font = 'bold 11px serif';
                ctx.fillText('♯', evX - 8, noteY + 4);
              }

              // Tie curve
              if (ev.tieStart) {
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(evX + 16, noteY + 6, 12, Math.PI * 0.1, Math.PI * 0.9);
                ctx.stroke();
              }

              // Pitch text label
              ctx.fillStyle = '#cbd5e1';
              ctx.font = '9px monospace';
              ctx.fillText(ev.pitch || '', evX, noteY + 16);
              ctx.restore();
            } else {
              // Rest glyph
              ctx.fillStyle = '#94a3b8';
              ctx.font = '14px serif';
              ctx.fillText('𝄽', evX, midY + 4);
            }

            currentDiv += durDiv;
          });
        });
      });
    });

    // Legend at bottom
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🔴 Rhythm Error / Incomplete Measure   🟡 Notation Warning (Tie Pitch Mismatch)   🔵 Voice 1   🟣 Voice 2', padL, height - 8);
  }

  /**
   * 2. SEMANTIC SCORE DIFF VISUALIZER
   */
  function drawScoreDiff(canvas, diffList) {
    if (!canvas) return;
    const { ctx, width, height } = setupCanvas(canvas);

    ctx.fillStyle = '#080c16';
    ctx.fillRect(0, 0, width, height);

    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('Semantic Score Diff Log (Musical Note & Duration Deltas)', 20, 24);

    if (!diffList || diffList.length === 0) {
      ctx.fillStyle = '#10b981';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('✓ No musical differences detected between revisions (100% semantic identity).', 20, 60);
      return;
    }

    const rowH = 26;
    let y = 55;

    diffList.slice(0, 12).forEach((d, i) => {
      let badgeCol = '#38bdf8';
      let badgeText = 'DIFF';
      if (d.action.includes('REMOVED')) {
        badgeCol = '#ef4444';
        badgeText = 'REMOVED';
      } else if (d.action.includes('ADDED')) {
        badgeCol = '#10b981';
        badgeText = 'ADDED';
      } else if (d.action.includes('MODIFIED')) {
        badgeCol = '#f59e0b';
        badgeText = 'MODIFIED';
      }

      // Badge
      ctx.fillStyle = badgeCol + '25';
      ctx.strokeStyle = badgeCol;
      ctx.lineWidth = 1;
      ctx.fillRect(20, y - 14, 75, 18);
      ctx.strokeRect(20, y - 14, 75, 18);

      ctx.fillStyle = badgeCol;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(badgeText, 57, y - 2);

      // Message
      ctx.fillStyle = '#f8fafc';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(d.message, 105, y - 1);

      y += rowH;
    });
  }

  /**
   * 3. CIRCULAR ENGRAVING QUALITY GAUGES
   */
  function drawScoreGauges(canvas, lintResult) {
    if (!canvas || !lintResult) return;
    const { ctx, width, height } = setupCanvas(canvas);

    ctx.fillStyle = '#080c16';
    ctx.fillRect(0, 0, width, height);

    const midY = height / 2 + 10;
    const r = Math.min(width / 6, height / 2 - 25);

    function renderDial(cx, label, val, max, unit, warnThresh = 80, critThresh = 60) {
      const ratio = Math.min(1.0, Math.max(0, val / max));
      const startAngle = Math.PI * 0.8;
      const endAngle = Math.PI * 2.2;
      const sweep = endAngle - startAngle;

      ctx.save();
      // Background track
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, midY, r, startAngle, endAngle);
      ctx.stroke();

      // Colored arc
      let col = '#10b981';
      if (val < critThresh) col = '#ef4444';
      else if (val < warnThresh) col = '#f59e0b';

      ctx.strokeStyle = col;
      ctx.beginPath();
      ctx.arc(cx, midY, r, startAngle, startAngle + sweep * ratio);
      ctx.stroke();

      // Center value
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 1.35rem monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${val}${unit}`, cx, midY - 2);

      // Label below
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(label, cx, midY + r + 18);
      ctx.restore();
    }

    const slotW = width / 4;
    const hScore = lintResult.healthScore || 100;
    const pCount = (lintResult.summary && lintResult.summary.totalProblems) || 0;
    const rhythmScore = Math.max(0, 100 - (lintResult.findings.filter(f => f.ruleId.startsWith('rhythm')).length * 30));
    const syntaxScore = Math.max(0, 100 - (lintResult.findings.filter(f => f.ruleId.startsWith('ties') || f.ruleId.startsWith('slurs')).length * 20));

    // 1. Overall Health
    renderDial(slotW * 0.5, 'Editorial Health Score', hScore, 100, '%', 85, 60);

    // 2. Rhythmic Integrity
    renderDial(slotW * 1.5, 'Rhythmic Integrity', rhythmScore, 100, '%', 85, 70);

    // 3. Notation Syntax
    renderDial(slotW * 2.5, 'Ties & Slurs Syntax', syntaxScore, 100, '%', 85, 70);

    // 4. Measure Quality
    const measureCleanPct = Math.max(0, Math.round((1 - (pCount / Math.max(1, lintResult.summary.totalMeasures))) * 100));
    renderDial(slotW * 3.5, 'Clean Measure Ratio', measureCleanPct, 100, '%', 80, 60);
  }

  return {
    drawMeasureTimeline,
    drawScoreDiff,
    drawScoreGauges
  };
});
