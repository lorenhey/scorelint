# scorelint

`scorelint` encuentra errores estructurales, inconsistencias y problemas editoriales sospechosos en partituras digitales sin intentar juzgar ni reescribir la música.

```bash
uv run scorelint symphony.musicxml
```

## Ejemplo de uso

```bash
scorelint violin-1.musicxml

error  Part Violin I M42 V2
rhythm.measure-duration
Voice contains 3½ beats in a 4/4 measure.

warning Part Clarinet I M87 V1
ties.pitch-mismatch
Tie starts on written F#4 and ends on F4.

2 problems
```

## Funcionalidades principales

- **MusicXML 4.0 Support**: Analiza partituras desde su fuente XML.
- **Semantic Diff**: Compara dos archivos y te dice qué notas o duraciones cambiaron musicalmente, ignorando el layout de exportación (`scorelint diff before.musicxml after.musicxml`).
- **Aritmética Fraccional Exacta**: Calcula duraciones usando `fractions` nativas para evitar rhythmic drifts comunes en editores visuales.
- **Music-aware False-Positive Discipline**: No castiga el "voice crossing", asimetrías rítmicas legítimas o decisiones contemporáneas como errores.
- **Reporting y CI**: Reportes en JSON, HTML y salida clara para consola.

## Instalación

```bash
uv sync
uv run scorelint
```

## Reglas Incluidas

- `rhythm.measure-duration`: Valida métrica por cada timeline de voz.
- `ties.pitch-mismatch`: Ligaduras con notas no compatibles.
- `ties.unmatched`: Ligadura abierta sin destino o destino sin origen.
- `slurs.unmatched`: Slur roto estructuralmente.
- `tuplets.unmatched`: Tuplet no balanceado.

Y más próximamente (Structure, Pitch, Text, Repeats).

## Filosofía

La ausencia de error no significa que la música sea "buena". Pero un MusicXML válido tampoco significa que la partitura tenga sentido rítmico. `scorelint` no es un profesor de armonía, es tu asistente analítico de notación.
