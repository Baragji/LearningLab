#!/usr/bin/env python3
"""
MCP Server for Code Assistant + RAG
Provides MCP interface for Trae IDE integration
"""

import asyncio
import json
import logging
import os
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
import uvicorn
from rag_engine import RAGEngine

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Code Assistant MCP Server", version="1.0.0")

# Initialize RAG engine
rag_engine = None

@app.on_event("startup")
async def startup_event():
    """Initialize RAG engine on startup"""
    global rag_engine
    try:
        rag_engine = RAGEngine()
        await rag_engine.initialize()
        logger.info("RAG engine initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize RAG engine: {e}")
        raise

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "rag_engine": rag_engine is not None and rag_engine.is_ready(),
            "ollama": True,  # Will be checked by RAG engine
            "chromadb": True  # Will be checked by RAG engine
        }
    }

@app.post("/mcp")
async def mcp_handler(request: Request):
    """Main MCP request handler"""
    try:
        body = await request.json()
        method = body.get("method")
        params = body.get("params", {})
        
        logger.info(f"MCP request: {method}")
        
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
        logger.error(f"MCP handler error: {e}")
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
            "version": "1.0.0"
        }
    }

async def handle_tools_list() -> Dict[str, Any]:
    """List available tools"""
    return {
        "tools": [
            {
                "name": "analyze_code",
                "description": "Analyze code and provide insights using RAG",
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
                "description": "Search through codebase using semantic search",
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
                "description": "Generate code based on requirements",
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
                "description": "Explain how code works",
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
    }

async def handle_tool_call(params: Dict[str, Any]) -> Dict[str, Any]:
    """Handle tool call requests"""
    if not rag_engine:
        raise HTTPException(status_code=500, detail="RAG engine not initialized")
    
    tool_name = params.get("name")
    arguments = params.get("arguments", {})
    
    try:
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
        logger.error(f"Tool call error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def handle_resources_list() -> Dict[str, Any]:
    """List available resources"""
    return {
        "resources": [
            {
                "uri": "codebase://",
                "name": "Codebase",
                "description": "Access to the indexed codebase",
                "mimeType": "application/json"
            }
        ]
    }

async def handle_resource_read(params: Dict[str, Any]) -> Dict[str, Any]:
    """Read resource content"""
    uri = params.get("uri")
    
    if uri == "codebase://":
        # Return codebase statistics
        if rag_engine:
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
    
    raise HTTPException(status_code=404, detail=f"Resource not found: {uri}")

if __name__ == "__main__":
    port = int(os.getenv("CODE_ASSISTANT_PORT", 8080))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )