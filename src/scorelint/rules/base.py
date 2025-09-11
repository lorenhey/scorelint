from abc import ABC, abstractmethod
from typing import List, Type
from scorelint.rules.engine import Context, RuleDefinition, Severity

class Rule(ABC):
    @classmethod
    @abstractmethod
    def definition(cls) -> RuleDefinition:
        pass
        
    @abstractmethod
    def evaluate(self, context: Context) -> None:
        pass

# Registry to hold all available rules
_REGISTRY: List[Type[Rule]] = []

def register_rule(rule_cls: Type[Rule]) -> Type[Rule]:
    _REGISTRY.append(rule_cls)
    return rule_cls

def get_all_rules() -> List[Type[Rule]]:
    return list(_REGISTRY)
