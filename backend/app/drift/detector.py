"""
Drift detection engine - identifies architecture violations.
"""
from typing import List, Dict, Optional
from datetime import datetime
import uuid

from app.graph.builder import DependencyGraph
from app.rules.engine import RulesEngine
from app.models.schemas import ViolationType, ViolationSeverity


class ViolationDetector:
    """
    Detects various types of architecture drift violations.
    """

    def __init__(self, graph: DependencyGraph, rules: RulesEngine, module_layers: Dict[str, str]):
        """
        Initialize violation detector.
        
        Args:
            graph: Dependency graph
            rules: Rules engine
            module_layers: Module to layer mapping
        """
        self.graph = graph
        self.rules = rules
        self.module_layers = module_layers
        self.violations: List[Dict] = []

    def detect_all_violations(self) -> List[Dict]:
        """
        Run all violation detection checks.
        
        Returns:
            List of violation dictionaries
        """
        self.violations = []
        
        # Check each type of violation
        self._detect_layer_violations()
        self._detect_circular_dependencies()
        self._detect_legacy_access_violations()
        self._detect_gateway_bypasses()
        
        return self.violations

    def _detect_layer_violations(self):
        """
        Detect violations of layer dependency rules.
        """
        for source, target in self.graph.get_edges():
            source_layer = self.module_layers.get(source)
            target_layer = self.module_layers.get(target)
            
            if not source_layer or not target_layer:
                continue
            
            # Skip if same layer
            if source_layer == target_layer:
                continue
            
            # Check if this dependency is allowed
            if not self.rules.is_allowed(source_layer, target_layer):
                severity = self.rules.get_violation_severity(source_layer, target_layer)
                rule = self.rules.get_applicable_rule(source_layer, target_layer)
                
                self.violations.append({
                    'id': str(uuid.uuid4()),
                    'type': ViolationType.LAYER_VIOLATION.value,
                    'severity': severity,
                    'title': f'Layer violation: {source_layer} → {target_layer}',
                    'description': f'Module "{source}" from {source_layer} layer depends on "{target}" from {target_layer} layer',
                    'source_module': source,
                    'target_module': target,
                    'dependency_path': [source, target],
                    'rule_name': rule.name if rule else 'layer_boundary',
                    'pattern_broken': rule.description if rule else f'{source_layer} should not depend on {target_layer}',
                    'timestamp': datetime.utcnow()
                })

    def _detect_circular_dependencies(self):
        """
        Detect circular dependencies in the graph.
        """
        cycles = self.graph.find_cycles()
        
        for cycle in cycles:
            # Only report if cycle crosses layer boundaries
            cycle_layers = [self.module_layers.get(node) for node in cycle]
            if len(set(cycle_layers)) > 1:  # Multiple layers involved
                severity = 'high'
            else:
                severity = 'medium'
            
            self.violations.append({
                'id': str(uuid.uuid4()),
                'type': ViolationType.CIRCULAR_DEPENDENCY.value,
                'severity': severity,
                'title': f'Circular dependency detected ({len(cycle)} modules)',
                'description': f'Circular dependency chain: {" → ".join(cycle)} → {cycle[0]}',
                'source_module': cycle[0],
                'target_module': cycle[-1],
                'dependency_path': cycle + [cycle[0]],  # Complete the circle
                'rule_name': 'acyclic_dependencies',
                'pattern_broken': 'Architecture should be acyclic (no circular dependencies)',
                'timestamp': datetime.utcnow()
            })

    def _detect_legacy_access_violations(self):
        """
        Detect direct access to legacy systems without proper isolation.
        """
        legacy_nodes = [
            node for node, layer in self.module_layers.items()
            if layer == 'legacy'
        ]
        
        for legacy_node in legacy_nodes:
            # Check who's accessing legacy
            predecessors = self.graph.get_predecessors(legacy_node)
            
            for accessor in predecessors:
                accessor_layer = self.module_layers.get(accessor)
                
                # Legacy should only be accessed through gateway or adapter
                if accessor_layer not in ['gateway', 'adapter']:
                    self.violations.append({
                        'id': str(uuid.uuid4()),
                        'type': ViolationType.LEGACY_ACCESS.value,
                        'severity': ViolationSeverity.CRITICAL.value,
                        'title': 'Direct legacy system access',
                        'description': f'Module "{accessor}" from {accessor_layer} layer directly accesses legacy system "{legacy_node}"',
                        'source_module': accessor,
                        'target_module': legacy_node,
                        'dependency_path': [accessor, legacy_node],
                        'rule_name': 'legacy_isolation',
                        'pattern_broken': 'Legacy systems must be accessed through anti-corruption layer (gateway/adapter)',
                        'timestamp': datetime.utcnow()
                    })

    def _detect_gateway_bypasses(self):
        """
        Detect when presentation layer bypasses API gateway.
        """
        presentation_nodes = [
            node for node, layer in self.module_layers.items()
            if layer == 'presentation'
        ]
        
        for pres_node in presentation_nodes:
            successors = self.graph.get_successors(pres_node)
            
            for target in successors:
                target_layer = self.module_layers.get(target)
                
                # Presentation should only talk to gateway
                if target_layer not in ['gateway', 'presentation']:
                    self.violations.append({
                        'id': str(uuid.uuid4()),
                        'type': ViolationType.BYPASS_GATEWAY.value,
                        'severity': ViolationSeverity.HIGH.value,
                        'title': 'Gateway bypass detected',
                        'description': f'Presentation module "{pres_node}" bypasses gateway and directly accesses "{target}"',
                        'source_module': pres_node,
                        'target_module': target,
                        'dependency_path': [pres_node, target],
                        'rule_name': 'gateway_enforcement',
                        'pattern_broken': 'All client requests must route through API Gateway for authentication and routing',
                        'timestamp': datetime.utcnow()
                    })

    def get_violations_by_severity(self) -> Dict[str, int]:
        """Get count of violations grouped by severity."""
        counts = {severity.value: 0 for severity in ViolationSeverity}
        for violation in self.violations:
            counts[violation['severity']] += 1
        return counts

    def get_violations_by_type(self) -> Dict[str, int]:
        """Get count of violations grouped by type."""
        counts = {vtype.value: 0 for vtype in ViolationType}
        for violation in self.violations:
            counts[violation['type']] += 1
        return counts
