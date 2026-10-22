# ScoreLint v2.0.0

[![Live Demo](https://img.shields.io/badge/GitHub%20Pages-Live%20Score%20Workbench-c084fc?style=for-the-badge&logo=github)](https://lorenhey.github.io/scorelint/)
[![Tests](https://img.shields.io/badge/Tests-Passing%20100%25-brightgreen?style=for-the-badge)](https://github.com/lorenhey/scorelint/actions)
[![Python](https://img.shields.io/badge/Python-3.12%2B-blue?style=for-the-badge&logo=python)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

An interactive, browser-based semantic linter, engraving quality inspector, and exact rational timing workbench for digital music scores (**MusicXML 4.0**).

Access the interactive zero-backend music score workbench directly in your browser:
👉 **[https://lorenhey.github.io/scorelint/](https://lorenhey.github.io/scorelint/)**

---

## 🎼 What is ScoreLint?

`scorelint` finds structural errors, timing discrepancies, and editorial notation defects in digital scores without judging musical aesthetics or rewriting parts:

```bash
scorelint lint symphony.musicxml

error   Part Violin I M42 V2
rhythm.measure-duration
Voice contains 3/4 of notated duration in a 4/4 measure.

warning Part Clarinet I M87 V1
ties.pitch-mismatch
Tie starts on written F#4 and ends on F4.

2 problems
```

---

## 🚀 Key Features in v2.0.0

### 1. Zero-Backend Browser Engraving Workbench
- Runs 100% client-side in semantic HTML5, responsive CSS, KaTeX formulas, and HTML5 Canvas 2D.
- Drag-and-drop MusicXML parser supporting `.musicxml` and `.xml` files with instant rule evaluation.
- Exports comprehensive audit reports and score metadata to JSON.

### 2. Multi-Panel Canvas 2D Visualizers
- **Visual Staves & Measure Timeline**:
  - 5-line staff rendering per part with clef glyphs, barlines, noteheads, and accidentals.
  - Highlights incomplete measures and broken ties with red/amber boundary boxes.
- **Semantic Score Diff Visualizer**:
  - Compares two score revisions musically, ignoring visual layout changes and highlighting added notes (green), removed notes (red), and modified pitches/durations (amber).
- **Publication Engraving Dials**:
  - Circular dials for Editorial Health %, Rhythmic Integrity %, Notation Syntax %, and Clean Measure Ratio.

### 3. In-Browser CLI (`scorelint:~$`)
Embedded terminal shell with command history:
- `help` — List available commands
- `scores` — List benchmark score scenarios
- `load <id>` — Load a score into active linter
- `lint` — Evaluate engraving rules
- `rules` — List supported MusicXML engraving rules
- `diff` — Compare current score against clean reference
- `metrics` — Display measure counts and problem totals
- `export` — Download JSON audit report

---

## 📐 Mathematical & Engraving Foundations

### 1. Exact Fractional Measure Beat Budget
$$\sum_{k=1}^{N} \frac{\text{duration}_k}{4 \cdot \text{divisions}} = \frac{\text{beats}}{\text{beat-type}}$$
Where each voice must account for precisely the declared whole note fraction (e.g. $4/4 = 1$, $3/4 = 3/4$, $6/8 = 3/4$). ScoreLint uses exact rational fractions (`Fraction(n, d)`) to eliminate floating-point drift across long movements.

### 2. Acoustic Pitch Frequency & Equal Temperament
$$f(d) = 440 \times 2^{\frac{d - 69}{12}} \text{ Hz}$$
Where $d$ is the MIDI note number ($C4 = 60$, $A4 = 69$). Enharmonic ties ($F\sharp \leftrightarrow G\flat$) must preserve written pitch identity on tied noteheads.

### 3. Tuplet Rational Time Modification
$$\Delta t_{\text{tuplet}} = \Delta t_{\text{nominal}} \times \left(\frac{\text{normal-notes}}{\text{actual-notes}}\right)$$
A standard triplet modifies duration by $2/3$, requiring exact numerator/denominator conservation to maintain barlines.

---

## 📜 Supported Engraving Rules

- **`rhythm.measure-duration`** (`ERROR`): Validates measure duration budget per voice against active time signature.
- **`ties.pitch-mismatch`** (`WARNING`): Verifies pitch equivalence between tie start note and tie stop note.
- **`ties.unmatched`** (`ERROR`): Flags tie starts without destination or tie stops without origin.
- **`slurs.unmatched`** (`ERROR`): Flags unclosed or missing slur curve anchors.
- **`tuplets.unmatched`** (`ERROR`): Flags unbalanced triplet / tuplet member counts.
- **`structure.empty-measure`** (`WARNING`): Detects ghost measures lacking notes or rests.

---

## 🔬 Benchmark Scenarios Included

1. **`benchmark-beethoven-ode-clean`**: Beethoven Symphony No. 9 "Ode to Joy" excerpt (4/4, clean rhythm and correct slurs/ties, Score 100/100, `CLEAN`).
2. **`pathology-rhythm-incomplete-measure`**: Measure 1 Voice 1 has 3/4 duration in a 4/4 measure (Missing quarter rest, Score 55/100, `ERROR`).
3. **`pathology-tie-pitch-mismatch`**: Tie starts on written F#4 and resolves to F4 (Pitch mismatch, Score 75/100, `WARNING`).
4. **`pathology-unmatched-slur-tuplet`**: Phrasing slur unclosed, tuplet stopped with only 2 members (Score 50/100, `ERROR`).
5. **`pathology-empty-ghost-measure`**: Measure declared with zero musical events, notes, or rests (Score 85/100, `WARNING`).
6. **`pathology-multi-voice-collision`**: Polyphonic timeline desynchronization with Voice 2 overflowing to 5/4 (Score 45/100, `CRITICAL`).

---

## 🛠️ Local Python Development & CLI

Install via [uv](https://github.com/astral-sh/uv):

```bash
git clone https://github.com/lorenhey/scorelint.git
cd scorelint
uv venv
uv pip install -e .
```

Run test suite:
```bash
python -m unittest discover tests -v
```

CLI commands:
```bash
# Lint a score
scorelint lint demo.musicxml

# List supported rules
scorelint rules

# Semantic diff between two scores
scorelint diff demo.musicxml demo2.musicxml
```

---

## 📄 License

MIT License &bull; Copyright &copy; 2026 Loren (`lorenhey`).
