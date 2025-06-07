#!/bin/bash
# MCP Server Wrapper for Trae compatibility
# This script wraps the Python MCP server to work with Trae

# Set working directory
cd "$(dirname "$0")"

# Add src to Python path
export PYTHONPATH="$PWD/src:$PYTHONPATH"

# Run the MCP server
exec python3 src/api/mcp_server_stdio.py "$@"