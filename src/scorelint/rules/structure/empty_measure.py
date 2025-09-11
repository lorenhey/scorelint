from scorelint.rules.base import Rule, register_rule
from scorelint.rules.engine import RuleDefinition, Severity, Context

@register_rule
class EmptyMeasureRule(Rule):
    @classmethod
    def definition(cls) -> RuleDefinition:
        return RuleDefinition(
            id="structure.empty-measure",
            category="STRUCTURE",
            description="Checks if a measure is completely empty (no voices, no rests, no notes).",
            rationale="An empty measure is often an encoding error where rest elements were omitted instead of explicit measure rests.",
            default_severity=Severity.WARNING
        )
        
    def evaluate(self, context: Context) -> None:
        for part in context.score.parts:
            for measure in part.measures:
                if not measure.voices:
                    context.report(
                        rule_id=self.definition().id,
                        severity=Severity.WARNING,
                        message="Measure contains no voices and no events.",
                        location=f"Part {part.id} M{measure.number}"
                    )
                else:
                    is_empty = True
                    for voice_id, voice_state in measure.voices.items():
                        if voice_state.events:
                            is_empty = False
                            break
                    if is_empty:
                        context.report(
                            rule_id=self.definition().id,
                            severity=Severity.WARNING,
                            message="Measure contains voices but no events.",
                            location=f"Part {part.id} M{measure.number}"
                        )
