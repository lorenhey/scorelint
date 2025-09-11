from typing import Dict, Tuple
from scorelint.rules.base import Rule, register_rule
from scorelint.rules.engine import RuleDefinition, Severity, Context
from scorelint.models.events import Note

@register_rule
class UnmatchedTupletRule(Rule):
    @classmethod
    def definition(cls) -> RuleDefinition:
        return RuleDefinition(
            id="tuplets.unmatched",
            category="TUPLETS",
            description="Checks for tuplets that start but never stop, or stop without starting.",
            rationale="Tuplet brackets must have balanced start and stop markers.",
            default_severity=Severity.ERROR
        )
        
    def evaluate(self, context: Context) -> None:
        # Key: (part_id, tuplet_number)
        active_tuplets: Dict[Tuple[str, int], Note] = {}
        
        for part in context.score.parts:
            for measure in part.measures:
                for voice_id, voice_state in measure.voices.items():
                    for event in voice_state.events:
                        if isinstance(event, Note):
                            for tuplet in event.tuplets:
                                key = (part.id, tuplet.number)
                                
                                if tuplet.type == 'stop':
                                    if key not in active_tuplets:
                                        context.report(
                                            rule_id=self.definition().id,
                                            severity=Severity.ERROR,
                                            message=f"Tuplet (number {tuplet.number}) stop found without a preceding start.",
                                            location=event.location
                                        )
                                    else:
                                        del active_tuplets[key]
                                        
                                elif tuplet.type == 'start':
                                    if key in active_tuplets:
                                        prev_note = active_tuplets[key]
                                        context.report(
                                            rule_id=self.definition().id,
                                            severity=Severity.ERROR,
                                            message=f"Tuplet (number {tuplet.number}) started again before previous instance closed.",
                                            location=event.location
                                        )
                                    active_tuplets[key] = event
                                    
        # Check leftovers
        for key, note in active_tuplets.items():
            context.report(
                rule_id=self.definition().id,
                severity=Severity.ERROR,
                message=f"Tuplet (number {key[1]}) started but never closed.",
                location=note.location
            )
