"""
Graph builder - constructs dependency graph from analysis results.
Uses NetworkX for graph operations.
"""
import networkx as nx
from typing import List, Dict, Tuple, Set, Optional
from app.analysis.analyzer import ModuleInfo, Dependency


class DependencyGraph:
    """
    Manages the dependency graph structure.
    Provides graph operations and queries.
    """

    def __init__(self):
        """Initialize empty directed graph."""
        self.graph = nx.DiGraph()
        self.module_metadata: Dict[str, ModuleInfo] = {}

    def build_from_analysis(
        self, 
        modules: Dict[str, ModuleInfo], 
        dependencies: List[Dependency]
    ):
        """
        Build graph from analysis results.
        
        Args:
            modules: Dictionary of module information
            dependencies: List of dependency relationships
        """
        self.module_metadata = modules
        
        # Add nodes
        for module_name, module_info in modules.items():
            self.graph.add_node(
                module_name,
                label=module_name.split('.')[-1],
                file_path=module_info.file_path,
                layer=module_info.layer,
                is_test=module_info.is_test
            )
        
        # Add edges
        for dep in dependencies:
            if dep.source in self.graph and dep.target in self.graph:
                self.graph.add_edge(
                    dep.source,
                    dep.target,
                    import_type=dep.import_type
                )

    def get_nodes(self) -> List[str]:
        """Get all node IDs."""
        return list(self.graph.nodes())

    def get_edges(self) -> List[Tuple[str, str]]:
        """Get all edges as (from, to) tuples."""
        return list(self.graph.edges())

    def get_node_data(self, node_id: str) -> Dict:
        """Get all data for a specific node."""
        return dict(self.graph.nodes[node_id])

    def set_node_layer(self, node_id: str, layer: str):
        """Assign a layer to a node."""
        if node_id in self.graph:
            self.graph.nodes[node_id]['layer'] = layer
            if node_id in self.module_metadata:
                self.module_metadata[node_id].layer = layer

    def get_successors(self, node_id: str) -> List[str]:
        """Get direct dependencies (outgoing edges)."""
        return list(self.graph.successors(node_id))

    def get_predecessors(self, node_id: str) -> List[str]:
        """Get modules that depend on this one (incoming edges)."""
        return list(self.graph.predecessors(node_id))

    def find_cycles(self) -> List[List[str]]:
        """
        Find all circular dependencies.
        
        Returns:
            List of cycles, where each cycle is a list of node IDs
        """
        try:
            cycles = list(nx.simple_cycles(self.graph))
            return cycles
        except:
            return []

    def find_path(self, source: str, target: str) -> Optional[List[str]]:
        """
        Find shortest path between two nodes.
        
        Returns:
            List of node IDs in path, or None if no path exists
        """
        try:
            return nx.shortest_path(self.graph, source, target)
        except nx.NetworkXNoPath:
            return None

    def get_layer_violations(
        self, 
        layer_hierarchy: Dict[str, int]
    ) -> List[Tuple[str, str, int]]:
        """
        Detect edges that violate layer hierarchy.
        
        Args:
            layer_hierarchy: Map of layer name to level (0=top, higher=deeper)
            
        Returns:
            List of (from_node, to_node, violation_depth) tuples
        """
        violations = []
        
        for source, target in self.graph.edges():
            source_layer = self.graph.nodes[source].get('layer')
            target_layer = self.graph.nodes[target].get('layer')
            
            if source_layer and target_layer:
                source_level = layer_hierarchy.get(source_layer, 999)
                target_level = layer_hierarchy.get(target_layer, 999)
                
                # Violation: higher layer depends on lower layer
                # (should only depend downward)
                if target_level < source_level:
                    violation_depth = source_level - target_level
                    violations.append((source, target, violation_depth))
        
        return violations

    def get_nodes_by_layer(self, layer: str) -> List[str]:
        """Get all nodes in a specific layer."""
        return [
            node for node, data in self.graph.nodes(data=True)
            if data.get('layer') == layer
        ]

    def get_component_count(self) -> int:
        """Get number of weakly connected components."""
        return nx.number_weakly_connected_components(self.graph)

    def get_graph_stats(self) -> Dict:
        """Get overall graph statistics."""
        return {
            'total_nodes': self.graph.number_of_nodes(),
            'total_edges': self.graph.number_of_edges(),
            'density': nx.density(self.graph),
            'is_dag': nx.is_directed_acyclic_graph(self.graph),
            'components': self.get_component_count()
        }

    def to_dict(self) -> Dict:
        """
        Export graph structure as dictionary for serialization.
        
        Returns:
            Dictionary with nodes and edges
        """
        return {
            'nodes': [
                {'id': node, **data}
                for node, data in self.graph.nodes(data=True)
            ],
            'edges': [
                {
                    'from': source,
                    'to': target,
                    **data
                }
                for source, target, data in self.graph.edges(data=True)
            ]
        }
