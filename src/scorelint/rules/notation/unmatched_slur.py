from typing import Dict, Tuple
from scorelint.rules.base import Rule, register_rule
from scorelint.rules.engine import RuleDefinition, Severity, Context
from scorelint.models.events import Note

@register_rule
class UnmatchedSlurRule(Rule):
    @classmethod
    def definition(cls) -> RuleDefinition:
        return RuleDefinition(
            id="slurs.unmatched",
            category="SLURS",
            description="Checks for slurs that start but never stop, or stop without starting.",
            rationale="A slur must have a defined start and stop. Unmatched slurs can cause rendering errors and musical ambiguity.",
            default_severity=Severity.ERROR
        )
        
    def evaluate(self, context: Context) -> None:
        # Key: (part_id, slur_number)
        active_slurs: Dict[Tuple[str, int], Note] = {}
        
        for part in context.score.parts:
            for measure in part.measures:
                for voice_id, voice_state in measure.voices.items():
                    for event in voice_state.events:
                        if isinstance(event, Note):
                            for slur in event.slurs:
                                key = (part.id, slur.number)
                                
                                if slur.type == 'stop':
                                    if key not in active_slurs:
                                        context.report(
                                            rule_id=self.definition().id,
                                            severity=Severity.ERROR,
                                            message=f"Slur (number {slur.number}) stop found without a preceding start.",
                                            location=event.location
                                        )
                                    else:
                                        del active_slurs[key]
                                        
                                elif slur.type == 'start':
                                    if key in active_slurs:
                                        # Overlapping slur with same number
                                        prev_note = active_slurs[key]
                                        context.report(
                                            rule_id=self.definition().id,
                                            severity=Severity.ERROR,
                                            message=f"Slur (number {slur.number}) started again before previous instance closed.",
                                            location=event.location
                                        )
                                    active_slurs[key] = event
                                    
        # Check leftovers
        for key, note in active_slurs.items():
            context.report(
                rule_id=self.definition().id,
                severity=Severity.ERROR,
                message=f"Slur (number {key[1]}) started but never closed.",
                location=note.location
            )
