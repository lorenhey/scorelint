from fractions import Fraction
from dataclasses import dataclass
from typing import Optional, Union

@dataclass(frozen=True)
class Duration:
    """Exact rational representation of musical duration."""
    fraction: Fraction
    
    @classmethod
    def from_parts(cls, numerator: int, denominator: int) -> 'Duration':
        return cls(Fraction(numerator, denominator))

    def __add__(self, other: 'Duration') -> 'Duration':
        return Duration(self.fraction + other.fraction)

    def __sub__(self, other: 'Duration') -> 'Duration':
        return Duration(self.fraction - other.fraction)
        
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Duration):
            return False
        return self.fraction == other.fraction

    def __lt__(self, other: 'Duration') -> bool:
        return self.fraction < other.fraction

    def __bool__(self) -> bool:
        return bool(self.fraction)
        
    def __str__(self) -> str:
        return str(self.fraction)

    @classmethod
    def zero(cls) -> 'Duration':
        return cls(Fraction(0))

@dataclass
class TimeSignature:
    numerator: int
    denominator: int
    
    @property
    def measure_duration(self) -> Duration:
        """The nominal full duration of a measure with this time signature."""
        return Duration(Fraction(self.numerator, self.denominator))

@dataclass
class Position:
    """A semantic location in time within a measure."""
    measure_number: int
    beat: Duration  # fractional beat from start of measure (0 is beat 1)
    
    def __str__(self):
        return f"M{self.measure_number} beat {float(self.beat * self.ts.denominator) + 1 if hasattr(self, 'ts') else self.beat}"
