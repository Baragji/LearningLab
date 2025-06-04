#!/usr/bin/env python3
"""
Phase 3 MCP Server for Code Assistant with Full RAG Capabilities
Enhanced with file upload, codebase indexing, and advanced RAG features
"""

import asyncio
import json
import logging
import os
import tempfile
import time
from typing import Any, Dict, List, Optional
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import aiofiles

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Code Assistant MCP Server - Phase 3",
    version="3.0.0",
    description="Full RAG-enabled Code Assistant with file upload and codebase indexing"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global RAG engine
rag_engine = None
startup_time = time.time()

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global rag_engine
    try:
        logger.info("🚀 Starting Phase 3 MCP Server...")
        
        # Initialize RAG engine
        try:
            from rag_engine_phase3 import RAGEnginePhase3
            rag_engine = RAGEnginePhase3()
            await rag_engine.initialize()
            logger.info("✅ RAG engine initialized successfully")
        except Exception as e:
            logger.error(f"❌ RAG engine initialization failed: {e}")
            rag_engine = None
            
    except Exception as e:
        logger.error(f"❌ Startup error: {e}")

@app.get("/")
async def root():
    """Root endpoint with service information"""
    uptime = time.time() - startup_time
    return {
        "service": "Code Assistant MCP Server - Phase 3",
        "version": "3.0.0",
        "status": "running",
        "uptime_seconds": round(uptime, 2),
        "rag_engine_available": rag_engine is not None and rag_engine.is_ready(),
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "mcp": "/mcp",
            "upload": "/upload",
            "index_codebase": "/index-codebase",
            "stats": "/stats"
        }
    }

@app.get("/health")
async def health_check():
    """Enhanced health check endpoint"""
    rag_ready = rag_engine is not None and rag_engine.is_ready()
    
    health_status = {
        "status": "healthy" if rag_ready else "degraded",
        "timestamp": time.time(),
        "uptime_seconds": round(time.time() - startup_time, 2),
        "services": {
            "rag_engine": rag_ready,
            "mcp_server": True,
            "chromadb": False,
            "ollama": False
        }
    }
    
    # Test individual services
    if rag_engine:
        try:
            # Test ChromaDB
            stats = await rag_engine.get_codebase_stats()
            health_status["services"]["chromadb"] = True
            health_status["codebase_stats"] = stats
        except:
            pass
            
        try:
            # Test Ollama
            health_status["services"]["ollama"] = rag_engine.is_ready()
        except:
            pass
    
    return health_status

@app.get("/stats")
async def get_stats():
    """Get detailed system statistics"""
    if not rag_engine:
        return {"error": "RAG engine not available"}
    
    try:
        stats = await rag_engine.get_codebase_stats()
        return {
            "rag_engine": stats,
            "uptime_seconds": round(time.time() - startup_time, 2),
            "server_version": "3.0.0"
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    collection: str = Form("codebase"),
    language: Optional[str] = Form(None)
):
    """Upload and index a file in the RAG system"""
    if not rag_engine or not rag_engine.is_ready():
        raise HTTPException(status_code=503, detail="RAG engine not available")
    
    try:
        # Read file content
        content = await file.read()
        content_str = content.decode('utf-8')
        
        # Determine file type and language
        file_ext = Path(file.filename).suffix.lower()
        if not language:
            language_map = {
                '.py': 'python',
                '.js': 'javascript',
                '.ts': 'typescript',
                '.rs': 'rust',
                '.go': 'go',
                '.java': 'java',
                '.cpp': 'cpp',
                '.c': 'c',
                '.md': 'markdown',
                '.txt': 'text'
            }
            language = language_map.get(file_ext, 'text')
        
        # Add to RAG system
        metadata = {
            "file_path": file.filename,
            "language": language,
            "file_size": len(content_str),
            "upload_time": time.time(),
            "file_type": file_ext
        }
        
        chunks_created = await rag_engine.add_document(content_str, metadata)
        
        return {
            "status": "success",
            "filename": file.filename,
            "chunks_created": chunks_created,
            "collection": collection,
            "language": language,
            "file_size": len(content_str)
        }
        
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/index-codebase")
async def index_codebase(request: Request):
    """Index an entire codebase from uploaded files or URLs"""
    if not rag_engine or not rag_engine.is_ready():
        raise HTTPException(status_code=503, detail="RAG engine not available")
    
    try:
        body = await request.json()
        source_type = body.get("source_type", "files")
        
        if source_type == "sample":
            # Index sample codebase
            await rag_engine.initialize()
            return {"status": "success", "message": "Sample codebase indexed"}
        
        # TODO: Implement other source types (git repos, file uploads, etc.)
        return {"status": "error", "message": "Source type not implemented yet"}
        
    except Exception as e:
        logger.error(f"Codebase indexing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mcp")
async def mcp_handler(request: Request):
    """Enhanced MCP request handler with full RAG capabilities"""
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
        elif method == "prompts/list":
            return await handle_prompts_list()
        elif method == "prompts/get":
            return await handle_prompt_get(params)
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
            "name": "code-assistant-rag-phase3",
            "version": "3.0.0",
            "description": "Full RAG-enabled Code Assistant"
        }
    }

async def handle_tools_list() -> Dict[str, Any]:
    """List available tools with enhanced capabilities"""
    tools = [
        {
            "name": "analyze_code",
            "description": "Analyze code and provide insights using RAG",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "code": {"type": "string", "description": "Code to analyze"},
                    "language": {"type": "string", "description": "Programming language"},
                    "context": {"type": "string", "description": "Additional context"},
                    "analysis_type": {
                        "type": "string", 
                        "enum": ["basic", "detailed", "security", "performance"],
                        "default": "basic",
                        "description": "Type of analysis to perform"
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
                    "query": {"type": "string", "description": "Search query"},
                    "limit": {"type": "integer", "description": "Number of results", "default": 5},
                    "collection": {"type": "string", "description": "Collection to search", "default": "codebase"},
                    "language": {"type": "string", "description": "Filter by language"}
                },
                "required": ["query"]
            }
        },
        {
            "name": "generate_code",
            "description": "Generate code based on requirements with RAG context",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "requirements": {"type": "string", "description": "Code requirements"},
                    "language": {"type": "string", "description": "Target programming language"},
                    "context": {"type": "string", "description": "Additional context"},
                    "style": {"type": "string", "description": "Coding style preferences"},
                    "use_codebase_context": {"type": "boolean", "default": True, "description": "Use codebase for context"}
                },
                "required": ["requirements"]
            }
        },
        {
            "name": "explain_code",
            "description": "Explain how code works with contextual examples",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "code": {"type": "string", "description": "Code to explain"},
                    "level": {
                        "type": "string",
                        "enum": ["beginner", "intermediate", "advanced"],
                        "default": "intermediate"
                    },
                    "include_examples": {"type": "boolean", "default": True}
                },
                "required": ["code"]
            }
        },
        {
            "name": "refactor_code",
            "description": "Suggest code refactoring improvements",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "code": {"type": "string", "description": "Code to refactor"},
                    "language": {"type": "string", "description": "Programming language"},
                    "focus": {
                        "type": "string",
                        "enum": ["performance", "readability", "maintainability", "all"],
                        "default": "all"
                    }
                },
                "required": ["code"]
            }
        },
        {
            "name": "find_similar_code",
            "description": "Find similar code patterns in the codebase",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "code": {"type": "string", "description": "Reference code"},
                    "similarity_threshold": {"type": "number", "default": 0.7},
                    "limit": {"type": "integer", "default": 5}
                },
                "required": ["code"]
            }
        }
    ]
    
    return {"tools": tools}

async def handle_tool_call(params: Dict[str, Any]) -> Dict[str, Any]:
    """Handle enhanced tool call requests"""
    tool_name = params.get("name")
    arguments = params.get("arguments", {})
    
    try:
        if not rag_engine or not rag_engine.is_ready():
            # Enhanced fallback responses
            fallback_responses = {
                "analyze_code": f"📝 **Code Analysis** (Limited Mode)\n\nCode: `{arguments.get('code', '')[:100]}...`\n\n⚠️ **RAG engine not available** - This is a basic analysis placeholder.\n\nFor full analysis capabilities, ensure the RAG engine is running.",
                "search_codebase": f"🔍 **Codebase Search** (Limited Mode)\n\nQuery: '{arguments.get('query')}'\n\n⚠️ **RAG engine not available** - Cannot perform semantic search.\n\nFor full search capabilities, ensure the RAG engine is running.",
                "generate_code": f"💻 **Code Generation** (Limited Mode)\n\nRequirements: {arguments.get('requirements')}\n\n⚠️ **RAG engine not available** - Cannot generate contextual code.\n\nFor full generation capabilities, ensure the RAG engine is running.",
                "explain_code": f"📚 **Code Explanation** (Limited Mode)\n\nCode: `{arguments.get('code', '')[:100]}...`\n\n⚠️ **RAG engine not available** - Cannot provide detailed explanation.\n\nFor full explanation capabilities, ensure the RAG engine is running.",
                "refactor_code": f"🔧 **Code Refactoring** (Limited Mode)\n\n⚠️ **RAG engine not available** - Cannot analyze for improvements.\n\nFor full refactoring suggestions, ensure the RAG engine is running.",
                "find_similar_code": f"🔎 **Similar Code Search** (Limited Mode)\n\n⚠️ **RAG engine not available** - Cannot perform similarity search.\n\nFor full similarity search, ensure the RAG engine is running."
            }
            
            result = fallback_responses.get(tool_name, f"Tool '{tool_name}' not available without RAG engine.")
        else:
            # Use full RAG capabilities
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
                # Enhanced with codebase context
                context = arguments.get("context", "")
                if arguments.get("use_codebase_context", True):
                    # Search for relevant code examples
                    search_results = await rag_engine.search_codebase(
                        query=arguments.get("requirements"),
                        limit=3
                    )
                    if search_results:
                        context += f"\n\nRelevant code examples from codebase:\n{search_results}"
                
                result = await rag_engine.generate_code(
                    requirements=arguments.get("requirements"),
                    language=arguments.get("language"),
                    context=context
                )
            elif tool_name == "explain_code":
                result = await rag_engine.explain_code(
                    code=arguments.get("code"),
                    level=arguments.get("level", "intermediate")
                )
            elif tool_name == "refactor_code":
                # Custom refactoring logic using RAG
                code = arguments.get("code")
                language = arguments.get("language")
                focus = arguments.get("focus", "all")
                
                # Search for similar code patterns for context
                similar_code = await rag_engine.search_codebase(
                    query=f"refactor improve {language} {code[:100]}",
                    limit=3
                )
                
                context = ""
                if similar_code:
                    context = f"\n\nSimilar code patterns in codebase:\n{similar_code}"
                
                prompt = f"""Analyze and suggest refactoring improvements for this {language or 'code'} focusing on {focus}:

```{language or ''}
{code}
```

{context}

Please provide:
1. **Current Issues**: What could be improved
2. **Refactored Code**: Improved version with explanations
3. **Benefits**: Why these changes are better
4. **Considerations**: Potential risks or trade-offs

Focus area: {focus}"""

                result = await rag_engine._generate_response(prompt, "")
                
            elif tool_name == "find_similar_code":
                # Find similar code patterns
                code = arguments.get("code")
                threshold = arguments.get("similarity_threshold", 0.7)
                limit = arguments.get("limit", 5)
                
                # Use semantic search to find similar patterns
                result = await rag_engine.search_codebase(
                    query=f"code similar to: {code[:200]}",
                    limit=limit
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
    resources = [
        {
            "uri": "codebase://",
            "name": "Codebase",
            "description": "Access to the indexed codebase",
            "mimeType": "application/json"
        },
        {
            "uri": "stats://",
            "name": "System Statistics",
            "description": "RAG system statistics and health",
            "mimeType": "application/json"
        }
    ]
    
    if rag_engine:
        try:
            collections = await rag_engine.list_collections()
            for collection in collections:
                resources.append({
                    "uri": f"collection://{collection}",
                    "name": f"Collection: {collection}",
                    "description": f"Documents in {collection} collection",
                    "mimeType": "application/json"
                })
        except:
            pass
    
    return {"resources": resources}

async def handle_resource_read(params: Dict[str, Any]) -> Dict[str, Any]:
    """Read resource content"""
    uri = params.get("uri")
    
    if uri == "codebase://":
        if rag_engine:
            stats = await rag_engine.get_codebase_stats()
        else:
            stats = {"status": "RAG engine not available"}
        
        return {
            "contents": [
                {
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": json.dumps(stats, indent=2)
                }
            ]
        }
    elif uri == "stats://":
        stats = await get_stats()
        return {
            "contents": [
                {
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": json.dumps(stats, indent=2)
                }
            ]
        }
    elif uri.startswith("collection://"):
        collection_name = uri.replace("collection://", "")
        if rag_engine:
            try:
                count = await rag_engine.get_collection_count(collection_name)
                info = {
                    "collection": collection_name,
                    "document_count": count,
                    "status": "available"
                }
            except:
                info = {"collection": collection_name, "status": "not found"}
        else:
            info = {"collection": collection_name, "status": "RAG engine not available"}
        
        return {
            "contents": [
                {
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": json.dumps(info, indent=2)
                }
            ]
        }
    
    raise HTTPException(status_code=404, detail=f"Resource not found: {uri}")

async def handle_prompts_list() -> Dict[str, Any]:
    """List available prompts"""
    prompts = [
        {
            "name": "code_review",
            "description": "Comprehensive code review with suggestions",
            "arguments": [
                {"name": "code", "description": "Code to review", "required": True},
                {"name": "language", "description": "Programming language", "required": False}
            ]
        },
        {
            "name": "architecture_analysis",
            "description": "Analyze code architecture and design patterns",
            "arguments": [
                {"name": "codebase_query", "description": "Query to find relevant code", "required": True}
            ]
        }
    ]
    
    return {"prompts": prompts}

async def handle_prompt_get(params: Dict[str, Any]) -> Dict[str, Any]:
    """Get a specific prompt"""
    prompt_name = params.get("name")
    arguments = params.get("arguments", {})
    
    if prompt_name == "code_review":
        code = arguments.get("code", "")
        language = arguments.get("language", "")
        
        prompt_text = f"""Please perform a comprehensive code review of this {language} code:

```{language}
{code}
```

Focus on:
1. Code quality and best practices
2. Potential bugs or issues
3. Performance considerations
4. Security concerns
5. Maintainability and readability
6. Suggestions for improvement

Provide specific, actionable feedback."""

    elif prompt_name == "architecture_analysis":
        query = arguments.get("codebase_query", "")
        prompt_text = f"""Analyze the architecture and design patterns in the codebase related to: {query}

Please examine:
1. Overall architecture patterns
2. Design principles being followed
3. Code organization and structure
4. Dependencies and coupling
5. Potential improvements
6. Scalability considerations"""

    else:
        raise HTTPException(status_code=404, detail=f"Prompt not found: {prompt_name}")
    
    return {
        "description": f"Generated prompt for {prompt_name}",
        "messages": [
            {
                "role": "user",
                "content": {
                    "type": "text",
                    "text": prompt_text
                }
            }
        ]
    }

if __name__ == "__main__":
    port = int(os.getenv("CODE_ASSISTANT_PORT", 8080))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )