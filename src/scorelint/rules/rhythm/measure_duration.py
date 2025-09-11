from scorelint.rules.base import Rule, register_rule
from scorelint.rules.engine import RuleDefinition, Severity, Context
from scorelint.models.timing import Duration

@register_rule
class MeasureDurationRule(Rule):
    @classmethod
    def definition(cls) -> RuleDefinition:
        return RuleDefinition(
            id="rhythm.measure-duration",
            category="RHYTHM",
            description="Checks if the sum of durations in a voice matches the active time signature.",
            rationale="A structurally valid measure must contain exactly the duration declared by its time signature, distributed across each active voice. Discrepancies indicate an incomplete measure, a synchronization error, or a missing pickup marker.",
            default_severity=Severity.ERROR
        )
        
    def evaluate(self, context: Context) -> None:
        for part in context.score.parts:
            active_ts = None
            for measure in part.measures:
                if measure.time_signature:
                    active_ts = measure.time_signature
                    
                if not active_ts:
                    continue # Senza misura or no time signature yet
                    
                if measure.is_pickup or measure.implicit:
                    # Pickups or cadenzas (implicit) are exempt from strict duration checking
                    continue
                    
                expected_duration = active_ts.measure_duration
                
                for voice_id, voice_state in measure.voices.items():
                    # Calculate total duration in this voice
                    # Note: We use precise fractions via the models
                    total_dur = Duration.zero()
                    for event in voice_state.events:
                        total_dur = total_dur + event.duration
                        
                    if total_dur != expected_duration and bool(total_dur):
                        # Empty voices might be ignored depending on editor conventions,
                        # but a partially filled voice is an error.
                        loc = voice_state.events[0].location if voice_state.events else None
                        context.report(
                            rule_id=self.definition().id,
                            severity=Severity.ERROR, # TODO: config override
                            message=f"Voice {voice_id} contains {total_dur} of notated duration in a {active_ts.numerator}/{active_ts.denominator} measure.",
                            location=loc
                        )
