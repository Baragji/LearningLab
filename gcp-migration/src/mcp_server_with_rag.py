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
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
import uvicorn

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Code Assistant MCP Server with RAG", version="2.0.0")

# Global RAG engine
rag_engine = None

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global rag_engine
    try:
        # Try to initialize RAG engine with OpenAI version
        try:
            from rag_engine_openai import RAGEngine
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
    """Health check endpoint"""
    rag_ready = rag_engine is not None and rag_engine.is_ready()
    
    return {
        "status": "healthy",
        "services": {
            "rag_engine": rag_ready,
            "mcp_server": True
        },
        "rag_stats": await rag_engine.get_codebase_stats() if rag_ready else None
    }

@app.post("/mcp")
async def mcp_handler(request: Request):
    """Main MCP request handler"""
    try:
        body = await request.json()
        method = body.get("method")
        params = body.get("params", {})
        
        logger.info(f"🔧 MCP request: {method}")
        
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
            raise HTTPException(status_code=400, detail=f"Unknown method: {method}")
            
    except Exception as e:
        logger.error(f"❌ MCP handler error: {e}")
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
    """Handle tool call requests"""
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
            elif tool_name == "search_codebase":
                result = await rag_engine.search_codebase(
                    query=arguments.get("query"),
                    limit=arguments.get("limit", 5)
                )
            elif tool_name == "generate_code":
                result = await rag_engine.generate_code(
                    requirements=arguments.get("requirements"),
                    language=arguments.get("language"),
                    context=arguments.get("context")
                )
            elif tool_name == "explain_code":
                result = await rag_engine.explain_code(
                    code=arguments.get("code"),
                    level=arguments.get("level", "intermediate")
                )
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
            else:
                raise HTTPException(status_code=400, detail=f"Unknown tool: {tool_name}")
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
        
    except Exception as e:
        logger.error(f"❌ Tool call error: {e}")
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
    """Root endpoint with server info"""
    rag_ready = rag_engine is not None and rag_engine.is_ready()
    
    return {
        "name": "Code Assistant MCP Server with RAG",
        "version": "2.0.0",
        "rag_enabled": rag_ready,
        "endpoints": {
            "health": "/health",
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