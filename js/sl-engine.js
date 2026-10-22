/**
 * ScoreLint Semantic Linter Engine v2.0.0
 * MusicXML Semantic Model, Exact Rational Timing & Engraving Rules Engine
 * (c) 2026 Loren - MIT License
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SLEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Exact Rational Fraction for Musical Timing (eliminates float drift)
   */
  class Fraction {
    constructor(num, den = 1) {
      if (den === 0) throw new Error('Division by zero');
      if (den < 0) {
        num = -num;
        den = -den;
      }
      const g = Fraction.gcd(Math.abs(num), Math.abs(den));
      this.n = Math.round(num / g);
      this.d = Math.round(den / g);
    }

    static gcd(a, b) {
      return b === 0 ? a : Fraction.gcd(b, a % b);
    }

    add(other) {
      const o = typeof other === 'number' ? new Fraction(other, 1) : other;
      return new Fraction(this.n * o.d + o.n * this.d, this.d * o.d);
    }

    sub(other) {
      const o = typeof other === 'number' ? new Fraction(other, 1) : other;
      return new Fraction(this.n * o.d - o.n * this.d, this.d * o.d);
    }

    equals(other) {
      const o = typeof other === 'number' ? new Fraction(other, 1) : other;
      return this.n === o.n && this.d === o.d;
    }

    toFloat() {
      return this.n / this.d;
    }

    toString() {
      return this.d === 1 ? `${this.n}` : `${this.n}/${this.d}`;
    }
  }

  /**
   * Rule Definitions
   */
  const RULES = [
    {
      id: 'rhythm.measure-duration',
      category: 'RHYTHM',
      defaultSeverity: 'ERROR',
      description: 'Checks if the sum of durations in a voice matches the active time signature.',
      rationale: 'A structurally valid measure must contain exactly the duration declared by its time signature. Discrepancies indicate an incomplete measure, synchronization error, or missing rest.'
    },
    {
      id: 'ties.pitch-mismatch',
      category: 'TIES',
      defaultSeverity: 'WARNING',
      description: 'Checks if tied notes have matching written pitches.',
      rationale: 'A tie connects two notes of the same pitch to create a single longer note. If a tie connects different pitches, it is likely intended as a slur, or one note was accidentally altered.'
    },
    {
      id: 'ties.unmatched',
      category: 'TIES',
      defaultSeverity: 'ERROR',
      description: 'Checks for ties that start but never stop, or stop without starting.',
      rationale: 'Unterminated ties leave musical duration undefined across bar boundaries.'
    },
    {
      id: 'slurs.unmatched',
      category: 'SLURS',
      defaultSeverity: 'ERROR',
      description: 'Checks for slurs that start but never stop, or stop without starting.',
      rationale: 'Broken slur curves produce engraving glitches in modern notation renderers.'
    },
    {
      id: 'tuplets.unmatched',
      category: 'TUPLETS',
      defaultSeverity: 'ERROR',
      description: 'Checks for tuplets that start but never stop, or have missing note members.',
      rationale: 'Unbalanced tuplets cause severe rhythmic drift and measure overflow.'
    },
    {
      id: 'structure.empty-measure',
      category: 'STRUCTURE',
      defaultSeverity: 'WARNING',
      description: 'Checks if a measure is completely empty (no voices, rests, or notes).',
      rationale: 'Empty ghost measures are often leftover artifacts from deletion in notation editors.'
    }
  ];

  /**
   * Core Linter Rule Evaluator
   */
  function lintScore(score) {
    const findings = [];
    if (!score || !score.parts) return { score, findings, healthScore: 100, summary: {} };

    // 1. RHYTHM RULE: measure-duration
    score.parts.forEach(part => {
      let activeTs = { beats: 4, beatType: 4 };

      part.measures.forEach(measure => {
        if (measure.timeSignature) {
          activeTs = measure.timeSignature;
        }

        const expectedDuration = new Fraction(activeTs.beats, activeTs.beatType);

        if (measure.isPickup || measure.implicit) {
          return; // Pickups are exempt
        }

        // Check if measure is completely empty
        const totalEventsInMeasure = Object.values(measure.voices).reduce((acc, v) => acc + (v.events ? v.events.length : 0), 0);
        if (totalEventsInMeasure === 0) {
          findings.push({
            ruleId: 'structure.empty-measure',
            severity: 'WARNING',
            partId: part.id,
            measureNum: measure.number,
            voiceId: null,
            message: `Measure ${measure.number} is completely empty (contains 0 notes or rests).`,
            location: `Part ${part.name || part.id} M${measure.number}`
          });
          return;
        }

        // Check durations in each voice
        Object.entries(measure.voices).forEach(([voiceId, voice]) => {
          let voiceDur = new Fraction(0, 1);
          const divisions = measure.divisions || 1;

          voice.events.forEach(ev => {
            // Note/Rest duration in quarter notes = dur / divisions
            // Fraction in whole notes = dur / (divisions * 4)
            const durWhole = new Fraction(ev.duration, divisions * 4);
            voiceDur = voiceDur.add(durWhole);
          });

          if (!voiceDur.equals(expectedDuration) && voiceDur.toFloat() > 0) {
            findings.push({
              ruleId: 'rhythm.measure-duration',
              severity: 'ERROR',
              partId: part.id,
              measureNum: measure.number,
              voiceId: parseInt(voiceId, 10),
              message: `Voice ${voiceId} contains ${voiceDur.toString()} of notated duration in a ${activeTs.beats}/${activeTs.beatType} measure (expected ${expectedDuration.toString()}).`,
              location: `Part ${part.name || part.id} M${measure.number} V${voiceId}`
            });
          }
        });
      });
    });

    // 2. NOTATION RULE: ties.pitch-mismatch & ties.unmatched
    score.parts.forEach(part => {
      const activeTies = {}; // key: voiceId -> note

      part.measures.forEach(measure => {
        Object.entries(measure.voices).forEach(([voiceId, voice]) => {
          voice.events.forEach(ev => {
            if (ev.type === 'note') {
              if (ev.tieStop) {
                if (activeTies[voiceId]) {
                  const startNote = activeTies[voiceId];
                  delete activeTies[voiceId];

                  if (startNote.pitch !== ev.pitch) {
                    findings.push({
                      ruleId: 'ties.pitch-mismatch',
                      severity: 'WARNING',
                      partId: part.id,
                      measureNum: measure.number,
                      voiceId: parseInt(voiceId, 10),
                      message: `Tie starts on written ${startNote.pitch} and ends on ${ev.pitch}.`,
                      location: `Part ${part.name || part.id} M${measure.number} V${voiceId}`
                    });
                  }
                } else {
                  findings.push({
                    ruleId: 'ties.unmatched',
                    severity: 'ERROR',
                    partId: part.id,
                    measureNum: measure.number,
                    voiceId: parseInt(voiceId, 10),
                    message: `Tie stop on ${ev.pitch} without corresponding start note.`,
                    location: `Part ${part.name || part.id} M${measure.number} V${voiceId}`
                  });
                }
              }

              if (ev.tieStart) {
                activeTies[voiceId] = ev;
              }
            }
          });
        });
      });

      // Leftover open ties
      Object.entries(activeTies).forEach(([voiceId, startNote]) => {
        findings.push({
          ruleId: 'ties.unmatched',
          severity: 'ERROR',
          partId: part.id,
          measureNum: startNote.measureNum,
          voiceId: parseInt(voiceId, 10),
          message: `Tie starts on written ${startNote.pitch} but is never closed before end of score.`,
          location: `Part ${part.name || part.id} M${startNote.measureNum} V${voiceId}`
        });
      });
    });

    // 3. NOTATION RULE: slurs.unmatched
    score.parts.forEach(part => {
      let openSlur = null;

      part.measures.forEach(measure => {
        Object.entries(measure.voices).forEach(([voiceId, voice]) => {
          voice.events.forEach(ev => {
            if (ev.type === 'note') {
              if (ev.slurStart) {
                openSlur = { measureNum: measure.number, voiceId, pitch: ev.pitch, number: ev.slurNumber || 1 };
              }
              if (ev.slurStop) {
                if (!openSlur) {
                  findings.push({
                    ruleId: 'slurs.unmatched',
                    severity: 'ERROR',
                    partId: part.id,
                    measureNum: measure.number,
                    voiceId: parseInt(voiceId, 10),
                    message: `Slur stop without matching start.`,
                    location: `Part ${part.name || part.id} M${measure.number} V${voiceId}`
                  });
                } else {
                  openSlur = null;
                }
              }
            }
          });
        });
      });

      if (openSlur) {
        findings.push({
          ruleId: 'slurs.unmatched',
          severity: 'ERROR',
          partId: part.id,
          measureNum: openSlur.measureNum,
          voiceId: parseInt(openSlur.voiceId, 10),
          message: `Slur (number ${openSlur.number}) started on ${openSlur.pitch} but never closed.`,
          location: `Part ${part.name || part.id} M${openSlur.measureNum} V${openSlur.voiceId}`
        });
      }
    });

    // 4. NOTATION RULE: tuplets.unmatched
    score.parts.forEach(part => {
      let activeTuplet = null;

      part.measures.forEach(measure => {
        Object.entries(measure.voices).forEach(([voiceId, voice]) => {
          voice.events.forEach(ev => {
            if (ev.type === 'note') {
              if (ev.tupletStart) {
                activeTuplet = { measureNum: measure.number, voiceId, count: 1 };
              } else if (activeTuplet) {
                activeTuplet.count++;
              }
              if (ev.tupletStop) {
                if (activeTuplet && activeTuplet.count < 3) {
                  findings.push({
                    ruleId: 'tuplets.unmatched',
                    severity: 'ERROR',
                    partId: part.id,
                    measureNum: measure.number,
                    voiceId: parseInt(voiceId, 10),
                    message: `Tuplet closed with incomplete member count (${activeTuplet.count} notes).`,
                    location: `Part ${part.name || part.id} M${measure.number} V${voiceId}`
                  });
                }
                activeTuplet = null;
              }
            }
          });
        });
      });

      if (activeTuplet) {
        findings.push({
          ruleId: 'tuplets.unmatched',
          severity: 'ERROR',
          partId: part.id,
          measureNum: activeTuplet.measureNum,
          voiceId: parseInt(activeTuplet.voiceId, 10),
          message: `Tuplet started in M${activeTuplet.measureNum} but was never terminated.`,
          location: `Part ${part.name || part.id} M${activeTuplet.measureNum} V${activeTuplet.voiceId}`
        });
      }
    });

    // Compute Health Score
    let healthScore = 100;
    findings.forEach(f => {
      if (f.severity === 'ERROR') healthScore -= 20;
      else if (f.severity === 'WARNING') healthScore -= 10;
      else if (f.severity === 'STYLE') healthScore -= 5;
    });
    healthScore = Math.max(0, Math.min(100, healthScore));

    const errorsCount = findings.filter(f => f.severity === 'ERROR').length;
    const warningsCount = findings.filter(f => f.severity === 'WARNING').length;

    let verdict = 'CLEAN';
    if (errorsCount > 0) verdict = 'ERRORS DETECTED';
    else if (warningsCount > 0) verdict = 'WARNINGS FOUND';

    return {
      score,
      findings,
      healthScore,
      verdict,
      summary: {
        totalMeasures: score.parts.reduce((acc, p) => acc + p.measures.length, 0),
        totalParts: score.parts.length,
        errorsCount,
        warningsCount,
        totalProblems: findings.length
      }
    };
  }

  /**
   * Semantic Score Diff Tool (Compares two scores and identifies musical modifications)
   */
  function diffScores(beforeScore, afterScore) {
    const diffs = [];
    if (!beforeScore || !afterScore) return diffs;

    const parts1 = beforeScore.parts || [];
    const parts2 = afterScore.parts || [];

    // Compare common parts
    parts1.forEach((p1, pIdx) => {
      const p2 = parts2[pIdx] || parts2.find(p => p.id === p1.id);
      if (!p2) {
        diffs.push({ action: 'REMOVED_PART', message: `Removed Part ${p1.name || p1.id}` });
        return;
      }

      p1.measures.forEach((m1, mIdx) => {
        const m2 = p2.measures[mIdx];
        if (!m2) {
          diffs.push({ action: 'REMOVED_MEASURE', message: `Removed Measure ${m1.number} in ${p1.name}` });
          return;
        }

        // Compare notes in Voice 1
        const ev1 = (m1.voices[1] && m1.voices[1].events) || [];
        const ev2 = (m2.voices[1] && m2.voices[1].events) || [];

        if (ev1.length !== ev2.length) {
          diffs.push({
            action: 'EVENT_COUNT_CHANGED',
            message: `Part ${p1.name} M${m1.number}: Event count changed from ${ev1.length} to ${ev2.length}`
          });
        }

        for (let i = 0; i < Math.min(ev1.length, ev2.length); i++) {
          const n1 = ev1[i];
          const n2 = ev2[i];
          if (n1.pitch !== n2.pitch || n1.duration !== n2.duration) {
            diffs.push({
              action: 'MODIFIED_NOTE',
              message: `Part ${p1.name} M${m1.number} Event #${i + 1}: ${n1.pitch || 'Rest'} (${n1.duration}div) ➔ ${n2.pitch || 'Rest'} (${n2.duration}div)`
            });
          }
        }
      });
    });

    return diffs;
  }

  /**
   * Client-Side MusicXML DOM Parser
   */
  function parseMusicXml(xmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');

    const scoreTitle = doc.querySelector('work-title')?.textContent || doc.querySelector('movement-title')?.textContent || 'Untitled Score';
    const composer = doc.querySelector('creator[type="composer"]')?.textContent || 'Unknown Composer';

    const parts = [];
    const partElements = doc.querySelectorAll('part');

    partElements.forEach(pEl => {
      const pId = pEl.getAttribute('id') || 'P1';
      const pName = doc.querySelector(`score-part[id="${pId}"] part-name`)?.textContent || pId;

      const measures = [];
      const mElements = pEl.querySelectorAll('measure');

      let currentDivisions = 1;
      let currentTimeSig = { beats: 4, beatType: 4 };

      mElements.forEach(mEl => {
        const mNum = parseInt(mEl.getAttribute('number') || '1', 10);
        const divEl = mEl.querySelector('attributes > divisions');
        if (divEl) currentDivisions = parseInt(divEl.textContent, 10);

        const timeEl = mEl.querySelector('attributes > time');
        if (timeEl) {
          currentTimeSig = {
            beats: parseInt(timeEl.querySelector('beats')?.textContent || '4', 10),
            beatType: parseInt(timeEl.querySelector('beat-type')?.textContent || '4', 10)
          };
        }

        const isPickup = mEl.getAttribute('implicit') === 'yes' || mNum === 0;

        const voices = {};
        const noteEls = mEl.querySelectorAll('note');

        noteEls.forEach(nEl => {
          const isRest = nEl.querySelector('rest') !== null;
          const voiceId = nEl.querySelector('voice')?.textContent || '1';
          const dur = parseInt(nEl.querySelector('duration')?.textContent || '1', 10);

          let pitch = null;
          if (!isRest) {
            const step = nEl.querySelector('pitch > step')?.textContent || 'C';
            const alter = parseInt(nEl.querySelector('pitch > alter')?.textContent || '0', 10);
            const oct = nEl.querySelector('pitch > octave')?.textContent || '4';
            const acc = alter === 1 ? '#' : (alter === -1 ? 'b' : '');
            pitch = `${step}${acc}${oct}`;
          }

          const tieStart = nEl.querySelector('tie[type="start"], tied[type="start"]') !== null;
          const tieStop = nEl.querySelector('tie[type="stop"], tied[type="stop"]') !== null;
          const slurStart = nEl.querySelector('slur[type="start"]') !== null;
          const slurStop = nEl.querySelector('slur[type="stop"]') !== null;
          const tupletStart = nEl.querySelector('time-modification') !== null && nEl.querySelector('notations tuplet[type="start"]') !== null;
          const tupletStop = nEl.querySelector('notations tuplet[type="stop"]') !== null;

          if (!voices[voiceId]) voices[voiceId] = { events: [] };

          voices[voiceId].events.push({
            type: isRest ? 'rest' : 'note',
            pitch,
            duration: dur,
            tieStart,
            tieStop,
            slurStart,
            slurStop,
            tupletStart,
            tupletStop,
            measureNum: mNum
          });
        });

        measures.push({
          number: mNum,
          divisions: currentDivisions,
          timeSignature: currentTimeSig,
          isPickup,
          voices
        });
      });

      parts.push({
        id: pId,
        name: pName,
        measures
      });
    });

    return {
      title: scoreTitle,
      composer,
      parts
    };
  }

  return {
    Fraction,
    RULES,
    lintScore,
    diffScores,
    parseMusicXml
  };
});
