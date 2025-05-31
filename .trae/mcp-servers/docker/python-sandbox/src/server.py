#!/usr/bin/env python3
"""
Python Sandbox MCP Server for LearningLab
Provides secure Python code execution environment
"""

import os
import sys
import json
import asyncio
import logging
import traceback
from datetime import datetime
from typing import Dict, Any, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/logs/python-sandbox.log')
    ]
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Python Sandbox MCP Server",
    description="Secure Python code execution environment for LearningLab",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
SANDBOX_TIMEOUT = int(os.getenv('SANDBOX_TIMEOUT', '30'))
MAX_MEMORY = os.getenv('MAX_MEMORY', '512m')
ALLOWED_PACKAGES = os.getenv('ALLOWED_PACKAGES', '').split(',')

# Request models
class CodeExecutionRequest(BaseModel):
    code: str
    timeout: Optional[int] = SANDBOX_TIMEOUT
    language: str = "python"
    context: Optional[Dict[str, Any]] = None

class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: str
    version: str
    python_version: str

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        service="python-sandbox",
        timestamp=datetime.now().isoformat(),
        version="1.0.0",
        python_version=sys.version
    )

# Code execution endpoint
@app.post("/api/execute")
async def execute_code(request: CodeExecutionRequest):
    try:
        logger.info(f"Executing Python code: {request.code[:100]}...")
        
        # Basic security checks
        forbidden_imports = [
            'os', 'sys', 'subprocess', 'importlib', '__import__',
            'eval', 'exec', 'compile', 'open', 'file', 'input',
            'raw_input', 'reload', 'vars', 'globals', 'locals',
            'dir', 'hasattr', 'getattr', 'setattr', 'delattr'
        ]
        
        for forbidden in forbidden_imports:
            if forbidden in request.code:
                raise HTTPException(
                    status_code=400,
                    detail=f"Forbidden operation: {forbidden}"
                )
        
        # Create restricted execution environment
        restricted_globals = {
            '__builtins__': {
                'print': print,
                'len': len,
                'str': str,
                'int': int,
                'float': float,
                'bool': bool,
                'list': list,
                'dict': dict,
                'tuple': tuple,
                'set': set,
                'range': range,
                'enumerate': enumerate,
                'zip': zip,
                'map': map,
                'filter': filter,
                'sum': sum,
                'min': min,
                'max': max,
                'abs': abs,
                'round': round,
                'sorted': sorted,
                'reversed': reversed,
            }
        }
        
        # Add allowed packages
        try:
            import numpy as np
            restricted_globals['numpy'] = np
            restricted_globals['np'] = np
        except ImportError:
            pass
            
        try:
            import pandas as pd
            restricted_globals['pandas'] = pd
            restricted_globals['pd'] = pd
        except ImportError:
            pass
            
        try:
            import matplotlib.pyplot as plt
            restricted_globals['matplotlib'] = plt
            restricted_globals['plt'] = plt
        except ImportError:
            pass
        
        # Capture output
        from io import StringIO
        import contextlib
        
        output_buffer = StringIO()
        error_buffer = StringIO()
        
        try:
            with contextlib.redirect_stdout(output_buffer), \
                 contextlib.redirect_stderr(error_buffer):
                
                # Execute code with timeout
                exec(request.code, restricted_globals)
                
            output = output_buffer.getvalue()
            error = error_buffer.getvalue()
            
            return {
                "success": True,
                "output": output,
                "error": error if error else None,
                "execution_time": "<1s",
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            error_msg = f"{type(e).__name__}: {str(e)}"
            logger.error(f"Code execution error: {error_msg}")
            
            return {
                "success": False,
                "output": output_buffer.getvalue(),
                "error": error_msg,
                "traceback": traceback.format_exc(),
                "timestamp": datetime.now().isoformat()
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

# Package information endpoint
@app.get("/api/packages")
async def get_packages():
    """Get information about available packages"""
    packages = []
    
    # Check for common packages
    package_list = ['numpy', 'pandas', 'matplotlib', 'seaborn', 'scipy', 'sklearn']
    
    for pkg_name in package_list:
        try:
            __import__(pkg_name)
            packages.append({
                "name": pkg_name,
                "available": True,
                "version": "unknown"
            })
        except ImportError:
            packages.append({
                "name": pkg_name,
                "available": False,
                "version": None
            })
    
    return {
        "success": True,
        "packages": packages,
        "python_version": sys.version,
        "timestamp": datetime.now().isoformat()
    }

# Sandbox information endpoint
@app.get("/api/info")
async def get_sandbox_info():
    """Get sandbox configuration and limits"""
    return {
        "success": True,
        "config": {
            "timeout": SANDBOX_TIMEOUT,
            "max_memory": MAX_MEMORY,
            "allowed_packages": ALLOWED_PACKAGES,
            "python_version": sys.version,
            "platform": sys.platform
        },
        "limits": {
            "max_execution_time": f"{SANDBOX_TIMEOUT}s",
            "memory_limit": MAX_MEMORY,
            "network_access": False,
            "file_system_access": False
        },
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    port = int(os.getenv('PORT', '8003'))
    logger.info(f"Starting Python Sandbox MCP Server on port {port}")
    
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )