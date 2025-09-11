from typing import Dict, Tuple
from scorelint.rules.base import Rule, register_rule
from scorelint.rules.engine import RuleDefinition, Severity, Context
from scorelint.models.events import Note
from scorelint.models.pitch import Pitch

@register_rule
class TiePitchMismatchRule(Rule):
    @classmethod
    def definition(cls) -> RuleDefinition:
        return RuleDefinition(
            id="ties.pitch-mismatch",
            category="TIES",
            description="Checks if tied notes have matching written pitches.",
            rationale="A tie connects two notes of the same pitch to create a single longer note. If a tie connects different pitches, it is likely intended to be a slur, or one of the notes was altered without updating the other.",
            default_severity=Severity.WARNING
        )
        
    def evaluate(self, context: Context) -> None:
        # Track active ties per part and voice.
        # Key: (part_id, voice_id). Value: The note that started the tie.
        active_ties: Dict[Tuple[str, int], Note] = {}
        
        for part in context.score.parts:
            for measure in part.measures:
                for voice_id, voice_state in measure.voices.items():
                    key = (part.id, voice_id)
                    
                    for event in voice_state.events:
                        if isinstance(event, Note):
                            if key in active_ties and event.tie_stop:
                                start_note = active_ties.pop(key)
                                if start_note.pitch != event.pitch:
                                    context.report(
                                        rule_id=self.definition().id,
                                        severity=Severity.WARNING,
                                        message=f"Tie starts on written {start_note.pitch} and ends on {event.pitch}.",
                                        location=event.location
                                    )
                                    
                            if event.tie_start:
                                active_ties[key] = event
                                
        # Leftover ties are unmatched (start without stop), but we can report that in a different rule.
