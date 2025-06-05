#!/usr/bin/env python3
"""
Proper MCP Server using stdio protocol
This is the correct implementation for MCP servers
"""

import asyncio
import json
import logging
import sys
from typing import Any, Dict, List, Optional

# Setup logging to stderr (not stdout, as stdout is used for MCP communication)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

class MCPServer:
    def __init__(self):
        self.rag_engine = None
        self.initialized = False
        
    async def initialize_rag(self):
        """Initialize RAG engine"""
        try:
            from rag_engine_openai import RAGEngine
            self.rag_engine = RAGEngine()
            await self.rag_engine.initialize()
            logger.info("✅ RAG engine initialized successfully")
            return True
        except Exception as e:
            logger.warning(f"⚠️ RAG engine not available: {e}")
            self.rag_engine = None
            return False
    
    async def handle_initialize(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle MCP initialize request"""
        await self.initialize_rag()
        self.initialized = True
        
        return {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {},
                "resources": {},
                "prompts": {}
            },
            "serverInfo": {
                "name": "learninglab-rag-server",
                "version": "1.0.0",
                "rag_enabled": self.rag_engine is not None and self.rag_engine.is_ready()
            }
        }
    
    async def handle_tools_list(self) -> Dict[str, Any]:
        """List available tools"""
        tools = [
            {
                "name": "analyze_code",
                "description": "Analyze code and provide insights using RAG" if self.rag_engine and self.rag_engine.is_ready() else "Analyze code (RAG not available)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "code": {
                            "type": "string",
                            "description": "Code to analyze"
                        },
                        "language": {
                            "type": "string",
                            "description": "Programming language"
                        },
                        "context": {
                            "type": "string",
                            "description": "Additional context"
                        }
                    },
                    "required": ["code"]
                }
            },
            {
                "name": "search_codebase",
                "description": "Search through codebase using semantic search" if self.rag_engine and self.rag_engine.is_ready() else "Search codebase (RAG not available)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query"
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Number of results to return",
                            "default": 5
                        }
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "generate_code",
                "description": "Generate code based on requirements" if self.rag_engine and self.rag_engine.is_ready() else "Generate code (RAG not available)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "requirements": {
                            "type": "string",
                            "description": "Code requirements"
                        },
                        "language": {
                            "type": "string",
                            "description": "Target programming language"
                        },
                        "context": {
                            "type": "string",
                            "description": "Additional context from codebase"
                        }
                    },
                    "required": ["requirements"]
                }
            },
            {
                "name": "explain_code",
                "description": "Explain how code works" if self.rag_engine and self.rag_engine.is_ready() else "Explain code (RAG not available)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "code": {
                            "type": "string",
                            "description": "Code to explain"
                        },
                        "level": {
                            "type": "string",
                            "description": "Explanation level (beginner, intermediate, advanced)",
                            "default": "intermediate"
                        }
                    },
                    "required": ["code"]
                }
            }
        ]
        
        return {"tools": tools}
    
    async def handle_tool_call(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle tool call requests"""
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        
        try:
            if self.rag_engine and self.rag_engine.is_ready():
                # Use real RAG engine
                logger.info(f"🧠 Using RAG engine for {tool_name}")
                
                if tool_name == "analyze_code":
                    result = await self.rag_engine.analyze_code(
                        code=arguments.get("code"),
                        language=arguments.get("language"),
                        context=arguments.get("context")
                    )
                elif tool_name == "search_codebase":
                    result = await self.rag_engine.search_codebase(
                        query=arguments.get("query"),
                        limit=arguments.get("limit", 5)
                    )
                elif tool_name == "generate_code":
                    result = await self.rag_engine.generate_code(
                        requirements=arguments.get("requirements"),
                        language=arguments.get("language"),
                        context=arguments.get("context")
                    )
                elif tool_name == "explain_code":
                    result = await self.rag_engine.explain_code(
                        code=arguments.get("code"),
                        level=arguments.get("level", "intermediate")
                    )
                else:
                    raise ValueError(f"Unknown tool: {tool_name}")
            else:
                # Fallback responses when RAG engine is not available
                logger.warning(f"⚠️ RAG engine not available for {tool_name}, using fallback")
                
                if tool_name == "analyze_code":
                    result = f"Code analysis for: {arguments.get('code', '')[:100]}...\n\n⚠️ RAG engine not available. This is a placeholder response."
                elif tool_name == "search_codebase":
                    result = f"Search results for: {arguments.get('query')}\n\n⚠️ RAG engine not available. This is a placeholder response."
                elif tool_name == "generate_code":
                    result = f"Generated code for: {arguments.get('requirements')}\n\n⚠️ RAG engine not available. This is a placeholder response."
                elif tool_name == "explain_code":
                    result = f"Code explanation for: {arguments.get('code', '')[:100]}...\n\n⚠️ RAG engine not available. This is a placeholder response."
                else:
                    raise ValueError(f"Unknown tool: {tool_name}")
            
            return {
                "content": [
                    {
                        "type": "text",
                        "text": result
                    }
                ]
            }
            
        except Exception as e:
            logger.error(f"❌ Tool call error: {e}")
            raise
    
    async def handle_resources_list(self) -> Dict[str, Any]:
        """List available resources"""
        resources = [
            {
                "uri": "codebase://",
                "name": "Codebase",
                "description": "Access to the indexed codebase",
                "mimeType": "application/json"
            }
        ]
        
        if self.rag_engine and self.rag_engine.is_ready():
            resources.append({
                "uri": "rag://stats",
                "name": "RAG Statistics",
                "description": "Statistics about the RAG knowledge base",
                "mimeType": "application/json"
            })
        
        return {"resources": resources}
    
    async def handle_resource_read(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Read resource content"""
        uri = params.get("uri")
        
        if uri == "codebase://":
            # Return codebase statistics
            if self.rag_engine and self.rag_engine.is_ready():
                stats = await self.rag_engine.get_codebase_stats()
            else:
                stats = {
                    "status": "RAG engine not available",
                    "total_documents": 0
                }
            
            return {
                "contents": [
                    {
                        "uri": uri,
                        "mimeType": "application/json",
                        "text": json.dumps(stats, indent=2)
                    }
                ]
            }
        
        elif uri == "rag://stats":
            if self.rag_engine and self.rag_engine.is_ready():
                stats = await self.rag_engine.get_codebase_stats()
                return {
                    "contents": [
                        {
                            "uri": uri,
                            "mimeType": "application/json",
                            "text": json.dumps(stats, indent=2)
                        }
                    ]
                }
            else:
                raise ValueError("RAG engine not available")
        
        raise ValueError(f"Resource not found: {uri}")
    
    async def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle incoming MCP request"""
        method = request.get("method")
        params = request.get("params", {})
        request_id = request.get("id")
        
        logger.info(f"🔧 MCP request: {method}")
        
        try:
            if method == "initialize":
                result = await self.handle_initialize(params)
            elif method == "tools/list":
                result = await self.handle_tools_list()
            elif method == "tools/call":
                result = await self.handle_tool_call(params)
            elif method == "resources/list":
                result = await self.handle_resources_list()
            elif method == "resources/read":
                result = await self.handle_resource_read(params)
            else:
                raise ValueError(f"Unknown method: {method}")
            
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": result
            }
            
        except Exception as e:
            logger.error(f"❌ Request handler error: {e}")
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "error": {
                    "code": -32603,
                    "message": str(e)
                }
            }

async def main():
    """Main MCP server loop"""
    server = MCPServer()
    logger.info("🚀 Starting MCP Server (stdio mode)")
    
    try:
        while True:
            # Read JSON-RPC request from stdin
            line = await asyncio.get_event_loop().run_in_executor(None, sys.stdin.readline)
            if not line:
                break
                
            line = line.strip()
            if not line:
                continue
            
            try:
                request = json.loads(line)
                response = await server.handle_request(request)
                
                # Send response to stdout
                print(json.dumps(response), flush=True)
                
            except json.JSONDecodeError as e:
                logger.error(f"❌ Invalid JSON received: {e}")
                error_response = {
                    "jsonrpc": "2.0",
                    "id": None,
                    "error": {
                        "code": -32700,
                        "message": "Parse error"
                    }
                }
                print(json.dumps(error_response), flush=True)
                
    except KeyboardInterrupt:
        logger.info("🛑 Server stopped by user")
    except Exception as e:
        logger.error(f"❌ Server error: {e}")
    finally:
        logger.info("👋 MCP Server shutdown")

if __name__ == "__main__":
    asyncio.run(main())#!/usr/bin/env python3
"""
Proper MCP Server using stdio protocol
This is the correct implementation for MCP servers
"""

import asyncio
import json
import logging
import sys
from typing import Any, Dict, List, Optional

# Setup logging to stderr (not stdout, as stdout is used for MCP communication)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

class MCPServer:
    def __init__(self):
        self.rag_engine = None
        self.initialized = False
        
    async def initialize_rag(self):
        """Initialize RAG engine"""
        try:
            from rag_engine_openai import RAGEngine
            self.rag_engine = RAGEngine()
            await self.rag_engine.initialize()
            logger.info("✅ RAG engine initialized successfully")
            return True
        except Exception as e:
            logger.warning(f"⚠️ RAG engine not available: {e}")
            self.rag_engine = None
            return False
    
    async def handle_initialize(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle MCP initialize request"""
        await self.initialize_rag()
        self.initialized = True
        
        return {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {},
                "resources": {},
                "prompts": {}
            },
            "serverInfo": {
                "name": "learninglab-rag-server",
                "version": "1.0.0",
                "rag_enabled": self.rag_engine is not None and self.rag_engine.is_ready()
            }
        }
    
    async def handle_tools_list(self) -> Dict[str, Any]:
        """List available tools"""
        tools = [
            {
                "name": "analyze_code",
                "description": "Analyze code and provide insights using RAG" if self.rag_engine and self.rag_engine.is_ready() else "Analyze code (RAG not available)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "code": {
                            "type": "string",
                            "description": "Code to analyze"
                        },
                        "language": {
                            "type": "string",
                            "description": "Programming language"
                        },
                        "context": {
                            "type": "string",
                            "description": "Additional context"
                        }
                    },
                    "required": ["code"]
                }
            },
            {
                "name": "search_codebase",
                "description": "Search through codebase using semantic search" if self.rag_engine and self.rag_engine.is_ready() else "Search codebase (RAG not available)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query"
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Number of results to return",
                            "default": 5
                        }
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "generate_code",
                "description": "Generate code based on requirements" if self.rag_engine and self.rag_engine.is_ready() else "Generate code (RAG not available)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "requirements": {
                            "type": "string",
                            "description": "Code requirements"
                        },
                        "language": {
                            "type": "string",
                            "description": "Target programming language"
                        },
                        "context": {
                            "type": "string",
                            "description": "Additional context from codebase"
                        }
                    },
                    "required": ["requirements"]
                }
            },
            {
                "name": "explain_code",
                "description": "Explain how code works" if self.rag_engine and self.rag_engine.is_ready() else "Explain code (RAG not available)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "code": {
                            "type": "string",
                            "description": "Code to explain"
                        },
                        "level": {
                            "type": "string",
                            "description": "Explanation level (beginner, intermediate, advanced)",
                            "default": "intermediate"
                        }
                    },
                    "required": ["code"]
                }
            }
        ]
        
        return {"tools": tools}
    
    async def handle_tool_call(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle tool call requests"""
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        
        try:
            if self.rag_engine and self.rag_engine.is_ready():
                # Use real RAG engine
                logger.info(f"🧠 Using RAG engine for {tool_name}")
                
                if tool_name == "analyze_code":
                    result = await self.rag_engine.analyze_code(
                        code=arguments.get("code"),
                        language=arguments.get("language"),
                        context=arguments.get("context")
                    )
                elif tool_name == "search_codebase":
                    result = await self.rag_engine.search_codebase(
                        query=arguments.get("query"),
                        limit=arguments.get("limit", 5)
                    )
                elif tool_name == "generate_code":
                    result = await self.rag_engine.generate_code(
                        requirements=arguments.get("requirements"),
                        language=arguments.get("language"),
                        context=arguments.get("context")
                    )
                elif tool_name == "explain_code":
                    result = await self.rag_engine.explain_code(
                        code=arguments.get("code"),
                        level=arguments.get("level", "intermediate")
                    )
                else:
                    raise ValueError(f"Unknown tool: {tool_name}")
            else:
                # Fallback responses when RAG engine is not available
                logger.warning(f"⚠️ RAG engine not available for {tool_name}, using fallback")
                
                if tool_name == "analyze_code":
                    result = f"Code analysis for: {arguments.get('code', '')[:100]}...\n\n⚠️ RAG engine not available. This is a placeholder response."
                elif tool_name == "search_codebase":
                    result = f"Search results for: {arguments.get('query')}\n\n⚠️ RAG engine not available. This is a placeholder response."
                elif tool_name == "generate_code":
                    result = f"Generated code for: {arguments.get('requirements')}\n\n⚠️ RAG engine not available. This is a placeholder response."
                elif tool_name == "explain_code":
                    result = f"Code explanation for: {arguments.get('code', '')[:100]}...\n\n⚠️ RAG engine not available. This is a placeholder response."
                else:
                    raise ValueError(f"Unknown tool: {tool_name}")
            
            return {
                "content": [
                    {
                        "type": "text",
                        "text": result
                    }
                ]
            }
            
        except Exception as e:
            logger.error(f"❌ Tool call error: {e}")
            raise
    
    async def handle_resources_list(self) -> Dict[str, Any]:
        """List available resources"""
        resources = [
            {
                "uri": "codebase://",
                "name": "Codebase",
                "description": "Access to the indexed codebase",
                "mimeType": "application/json"
            }
        ]
        
        if self.rag_engine and self.rag_engine.is_ready():
            resources.append({
                "uri": "rag://stats",
                "name": "RAG Statistics",
                "description": "Statistics about the RAG knowledge base",
                "mimeType": "application/json"
            })
        
        return {"resources": resources}
    
    async def handle_resource_read(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Read resource content"""
        uri = params.get("uri")
        
        if uri == "codebase://":
            # Return codebase statistics
            if self.rag_engine and self.rag_engine.is_ready():
                stats = await self.rag_engine.get_codebase_stats()
            else:
                stats = {
                    "status": "RAG engine not available",
                    "total_documents": 0
                }
            
            return {
                "contents": [
                    {
                        "uri": uri,
                        "mimeType": "application/json",
                        "text": json.dumps(stats, indent=2)
                    }
                ]
            }
        
        elif uri == "rag://stats":
            if self.rag_engine and self.rag_engine.is_ready():
                stats = await self.rag_engine.get_codebase_stats()
                return {
                    "contents": [
                        {
                            "uri": uri,
                            "mimeType": "application/json",
                            "text": json.dumps(stats, indent=2)
                        }
                    ]
                }
            else:
                raise ValueError("RAG engine not available")
        
        raise ValueError(f"Resource not found: {uri}")
    
    async def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle incoming MCP request"""
        method = request.get("method")
        params = request.get("params", {})
        request_id = request.get("id")
        
        logger.info(f"🔧 MCP request: {method}")
        
        try:
            if method == "initialize":
                result = await self.handle_initialize(params)
            elif method == "tools/list":
                result = await self.handle_tools_list()
            elif method == "tools/call":
                result = await self.handle_tool_call(params)
            elif method == "resources/list":
                result = await self.handle_resources_list()
            elif method == "resources/read":
                result = await self.handle_resource_read(params)
            else:
                raise ValueError(f"Unknown method: {method}")
            
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": result
            }
            
        except Exception as e:
            logger.error(f"❌ Request handler error: {e}")
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "error": {
                    "code": -32603,
                    "message": str(e)
                }
            }

async def main():
    """Main MCP server loop"""
    server = MCPServer()
    logger.info("🚀 Starting MCP Server (stdio mode)")
    
    try:
        while True:
            # Read JSON-RPC request from stdin
            line = await asyncio.get_event_loop().run_in_executor(None, sys.stdin.readline)
            if not line:
                break
                
            line = line.strip()
            if not line:
                continue
            
            try:
                request = json.loads(line)
                response = await server.handle_request(request)
                
                # Send response to stdout
                print(json.dumps(response), flush=True)
                
            except json.JSONDecodeError as e:
                logger.error(f"❌ Invalid JSON received: {e}")
                error_response = {
                    "jsonrpc": "2.0",
                    "id": None,
                    "error": {
                        "code": -32700,
                        "message": "Parse error"
                    }
                }
                print(json.dumps(error_response), flush=True)
                
    except KeyboardInterrupt:
        logger.info("🛑 Server stopped by user")
    except Exception as e:
        logger.error(f"❌ Server error: {e}")
    finally:
        logger.info("👋 MCP Server shutdown")

if __name__ == "__main__":
    asyncio.run(main())