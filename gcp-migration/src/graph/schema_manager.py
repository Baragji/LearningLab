#!/usr/bin/env python3
"""
Graph Schema Manager for RAG Knowledge Graphs
Defines and manages the graph schema for code knowledge representation
"""

import json
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum

from .tigergraph_client import TigerGraphClient, GraphConfig

logger = logging.getLogger(__name__)

class VertexType(Enum):
    """Vertex types in the knowledge graph"""
    CODE_FILE = "CodeFile"
    FUNCTION = "Function"
    CLASS = "Class"
    VARIABLE = "Variable"
    CONCEPT = "Concept"
    DOCUMENTATION = "Documentation"
    TEST = "Test"
    DEPENDENCY = "Dependency"
    REPOSITORY = "Repository"
    COMMIT = "Commit"

class EdgeType(Enum):
    """Edge types in the knowledge graph"""
    CONTAINS = "Contains"           # File contains function/class
    CALLS = "Calls"                # Function calls another function
    INHERITS = "Inherits"          # Class inherits from another class
    IMPLEMENTS = "Implements"      # Class implements interface
    USES = "Uses"                  # Function uses variable/dependency
    DOCUMENTS = "Documents"        # Documentation describes code
    TESTS = "Tests"               # Test tests function/class
    DEPENDS_ON = "DependsOn"      # Module depends on another
    SIMILAR_TO = "SimilarTo"      # Semantic similarity
    REFERENCES = "References"     # Code references concept
    MODIFIES = "Modifies"         # Commit modifies file
    AUTHORED_BY = "AuthoredBy"    # Code authored by developer

@dataclass
class VertexSchema:
    """Schema definition for a vertex type"""
    name: str
    attributes: Dict[str, str]
    primary_key: str = "id"
    description: str = ""

@dataclass
class EdgeSchema:
    """Schema definition for an edge type"""
    name: str
    from_vertex: str
    to_vertex: str
    attributes: Dict[str, str]
    description: str = ""

class GraphSchemaManager:
    """
    Manages the graph schema for RAG knowledge graphs
    Provides schema definition, creation, and validation
    """
    
    def __init__(self, client: TigerGraphClient):
        self.client = client
        self.vertex_schemas: Dict[str, VertexSchema] = {}
        self.edge_schemas: Dict[str, EdgeSchema] = {}
        self._initialize_schemas()
    
    def _initialize_schemas(self):
        """Initialize predefined schemas for code knowledge graphs"""
        
        # Define vertex schemas
        self.vertex_schemas = {
            VertexType.CODE_FILE.value: VertexSchema(
                name=VertexType.CODE_FILE.value,
                attributes={
                    "file_path": "STRING",
                    "file_name": "STRING",
                    "file_type": "STRING",
                    "language": "STRING",
                    "size_bytes": "INT",
                    "lines_of_code": "INT",
                    "created_at": "DATETIME",
                    "modified_at": "DATETIME",
                    "content_hash": "STRING",
                    "embedding": "STRING",
                    "summary": "STRING"
                },
                description="Represents a source code file"
            ),
            
            VertexType.FUNCTION.value: VertexSchema(
                name=VertexType.FUNCTION.value,
                attributes={
                    "function_name": "STRING",
                    "signature": "STRING",
                    "return_type": "STRING",
                    "parameters": "STRING",
                    "docstring": "STRING",
                    "complexity": "INT",
                    "lines_of_code": "INT",
                    "start_line": "INT",
                    "end_line": "INT",
                    "embedding": "STRING",
                    "is_public": "BOOL",
                    "is_async": "BOOL"
                },
                description="Represents a function or method"
            ),
            
            VertexType.CLASS.value: VertexSchema(
                name=VertexType.CLASS.value,
                attributes={
                    "class_name": "STRING",
                    "base_classes": "STRING",
                    "interfaces": "STRING",
                    "docstring": "STRING",
                    "method_count": "INT",
                    "property_count": "INT",
                    "start_line": "INT",
                    "end_line": "INT",
                    "embedding": "STRING",
                    "is_abstract": "BOOL",
                    "access_modifier": "STRING"
                },
                description="Represents a class or interface"
            ),
            
            VertexType.CONCEPT.value: VertexSchema(
                name=VertexType.CONCEPT.value,
                attributes={
                    "concept_name": "STRING",
                    "description": "STRING",
                    "category": "STRING",
                    "confidence": "FLOAT",
                    "embedding": "STRING",
                    "frequency": "INT",
                    "importance": "FLOAT"
                },
                description="Represents an abstract concept or topic"
            ),
            
            VertexType.DOCUMENTATION.value: VertexSchema(
                name=VertexType.DOCUMENTATION.value,
                attributes={
                    "title": "STRING",
                    "content": "STRING",
                    "doc_type": "STRING",
                    "format": "STRING",
                    "embedding": "STRING",
                    "created_at": "DATETIME",
                    "updated_at": "DATETIME",
                    "author": "STRING"
                },
                description="Represents documentation content"
            ),
            
            VertexType.DEPENDENCY.value: VertexSchema(
                name=VertexType.DEPENDENCY.value,
                attributes={
                    "package_name": "STRING",
                    "version": "STRING",
                    "dependency_type": "STRING",
                    "license": "STRING",
                    "description": "STRING",
                    "homepage": "STRING",
                    "is_dev_dependency": "BOOL"
                },
                description="Represents an external dependency"
            )
        }
        
        # Define edge schemas
        self.edge_schemas = {
            EdgeType.CONTAINS.value: EdgeSchema(
                name=EdgeType.CONTAINS.value,
                from_vertex=VertexType.CODE_FILE.value,
                to_vertex=VertexType.FUNCTION.value,
                attributes={
                    "relationship_type": "STRING",
                    "confidence": "FLOAT"
                },
                description="File contains function/class"
            ),
            
            EdgeType.CALLS.value: EdgeSchema(
                name=EdgeType.CALLS.value,
                from_vertex=VertexType.FUNCTION.value,
                to_vertex=VertexType.FUNCTION.value,
                attributes={
                    "call_count": "INT",
                    "call_type": "STRING",
                    "line_number": "INT",
                    "is_recursive": "BOOL"
                },
                description="Function calls another function"
            ),
            
            EdgeType.INHERITS.value: EdgeSchema(
                name=EdgeType.INHERITS.value,
                from_vertex=VertexType.CLASS.value,
                to_vertex=VertexType.CLASS.value,
                attributes={
                    "inheritance_type": "STRING",
                    "override_count": "INT"
                },
                description="Class inherits from another class"
            ),
            
            EdgeType.USES.value: EdgeSchema(
                name=EdgeType.USES.value,
                from_vertex=VertexType.FUNCTION.value,
                to_vertex=VertexType.DEPENDENCY.value,
                attributes={
                    "usage_type": "STRING",
                    "import_statement": "STRING",
                    "frequency": "INT"
                },
                description="Function uses external dependency"
            ),
            
            EdgeType.SIMILAR_TO.value: EdgeSchema(
                name=EdgeType.SIMILAR_TO.value,
                from_vertex=VertexType.FUNCTION.value,
                to_vertex=VertexType.FUNCTION.value,
                attributes={
                    "similarity_score": "FLOAT",
                    "similarity_type": "STRING",
                    "algorithm": "STRING"
                },
                description="Semantic similarity between functions"
            ),
            
            EdgeType.DOCUMENTS.value: EdgeSchema(
                name=EdgeType.DOCUMENTS.value,
                from_vertex=VertexType.DOCUMENTATION.value,
                to_vertex=VertexType.FUNCTION.value,
                attributes={
                    "relevance_score": "FLOAT",
                    "doc_section": "STRING"
                },
                description="Documentation describes code element"
            ),
            
            EdgeType.REFERENCES.value: EdgeSchema(
                name=EdgeType.REFERENCES.value,
                from_vertex=VertexType.FUNCTION.value,
                to_vertex=VertexType.CONCEPT.value,
                attributes={
                    "reference_strength": "FLOAT",
                    "context": "STRING"
                },
                description="Code references abstract concept"
            )
        }
    
    async def create_schema(self) -> bool:
        """Create the complete graph schema"""
        try:
            logger.info("Creating graph schema...")
            
            # Create vertex types
            for vertex_schema in self.vertex_schemas.values():
                success = self.client.create_vertex_type(
                    vertex_schema.name,
                    vertex_schema.attributes
                )
                if not success:
                    logger.error(f"Failed to create vertex type: {vertex_schema.name}")
                    return False
                logger.info(f"✅ Created vertex type: {vertex_schema.name}")
            
            # Create edge types
            for edge_schema in self.edge_schemas.values():
                success = self.client.create_edge_type(
                    edge_schema.name,
                    edge_schema.from_vertex,
                    edge_schema.to_vertex,
                    edge_schema.attributes
                )
                if not success:
                    logger.error(f"Failed to create edge type: {edge_schema.name}")
                    return False
                logger.info(f"✅ Created edge type: {edge_schema.name}")
            
            logger.info("✅ Graph schema created successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to create schema: {e}")
            return False
    
    def get_schema_definition(self) -> Dict[str, Any]:
        """Get complete schema definition as dictionary"""
        return {
            "vertices": {name: asdict(schema) for name, schema in self.vertex_schemas.items()},
            "edges": {name: asdict(schema) for name, schema in self.edge_schemas.items()},
            "metadata": {
                "version": "1.0",
                "created_for": "RAG Knowledge Graph",
                "vertex_count": len(self.vertex_schemas),
                "edge_count": len(self.edge_schemas)
            }
        }
    
    def export_schema(self, file_path: str) -> bool:
        """Export schema definition to JSON file"""
        try:
            schema_def = self.get_schema_definition()
            with open(file_path, 'w') as f:
                json.dump(schema_def, f, indent=2)
            logger.info(f"Schema exported to: {file_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to export schema: {e}")
            return False
    
    def validate_vertex_data(self, vertex_type: str, data: Dict[str, Any]) -> bool:
        """Validate vertex data against schema"""
        if vertex_type not in self.vertex_schemas:
            logger.error(f"Unknown vertex type: {vertex_type}")
            return False
        
        schema = self.vertex_schemas[vertex_type]
        
        # Check required attributes
        for attr_name, attr_type in schema.attributes.items():
            if attr_name not in data:
                logger.warning(f"Missing attribute {attr_name} for vertex {vertex_type}")
                continue
            
            # Basic type validation
            value = data[attr_name]
            if not self._validate_attribute_type(value, attr_type):
                logger.error(f"Invalid type for {attr_name}: expected {attr_type}, got {type(value)}")
                return False
        
        return True
    
    def _validate_attribute_type(self, value: Any, expected_type: str) -> bool:
        """Validate attribute type"""
        type_mapping = {
            "STRING": str,
            "INT": int,
            "FLOAT": float,
            "BOOL": bool,
            "DATETIME": str  # Simplified validation
        }
        
        expected_python_type = type_mapping.get(expected_type)
        if expected_python_type is None:
            return True  # Unknown type, skip validation
        
        return isinstance(value, expected_python_type)
    
    async def get_schema_stats(self) -> Dict[str, Any]:
        """Get statistics about the current schema"""
        try:
            stats = await self.client.get_graph_stats()
            
            return {
                "schema_version": "1.0",
                "vertex_types": len(self.vertex_schemas),
                "edge_types": len(self.edge_schemas),
                "graph_stats": stats,
                "vertex_type_names": list(self.vertex_schemas.keys()),
                "edge_type_names": list(self.edge_schemas.keys())
            }
        except Exception as e:
            logger.error(f"Failed to get schema stats: {e}")
            return {"error": str(e)}

# Utility functions for schema management
def create_custom_vertex_schema(name: str, attributes: Dict[str, str], 
                               description: str = "") -> VertexSchema:
    """Create a custom vertex schema"""
    return VertexSchema(
        name=name,
        attributes=attributes,
        description=description
    )

def create_custom_edge_schema(name: str, from_vertex: str, to_vertex: str,
                             attributes: Dict[str, str], description: str = "") -> EdgeSchema:
    """Create a custom edge schema"""
    return EdgeSchema(
        name=name,
        from_vertex=from_vertex,
        to_vertex=to_vertex,
        attributes=attributes,
        description=description
    )