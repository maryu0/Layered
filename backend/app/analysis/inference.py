"""
Architecture inference engine - infers intended layers from code structure.
Uses heuristics based on folder structure, naming, and dependency patterns.
"""
from typing import Dict, List, Set, Optional, Tuple
from collections import defaultdict, Counter
from app.graph.builder import DependencyGraph


class ArchitectureInferenceEngine:
    """
    Infers the intended architectural layers from repository structure.
    """

    # Common layer identifiers in folder/module names
    LAYER_PATTERNS = {
        'presentation': ['client', 'frontend', 'web', 'mobile', 'ui', 'view', 'presentation'],
        'gateway': ['gateway', 'api', 'controller', 'endpoint', 'route', 'handler'],
        'service': ['service', 'business', 'domain', 'core', 'logic', 'usecase'],
        'data': ['data', 'repository', 'dao', 'model', 'database', 'db', 'persistence'],
        'legacy': ['legacy', 'old', 'deprecated', 'v1']
    }

    # Standard layer hierarchy (0=top, higher=deeper)
    DEFAULT_HIERARCHY = {
        'presentation': 0,
        'gateway': 1,
        'service': 2,
        'data': 3,
        'legacy': 4
    }

    def __init__(self, graph: DependencyGraph):
        """
        Initialize inference engine with dependency graph.
        
        Args:
            graph: Built dependency graph
        """
        self.graph = graph
        self.inferred_layers: Dict[str, str] = {}
        self.layer_hierarchy: Dict[str, int] = {}

    def infer_architecture(self) -> Dict[str, any]:
        """
        Run full architecture inference pipeline.
        
        Returns:
            Dictionary containing:
                - layers: List of layer names
                - hierarchy: Layer hierarchy mapping
                - module_assignments: Module to layer mapping
                - allowed_dependencies: Layer dependency rules
        """
        # Step 1: Assign modules to layers
        self._assign_modules_to_layers()
        
        # Step 2: Determine layer hierarchy
        self._determine_hierarchy()
        
        # Step 3: Infer allowed dependencies
        allowed_deps = self._infer_allowed_dependencies()
        
        return {
            'layers': list(self.layer_hierarchy.keys()),
            'hierarchy': self.layer_hierarchy,
            'module_assignments': self.inferred_layers,
            'allowed_dependencies': allowed_deps
        }

    def _assign_modules_to_layers(self):
        """
        Assign each module to a layer based on path and naming patterns.
        """
        for node_id in self.graph.get_nodes():
            # Get module metadata
            metadata = self.graph.module_metadata.get(node_id)
            if not metadata:
                continue
            
            file_path = metadata.file_path.lower()
            module_name = metadata.name.lower()
            
            # Check each layer pattern
            assigned_layer = None
            for layer_name, patterns in self.LAYER_PATTERNS.items():
                for pattern in patterns:
                    if pattern in file_path or pattern in module_name:
                        assigned_layer = layer_name
                        break
                if assigned_layer:
                    break
            
            # Default to 'service' if no pattern matches
            if not assigned_layer:
                assigned_layer = 'service'
            
            self.inferred_layers[node_id] = assigned_layer
            self.graph.set_node_layer(node_id, assigned_layer)

    def _determine_hierarchy(self):
        """
        Determine layer hierarchy based on actual dependency flow.
        Uses majority voting from observed dependencies.
        """
        # Start with default hierarchy
        layers_used = set(self.inferred_layers.values())
        
        self.layer_hierarchy = {
            layer: self.DEFAULT_HIERARCHY.get(layer, 2)  # Default to middle
            for layer in layers_used
        }
        
        # Refine based on actual dependencies
        # Count how many times layer A depends on layer B
        dependency_votes: Dict[Tuple[str, str], int] = defaultdict(int)
        
        for source, target in self.graph.get_edges():
            source_layer = self.inferred_layers.get(source)
            target_layer = self.inferred_layers.get(target)
            
            if source_layer and target_layer and source_layer != target_layer:
                dependency_votes[(source_layer, target_layer)] += 1
        
        # Adjust hierarchy to match majority flow
        # If A->B is common, A should be higher (lower number) than B
        for (layer_a, layer_b), count in dependency_votes.items():
            if count > 2:  # Significant pattern
                # Ensure layer_a is above layer_b
                if self.layer_hierarchy[layer_a] >= self.layer_hierarchy[layer_b]:
                    self.layer_hierarchy[layer_b] = self.layer_hierarchy[layer_a] + 1

    def _infer_allowed_dependencies(self) -> Dict[str, List[str]]:
        """
        Infer which layers are allowed to depend on which other layers.
        
        Rule: A layer can depend on layers at the same level or below (higher number).
        
        Returns:
            Dictionary mapping layer to list of allowed dependency layers
        """
        allowed = {}
        
        for layer, level in self.layer_hierarchy.items():
            # Can depend on same level or deeper layers
            allowed[layer] = [
                other_layer 
                for other_layer, other_level in self.layer_hierarchy.items()
                if other_level >= level and other_layer != layer
            ]
        
        return allowed

    def get_layer_for_module(self, module_id: str) -> Optional[str]:
        """Get the inferred layer for a specific module."""
        return self.inferred_layers.get(module_id)

    def get_layers_by_hierarchy(self) -> List[str]:
        """Get layers sorted by hierarchy (top to bottom)."""
        return sorted(self.layer_hierarchy.keys(), key=lambda x: self.layer_hierarchy[x])
