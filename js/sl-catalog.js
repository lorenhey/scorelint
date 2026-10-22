/**
 * ScoreLint Benchmark Scores Catalog v2.0.0
 * Curated Musical Scores & Notation Pathologies
 * (c) 2026 Loren - MIT License
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SLCatalog = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 1. BENCHMARK: BEETHOVEN ODE TO JOY (CLEAN)
  function createOdeToJoyClean() {
    return {
      id: 'benchmark-beethoven-ode-clean',
      name: 'Beethoven: Ode to Joy (Clean 4/4 Reference)',
      category: 'BENCHMARK',
      composer: 'Ludwig van Beethoven',
      workTitle: 'Symphony No. 9 in D minor, Op. 125',
      description: 'Textbook choral theme in 4/4. Perfect voice alignment, correct measure budgets (4 quarters per measure), clean ties and phrasing slurs.',
      parts: [
        {
          id: 'P1',
          name: 'Violin I',
          measures: [
            {
              number: 1,
              divisions: 2,
              timeSignature: { beats: 4, beatType: 4 },
              voices: {
                1: {
                  events: [
                    { type: 'note', pitch: 'E4', duration: 2, measureNum: 1 },
                    { type: 'note', pitch: 'E4', duration: 2, measureNum: 1 },
                    { type: 'note', pitch: 'F4', duration: 2, measureNum: 1 },
                    { type: 'note', pitch: 'G4', duration: 2, measureNum: 1 }
                  ]
                }
              }
            },
            {
              number: 2,
              divisions: 2,
              timeSignature: { beats: 4, beatType: 4 },
              voices: {
                1: {
                  events: [
                    { type: 'note', pitch: 'G4', duration: 2, measureNum: 2 },
                    { type: 'note', pitch: 'F4', duration: 2, measureNum: 2 },
                    { type: 'note', pitch: 'E4', duration: 2, measureNum: 2 },
                    { type: 'note', pitch: 'D4', duration: 2, measureNum: 2 }
                  ]
                }
              }
            },
            {
              number: 3,
              divisions: 2,
              timeSignature: { beats: 4, beatType: 4 },
              voices: {
                1: {
                  events: [
                    { type: 'note', pitch: 'C4', duration: 2, measureNum: 3 },
                    { type: 'note', pitch: 'C4', duration: 2, measureNum: 3 },
                    { type: 'note', pitch: 'D4', duration: 2, measureNum: 3 },
                    { type: 'note', pitch: 'E4', duration: 2, measureNum: 3, tieStart: true }
                  ]
                }
              }
            },
            {
              number: 4,
              divisions: 2,
              timeSignature: { beats: 4, beatType: 4 },
              voices: {
                1: {
                  events: [
                    { type: 'note', pitch: 'E4', duration: 3, measureNum: 4, tieStop: true },
                    { type: 'note', pitch: 'D4', duration: 1, measureNum: 4 },
                    { type: 'note', pitch: 'D4', duration: 4, measureNum: 4 }
                  ]
                }
              }
            }
          ]
        }
      ]
    };
  }

  // 2. PATHOLOGY: RHYTHM INCOMPLETE MEASURE
  function createRhythmIncomplete() {
    return {
      id: 'pathology-rhythm-incomplete-measure',
      name: 'Pathology: Incomplete Measure Duration Deficit',
      category: 'PATHOLOGY',
      composer: 'Score Editor Artifact',
      workTitle: 'String Quartet in G Major (Draft)',
      description: 'Measure 1 in Voice 1 only contains 3 quarter notes in a 4/4 measure (missing quarter rest). Triggers rhythm.measure-duration error.',
      parts: [
        {
          id: 'P1',
          name: 'Violin I',
          measures: [
            {
              number: 1,
              divisions: 2,
              timeSignature: { beats: 4, beatType: 4 },
              voices: {
                1: {
                  events: [
                    { type: 'note', pitch: 'C4', duration: 2, measureNum: 1 },
                    { type: 'note', pitch: 'D4', duration: 2, measureNum: 1 },
                    { type: 'note', pitch: 'E4', duration: 2, measureNum: 1 } // Only 6 divisions = 3/4 total! Missing 2 divisions
                  ]
                }
              }
            },
            {
              number: 2,
              divisions: 2,
              timeSignature: { beats: 4, beatType: 4 },
              voices: {
                1: {
                  events: [
                    { type: 'note', pitch: 'G4', duration: 8, measureNum: 2 }
                  ]
                }
              }
            }
          ]
        }
      ]
    };
  }

  // 3. PATHOLOGY: TIE PITCH MISMATCH
  function createTiePitchMismatch() {
    return {
      id: 'pathology-tie-pitch-mismatch',
      name: 'Pathology: Tie Pitch Mismatch (Written F#4 to F4)',
      category: 'PATHOLOGY',
      composer: 'Transcription Glitch',
      workTitle: 'Clarinet Solo in A',
      description: 'A tie starts on written F#4 at the end of Measure 2 and resolves to F4 in Measure 3. Ties must connect identical written pitches.',
      parts: [
        {
          id: 'P1',
          name: 'Clarinet in Bb',
          measures: [
            {
              number: 1,
              divisions: 2,
              timeSignature: { beats: 4, beatType: 4 },
              voices: {
                1: {
                  events: [
                    { type: 'note', pitch: 'D4', duration: 4, measureNum: 1 },
                    { type: 'note', pitch: 'E4', duration: 4, measureNum: 1 }
                  ]
                }
              }
            },
            {
              number: 2,
              divisions: 2,
              timeSignature: { beats: 4, beatType: 4 },
              voices: {
                1: {
                  events: [
                    { type: 'note', pitch: 'E4', duration: 4, measureNum: 2 },
                    { type: 'note', pitch: 'F#4', duration: 4, measureNum: 2, tieStart: true }
                  ]
                }
              }
            },
            {
              number: 3,
              divisions: 2,
              timeSignature: { beats: 4, beatType: 4 },
              voices: {
                1: {
                  events: [
                    { type: 'note', pitch: 'F4', duration: 4, measureNum: 3, tieStop: true },
                    { type: 'note', pitch: 'G4', duration: 4, measureNum: 3 }
                  ]
                }
              }
            }
          ]
        }
      ]
    };
  }

  // 4. PATHOLOGY: UNMATCHED SLUR AND TUPLET
  function createUnmatchedSlurTuplet() {
    return {
      id: 'pathology-unmatched-slur-tuplet',
      name: 'Pathology: Unmatched Slur & Incomplete Tuplet',
      category: 'PATHOLOGY',
      composer: 'Contemporary Etude',
      workTitle: 'Flute Capriccio No. 3',
      description: 'Phrasing slur starts in Measure 1 but never terminates before score end. Tuplet starts in Measure 2 but closes after only 2 notes instead of 3.',
      parts: [
        {
          id: 'P1',
          name: 'Flute',
          measures: [
            {
              number: 1,
              divisions: 2,
              timeSignature: { beats: 4, beatType: 4 },
              voices: {
                1: {
                  events: [
                    { type: 'note', pitch: 'A4', duration: 4, measureNum: 1, slurStart: true, slurNumber: 1 },
                    { type: 'note', pitch: 'B4', duration: 4, measureNum: 1 }
                  ]
                }
              }
            },
            {
              number: 2,
              divisions: 2,
              timeSignature: { beats: 4, beatType: 4 },
              voices: {
                1: {
                  events: [
                    { type: 'note', pitch: 'C5', duration: 2, measureNum: 2, tupletStart: true },
                    { type: 'note', pitch: 'D5', duration: 2, measureNum: 2, tupletStop: true },
                    { type: 'note', pitch: 'E5', duration: 4, measureNum: 2 }
                  ]
                }
              }
            }
          ]
        }
      ]
    };
  }

  // 5. PATHOLOGY: EMPTY GHOST MEASURE
  function createEmptyGhostMeasure() {
    return {
      id: 'pathology-empty-ghost-measure',
      name: 'Pathology: Completely Empty Ghost Measure',
      category: 'PATHOLOGY',
      composer: 'Engraving Workflow Error',
      workTitle: 'Cello Suite Pre-Print',
      description: 'Measure 2 is declared with time signature and measure barlines but contains zero musical events, notes, or rests. Triggers structure.empty-measure.',
      parts: [
        {
          id: 'P1',
          name: 'Violoncello',
          measures: [
            {
              number: 1,
              divisions: 2,
              timeSignature: { beats: 3, beatType: 4 },
              voices: {
                1: {
                  events: [
                    { type: 'note', pitch: 'G2', duration: 6, measureNum: 1 }
                  ]
                }
              }
            },
            {
              number: 2,
              divisions: 2,
              timeSignature: { beats: 3, beatType: 4 },
              voices: {} // Zero events!
            },
            {
              number: 3,
              divisions: 2,
              timeSignature: { beats: 3, beatType: 4 },
              voices: {
                1: {
                  events: [
                    { type: 'note', pitch: 'D3', duration: 6, measureNum: 3 }
                  ]
                }
              }
            }
          ]
        }
      ]
    };
  }

  // 6. PATHOLOGY: MULTI-VOICE RHYTHMIC COLLISION
  function createMultiVoiceCollision() {
    return {
      id: 'pathology-multi-voice-collision',
      name: 'Pathology: Polyphonic Multi-Voice Rhythmic Overflow',
      category: 'PATHOLOGY',
      composer: 'Fugue Prototype',
      workTitle: 'Keyboard Ricercar in C minor',
      description: 'Polyphonic piano score where Voice 1 contains 4/4 (8 divisions) while Voice 2 accidentally overflows to 5/4 (10 divisions), creating polyphonic timeline desynchronization.',
      parts: [
        {
          id: 'P1',
          name: 'Keyboard Right Hand',
          measures: [
            {
              number: 1,
              divisions: 2,
              timeSignature: { beats: 4, beatType: 4 },
              voices: {
                1: {
                  events: [
                    { type: 'note', pitch: 'C5', duration: 4, measureNum: 1 },
                    { type: 'note', pitch: 'D5', duration: 4, measureNum: 1 }
                  ]
                },
                2: {
                  events: [
                    { type: 'note', pitch: 'E4', duration: 2, measureNum: 1 },
                    { type: 'note', pitch: 'F4', duration: 2, measureNum: 1 },
                    { type: 'note', pitch: 'G4', duration: 2, measureNum: 1 },
                    { type: 'note', pitch: 'A4', duration: 2, measureNum: 1 },
                    { type: 'note', pitch: 'B4', duration: 2, measureNum: 1 } // Extra beat = 10 divisions!
                  ]
                }
              }
            }
          ]
        }
      ]
    };
  }

  const catalog = [
    createOdeToJoyClean(),
    createRhythmIncomplete(),
    createTiePitchMismatch(),
    createUnmatchedSlurTuplet(),
    createEmptyGhostMeasure(),
    createMultiVoiceCollision()
  ];

  function getAllScores() {
    return catalog;
  }

  function getScoreById(id) {
    return catalog.find(s => s.id === id) || catalog[0];
  }

  return {
    getAllScores,
    getScoreById
  };
});
