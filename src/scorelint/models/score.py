from dataclasses import dataclass, field
from typing import List, Dict, Optional
from scorelint.models.timing import TimeSignature, Duration
from scorelint.models.events import Event

@dataclass
class VoiceState:
    id: int
    events: List[Event] = field(default_factory=list)
    duration_sum: Duration = field(default_factory=lambda: Duration.zero())

@dataclass
class Measure:
    number: str
    time_signature: Optional[TimeSignature] = None
    voices: Dict[int, VoiceState] = field(default_factory=dict)
    is_pickup: bool = False
    implicit: bool = False
    
    def get_or_create_voice(self, voice_id: int) -> VoiceState:
        if voice_id not in self.voices:
            self.voices[voice_id] = VoiceState(id=voice_id)
        return self.voices[voice_id]

@dataclass
class Part:
    id: str
    name: str
    measures: List[Measure] = field(default_factory=list)

@dataclass
class Metadata:
    title: Optional[str] = None
    composer: Optional[str] = None

@dataclass
class Score:
    metadata: Metadata = field(default_factory=Metadata)
    parts: List[Part] = field(default_factory=list)
