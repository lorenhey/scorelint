from dataclasses import dataclass
from typing import Optional
from scorelint.models.events import Event, Location
from scorelint.models.timing import Duration

@dataclass
class Dynamic(Event):
    value: str # 'p', 'f', 'mf', etc.

@dataclass
class Hairpin(Event):
    type: str # 'crescendo', 'diminuendo', 'stop'

@dataclass
class Tempo(Event):
    bpm: float
    text: Optional[str] = None

@dataclass
class Text(Event):
    content: str
    is_rehearsal: bool = False
    
@dataclass
class Lyric(Event):
    text: str
    syllabic: str # 'single', 'begin', 'middle', 'end'
    number: int = 1
