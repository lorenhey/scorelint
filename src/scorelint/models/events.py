from dataclasses import dataclass, field
from typing import List, Optional
from scorelint.models.timing import Duration, Position
from scorelint.models.pitch import Pitch
from scorelint.models.notation import Tuplet, TimeModification, Slur, Beam

@dataclass
class SourceMap:
    file: str
    xml_id: Optional[str] = None
    xml_path: Optional[str] = None

@dataclass
class Location:
    part_id: str
    staff: int
    measure: str # might be alphanumeric
    voice: int
    beat: Duration
    source: SourceMap
    
    def __str__(self):
        return f"Part {self.part_id} M{self.measure} V{self.voice}"

@dataclass
class Event:
    location: Location
    duration: Duration # metric duration

@dataclass
class Note(Event):
    pitch: Pitch
    tie_start: bool = False
    tie_stop: bool = False
    is_grace: bool = False
    is_cue: bool = False
    
    # Notation elements
    tuplets: List['Tuplet'] = field(default_factory=list)
    time_modification: Optional['TimeModification'] = None
    slurs: List['Slur'] = field(default_factory=list)
    beams: List['Beam'] = field(default_factory=list)

@dataclass
class Rest(Event):
    is_full_measure: bool = False
    
@dataclass
class Chord(Event):
    notes: List[Note] = field(default_factory=list)
