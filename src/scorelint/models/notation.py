from dataclasses import dataclass
from typing import Optional

@dataclass
class Tuplet:
    type: str # 'start' or 'stop'
    number: int = 1

@dataclass
class TimeModification:
    actual_notes: int
    normal_notes: int

@dataclass
class Slur:
    type: str # 'start', 'stop', 'continue'
    number: int = 1

@dataclass
class Beam:
    type: str # 'begin', 'continue', 'end', 'forward hook', 'backward hook'
    number: int = 1
