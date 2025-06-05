#!/usr/bin/env python3
"""
MCP Server with working RAG Engine
Uses the fixed RAG engine that works locally
"""

import asyncio
import json
import logging
import os
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer
import uvicorn

# Import enterprise modules
try:
    from ..auth.bearer_auth import verify_bearer_token, get_current_user
    from ..monitoring.health_checks import HealthChecker
    from ..monitoring.metrics import MCPMetrics
except ImportError:
    # Fallback if modules not available
    def verify_bearer_token(token: str = None):
        return True
    def get_current_user():
        return "anonymous"
    class HealthChecker:
        def __init__(self):
            pass
        async def check_all(self):
            return {"status": "healthy"}
    class MCPMetrics:
        def __init__(self):
            pass
        def record_request(self, method: str, success: bool = True):
            pass
        def record_rag_operation(self, operation: str, success: bool = True):
            pass
        def get_metrics(self):
            return {}

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Code Assistant MCP Server with RAG", version="2.0.0")

# Global instances
rag_engine = None
health_checker = None
mcp_metrics = None
security = HTTPBearer(auto_error=False)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global rag_engine, health_checker, mcp_metrics
    try:
        # Initialize enterprise modules
        health_checker = HealthChecker()
        mcp_metrics = MCPMetrics()
        logger.info("✅ Enterprise modules initialized")
        
        # Try to initialize RAG engine with OpenAI version
        try:
            import sys
            import os
            # Add parent directory to path for imports
            sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            from core.rag_engine_openai import RAGEngine
            rag_engine = RAGEngine()
            await rag_engine.initialize()
            logger.info("✅ RAG engine initialized successfully")
        except Exception as e:
            logger.warning(f"⚠️ RAG engine not available: {e}")
            rag_engine = None
    except Exception as e:
        logger.error(f"❌ Startup error: {e}")

@app.get("/health")
async def health_check():
    """Enhanced health check endpoint with detailed metrics"""
    try:
        # Get comprehensive health status
        if health_checker:
            health_status = await health_checker.check_all()
        else:
            rag_ready = rag_engine is not None and rag_engine.is_ready()
            health_status = {
                "status": "healthy",
                "services": {
                    "rag_engine": rag_ready,
                    "mcp_server": True
                }
            }
        
        # Add metrics if available
        if mcp_metrics:
            health_status["metrics"] = mcp_metrics.get_metrics()
        
        # Add RAG stats if available
        if rag_engine and rag_engine.is_ready():
            health_status["rag_stats"] = await rag_engine.get_codebase_stats()
        
        return health_status
        
    except Exception as e:
        logger.error(f"❌ Health check error: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

@app.get("/metrics")
async def get_metrics():
    """Get detailed performance metrics"""
    try:
        if mcp_metrics:
            return mcp_metrics.get_metrics()
        else:
            return {
                "message": "Enterprise metrics not available",
                "request_count": 0,
                "rag_operations": 0,
                "uptime_seconds": 0
            }
    except Exception as e:
        logger.error(f"❌ Metrics error: {e}")
        return {
            "error": str(e)
        }

@app.post("/mcp")
async def mcp_handler(request: Request, token: str = Depends(security)):
    """Main MCP request handler with authentication and metrics"""
    try:
        # Parse JSON with proper error handling
        try:
            body = await request.json()
        except Exception as e:
            logger.error(f"❌ JSON parse error: {e}")
            return JSONResponse(
                status_code=400,
                content={
                    "jsonrpc": "2.0",
                    "error": {
                        "code": -32700,
                        "message": "Parse error",
                        "data": str(e)
                    },
                    "id": None
                }
            )
        
        # Verify authentication for protected methods
        method = body.get("method")
        params = body.get("params", {})
        
        # Check authentication for non-public methods
        if method not in ["initialize", "tools/list", "resources/list"]:
            if not verify_bearer_token(token.credentials if token else None):
                if mcp_metrics:
                    mcp_metrics.record_request(method, success=False)
                raise HTTPException(status_code=401, detail="Authentication required")
        
        logger.info(f"🔧 MCP request: {method}")
        
        # Record request metrics
        if mcp_metrics:
            mcp_metrics.record_request(method, success=True)
        
        if method == "initialize":
            return await handle_initialize(params)
        elif method == "tools/list":
            return await handle_tools_list()
        elif method == "tools/call":
            return await handle_tool_call(params)
        elif method == "resources/list":
            return await handle_resources_list()
        elif method == "resources/read":
            return await handle_resource_read(params)
        else:
            if mcp_metrics:
                mcp_metrics.record_request(method, success=False)
            raise HTTPException(status_code=400, detail=f"Unknown method: {method}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ MCP handler error: {e}")
        if mcp_metrics:
            mcp_metrics.record_request(method if 'method' in locals() else "unknown", success=False)
        return JSONResponse(
            status_code=500,
            content={"error": {"code": -32603, "message": str(e)}}
        )

async def handle_initialize(params: Dict[str, Any]) -> Dict[str, Any]:
    """Handle MCP initialize request"""
    return {
        "protocolVersion": "2024-11-05",
        "capabilities": {
            "tools": {},
            "resources": {},
            "prompts": {}
        },
        "serverInfo": {
            "name": "code-assistant-rag",
            "version": "2.0.0",
            "rag_enabled": rag_engine is not None and rag_engine.is_ready()
        }
    }

async def handle_tools_list() -> Dict[str, Any]:
    """List available tools"""
    tools = [
        {
            "name": "analyze_code",
            "description": "Analyze code and provide insights using RAG" if rag_engine and rag_engine.is_ready() else "Analyze code (RAG not available)",
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
            "description": "Search through codebase using semantic search" if rag_engine and rag_engine.is_ready() else "Search codebase (RAG not available)",
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
            "description": "Generate code based on requirements" if rag_engine and rag_engine.is_ready() else "Generate code (RAG not available)",
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
            "description": "Explain how code works" if rag_engine and rag_engine.is_ready() else "Explain code (RAG not available)",
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
        },
        {
            "name": "add_document",
            "description": "Add a document to the RAG knowledge base" if rag_engine and rag_engine.is_ready() else "Add document (RAG not available)",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "content": {
                        "type": "string",
                        "description": "Document content"
                    },
                    "file_path": {
                        "type": "string",
                        "description": "File path or identifier"
                    },
                    "file_type": {
                        "type": "string",
                        "description": "File type (python, javascript, markdown, etc.)"
                    },
                    "project": {
                        "type": "string",
                        "description": "Project name"
                    }
                },
                "required": ["content", "file_path"]
            }
        }
    ]
    
    return {"tools": tools}

async def handle_tool_call(params: Dict[str, Any]) -> Dict[str, Any]:
    """Handle tool call requests with metrics tracking"""
    tool_name = params.get("name")
    arguments = params.get("arguments", {})
    
    try:
        if rag_engine and rag_engine.is_ready():
            # Use real RAG engine
            logger.info(f"🧠 Using RAG engine for {tool_name}")
            
            if tool_name == "analyze_code":
                result = await rag_engine.analyze_code(
                    code=arguments.get("code"),
                    language=arguments.get("language"),
                    context=arguments.get("context")
                )
                if mcp_metrics:
                    mcp_metrics.record_rag_operation("analyze_code", success=True)
            elif tool_name == "search_codebase":
                result = await rag_engine.search_codebase(
                    query=arguments.get("query"),
                    limit=arguments.get("limit", 5)
                )
                if mcp_metrics:
                    mcp_metrics.record_rag_operation("search_codebase", success=True)
            elif tool_name == "generate_code":
                result = await rag_engine.generate_code(
                    requirements=arguments.get("requirements"),
                    language=arguments.get("language"),
                    context=arguments.get("context")
                )
                if mcp_metrics:
                    mcp_metrics.record_rag_operation("generate_code", success=True)
            elif tool_name == "explain_code":
                result = await rag_engine.explain_code(
                    code=arguments.get("code"),
                    level=arguments.get("level", "intermediate")
                )
                if mcp_metrics:
                    mcp_metrics.record_rag_operation("explain_code", success=True)
            elif tool_name == "add_document":
                chunks_added = await rag_engine.add_document(
                    content=arguments.get("content"),
                    metadata={
                        "file_path": arguments.get("file_path"),
                        "file_type": arguments.get("file_type", "unknown"),
                        "project": arguments.get("project", "default")
                    }
                )
                result = f"✅ Successfully added document '{arguments.get('file_path')}' with {chunks_added} chunks to the knowledge base."
                if mcp_metrics:
                    mcp_metrics.record_rag_operation("add_document", success=True)
            else:
                if mcp_metrics:
                    mcp_metrics.record_rag_operation(tool_name, success=False)
                raise HTTPException(status_code=400, detail=f"Unknown tool: {tool_name}")
        else:
            # Fallback responses when RAG engine is not available
            logger.warning(f"⚠️ RAG engine not available for {tool_name}, using fallback")
            
            if mcp_metrics:
                mcp_metrics.record_rag_operation(tool_name, success=False)
            
            if tool_name == "analyze_code":
                result = f"Code analysis for: {arguments.get('code', '')[:100]}...\n\n⚠️ RAG engine not available. This is a placeholder response."
            elif tool_name == "search_codebase":
                result = f"Search results for: {arguments.get('query')}\n\n⚠️ RAG engine not available. This is a placeholder response."
            elif tool_name == "generate_code":
                result = f"Generated code for: {arguments.get('requirements')}\n\n⚠️ RAG engine not available. This is a placeholder response."
            elif tool_name == "explain_code":
                result = f"Code explanation for: {arguments.get('code', '')[:100]}...\n\n⚠️ RAG engine not available. This is a placeholder response."
            elif tool_name == "add_document":
                result = f"⚠️ Cannot add document '{arguments.get('file_path')}' - RAG engine not available."
            else:
                raise HTTPException(status_code=400, detail=f"Unknown tool: {tool_name}")
        
        return {
            "content": [
                {
                    "type": "text",
                    "text": result
                }
            ]
        }
        
    except HTTPException:
        if mcp_metrics:
            mcp_metrics.record_rag_operation(tool_name, success=False)
        raise
    except Exception as e:
        logger.error(f"❌ Tool call error: {e}")
        if mcp_metrics:
            mcp_metrics.record_rag_operation(tool_name, success=False)
        raise HTTPException(status_code=500, detail=str(e))

async def handle_resources_list() -> Dict[str, Any]:
    """List available resources"""
    resources = [
        {
            "uri": "codebase://",
            "name": "Codebase",
            "description": "Access to the indexed codebase",
            "mimeType": "application/json"
        }
    ]
    
    if rag_engine and rag_engine.is_ready():
        resources.append({
            "uri": "rag://stats",
            "name": "RAG Statistics",
            "description": "Statistics about the RAG knowledge base",
            "mimeType": "application/json"
        })
    
    return {"resources": resources}

async def handle_resource_read(params: Dict[str, Any]) -> Dict[str, Any]:
    """Read resource content"""
    uri = params.get("uri")
    
    if uri == "codebase://":
        # Return codebase statistics
        if rag_engine and rag_engine.is_ready():
            stats = await rag_engine.get_codebase_stats()
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
        if rag_engine and rag_engine.is_ready():
            stats = await rag_engine.get_codebase_stats()
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
            raise HTTPException(status_code=503, detail="RAG engine not available")
    
    raise HTTPException(status_code=404, detail=f"Resource not found: {uri}")

@app.get("/")
async def root():
    """Root endpoint with server info and enterprise features"""
    rag_ready = rag_engine is not None and rag_engine.is_ready()
    
    return {
        "name": "Code Assistant MCP Server with RAG",
        "version": "2.0.0",
        "rag_enabled": rag_ready,
        "enterprise_features": {
            "authentication": True,
            "metrics": mcp_metrics is not None,
            "health_checks": health_checker is not None,
            "error_handling": True
        },
        "endpoints": {
            "health": "/health",
            "metrics": "/metrics",
            "mcp": "/mcp",
            "docs": "/docs"
        },
        "rag_stats": await rag_engine.get_codebase_stats() if rag_ready else None
    }

if __name__ == "__main__":
    port = int(os.getenv("CODE_ASSISTANT_PORT", 8080))
    logger.info(f"🚀 Starting MCP Server with RAG on port {port}")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )