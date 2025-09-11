from dataclasses import dataclass
from typing import Optional

@dataclass(frozen=True)
class Pitch:
    step: str       # A-G
    alter: float    # 0 = natural, 1 = sharp, -1 = flat, 0.5 = quarter sharp, etc.
    octave: int
    
    def __str__(self) -> str:
        acc = ""
        if self.alter == 1: acc = "#"
        elif self.alter == -1: acc = "b"
        elif self.alter == 2: acc = "x"
        elif self.alter == -2: acc = "bb"
        elif self.alter != 0: acc = f"[{self.alter}]"
        
        return f"{self.step}{acc}{self.octave}"

@dataclass
class Clef:
    sign: str
    line: int
    octave_change: int = 0
