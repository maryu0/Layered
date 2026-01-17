"""
Architecture rules engine - defines and validates architectural rules.
"""
from typing import List, Dict, Set, Optional
from dataclasses import dataclass


@dataclass
class ArchitectureRule:
    """Represents a single architecture rule."""
    name: str
    description: str
    layer_source: Optional[str] = None
    layer_target: Optional[str] = None
    allowed: bool = True  # If False, this dependency is forbidden


class RulesEngine:
    """
    Manages and validates architecture rules.
    """

    def __init__(self, architecture_config: Dict):
        """
        Initialize rules engine with inferred architecture.
        
        Args:
            architecture_config: Output from ArchitectureInferenceEngine
        """
        self.layers = architecture_config['layers']
        self.hierarchy = architecture_config['hierarchy']
        self.allowed_dependencies = architecture_config['allowed_dependencies']
        self.rules: List[ArchitectureRule] = []
        
        # Generate rules from architecture
        self._generate_rules()

    def _generate_rules(self):
        """Generate validation rules from architecture configuration."""
        
        # Rule 1: Layer boundary rules
        for source_layer, allowed_targets in self.allowed_dependencies.items():
            for target_layer in self.layers:
                if target_layer == source_layer:
                    continue
                
                if target_layer in allowed_targets:
                    # Allowed dependency
                    rule = ArchitectureRule(
                        name=f"{source_layer}_to_{target_layer}_allowed",
                        description=f"{source_layer} layer may depend on {target_layer} layer",
                        layer_source=source_layer,
                        layer_target=target_layer,
                        allowed=True
                    )
                else:
                    # Forbidden dependency
                    rule = ArchitectureRule(
                        name=f"{source_layer}_to_{target_layer}_forbidden",
                        description=f"{source_layer} layer must not depend on {target_layer} layer",
                        layer_source=source_layer,
                        layer_target=target_layer,
                        allowed=False
                    )
                
                self.rules.append(rule)
        
        # Rule 2: Legacy isolation
        if 'legacy' in self.layers:
            self.rules.append(
                ArchitectureRule(
                    name="legacy_isolation",
                    description="Legacy systems should be isolated behind anti-corruption layer",
                    layer_target='legacy',
                    allowed=False  # Direct access to legacy is forbidden
                )
            )

    def get_applicable_rule(self, source_layer: str, target_layer: str) -> Optional[ArchitectureRule]:
        """
        Find the rule applicable to a given layer dependency.
        
        Args:
            source_layer: Source layer
            target_layer: Target layer
            
        Returns:
            Applicable rule or None
        """
        for rule in self.rules:
            if (rule.layer_source == source_layer and 
                rule.layer_target == target_layer):
                return rule
        return None

    def is_allowed(self, source_layer: str, target_layer: str) -> bool:
        """Check if dependency between layers is allowed."""
        rule = self.get_applicable_rule(source_layer, target_layer)
        if rule:
            return rule.allowed
        
        # Default: check if target is in allowed dependencies
        return target_layer in self.allowed_dependencies.get(source_layer, [])

    def get_violation_severity(
        self, 
        source_layer: str, 
        target_layer: str
    ) -> str:
        """
        Determine severity of a layer violation.
        
        Returns: 'critical', 'high', 'medium', or 'low'
        """
        source_level = self.hierarchy.get(source_layer, 999)
        target_level = self.hierarchy.get(target_layer, 999)
        
        # Critical: Bypassing multiple layers
        if source_level - target_level >= 2:
            return 'critical'
        
        # Critical: Accessing legacy directly
        if target_layer == 'legacy':
            return 'critical'
        
        # High: Reverse dependency (lower layer depending on higher)
        if target_level < source_level:
            return 'high'
        
        # Medium: Cross-cutting concerns
        if abs(source_level - target_level) > 1:
            return 'medium'
        
        return 'low'
