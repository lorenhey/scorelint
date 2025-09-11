from enum import Enum
from dataclasses import dataclass
from typing import Optional, List, Dict
from scorelint.models.score import Score
from scorelint.models.events import Location

class Severity(Enum):
    ERROR = "ERROR"         # Formal errors, objective contradictions
    WARNING = "WARNING"     # Likely notation problem, inconsistency
    STYLE = "STYLE"         # Style convention, editorial preference
    INFO = "INFO"           # Informational observation

@dataclass
class RuleDefinition:
    id: str
    category: str
    description: str
    rationale: str
    default_severity: Severity

@dataclass
class Finding:
    rule_id: str
    severity: Severity
    message: str
    location: Optional[Location] = None
    
    def __str__(self):
        loc = str(self.location) if self.location else "Global"
        return f"[{self.severity.value}] {self.rule_id} at {loc}: {self.message}"

class Context:
    """The context passed to rules during evaluation."""
    def __init__(self, score: Score, config: Dict):
        self.score = score
        self.config = config
        self.findings: List[Finding] = []
        
    def report(self, rule_id: str, severity: Severity, message: str, location: Optional[Location] = None):
        self.findings.append(Finding(rule_id, severity, message, location))
