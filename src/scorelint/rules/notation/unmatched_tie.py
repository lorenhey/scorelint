from typing import Dict, Tuple
from scorelint.rules.base import Rule, register_rule
from scorelint.rules.engine import RuleDefinition, Severity, Context
from scorelint.models.events import Note

@register_rule
class UnmatchedTieRule(Rule):
    @classmethod
    def definition(cls) -> RuleDefinition:
        return RuleDefinition(
            id="ties.unmatched",
            category="TIES",
            description="Checks for ties that start but never stop, or stop without starting.",
            rationale="A tie must connect two notes. An unmatched tie is structurally invalid and often the result of copy-paste errors or incomplete deletions.",
            default_severity=Severity.ERROR
        )
        
    def evaluate(self, context: Context) -> None:
        # Key: (part_id, voice_id)
        active_ties: Dict[Tuple[str, int], Note] = {}
        
        for part in context.score.parts:
            for measure in part.measures:
                for voice_id, voice_state in measure.voices.items():
                    key = (part.id, voice_id)
                    
                    for event in voice_state.events:
                        if isinstance(event, Note):
                            if event.tie_stop:
                                if key not in active_ties:
                                    context.report(
                                        rule_id=self.definition().id,
                                        severity=Severity.ERROR,
                                        message=f"Tie stop found without a preceding tie start.",
                                        location=event.location
                                    )
                                else:
                                    del active_ties[key]
                                    
                            if event.tie_start:
                                if key in active_ties:
                                    # Nested tie start? Or previous tie never closed.
                                    prev_note = active_ties[key]
                                    context.report(
                                        rule_id=self.definition().id,
                                        severity=Severity.ERROR,
                                        message=f"Tie started but never closed before next tie start.",
                                        location=prev_note.location
                                    )
                                active_ties[key] = event
                                
        # Check leftovers
        for key, note in active_ties.items():
            context.report(
                rule_id=self.definition().id,
                severity=Severity.ERROR,
                message=f"Tie started but never closed.",
                location=note.location
            )
