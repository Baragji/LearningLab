"""Enhanced error handling for MCP Enterprise server"""

import logging
import traceback
from typing import Dict, Any, Optional
from enum import Enum
import json

logger = logging.getLogger(__name__)

class ErrorCode(Enum):
    """Standard error codes for MCP Enterprise"""
    # Authentication errors
    INVALID_TOKEN = "INVALID_TOKEN"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    UNAUTHORIZED = "UNAUTHORIZED"
    
    # Rate limiting errors
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    
    # RAG engine errors
    RAG_INITIALIZATION_FAILED = "RAG_INITIALIZATION_FAILED"
    EMBEDDING_GENERATION_FAILED = "EMBEDDING_GENERATION_FAILED"
    VECTOR_SEARCH_FAILED = "VECTOR_SEARCH_FAILED"
    LLM_RESPONSE_FAILED = "LLM_RESPONSE_FAILED"
    
    # OpenAI API errors
    OPENAI_API_ERROR = "OPENAI_API_ERROR"
    OPENAI_QUOTA_EXCEEDED = "OPENAI_QUOTA_EXCEEDED"
    OPENAI_INVALID_REQUEST = "OPENAI_INVALID_REQUEST"
    
    # ChromaDB errors
    CHROMADB_CONNECTION_FAILED = "CHROMADB_CONNECTION_FAILED"
    CHROMADB_QUERY_FAILED = "CHROMADB_QUERY_FAILED"
    CHROMADB_INSERT_FAILED = "CHROMADB_INSERT_FAILED"
    
    # General errors
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    INVALID_REQUEST = "INVALID_REQUEST"
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    VALIDATION_ERROR = "VALIDATION_ERROR"

class MCPError(Exception):
    """Base exception class for MCP Enterprise errors"""
    
    def __init__(self, 
                 code: ErrorCode, 
                 message: str, 
                 details: Optional[Dict[str, Any]] = None,
                 original_error: Optional[Exception] = None):
        self.code = code
        self.message = message
        self.details = details or {}
        self.original_error = original_error
        super().__init__(message)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary for JSON-RPC response"""
        error_dict = {
            "code": self.code.value,
            "message": self.message,
            "data": self.details
        }
        
        if self.original_error:
            error_dict["data"]["original_error"] = str(self.original_error)
            error_dict["data"]["traceback"] = traceback.format_exc()
        
        return error_dict
    
    def to_json_rpc_error(self, request_id: Optional[str] = None) -> Dict[str, Any]:
        """Convert to JSON-RPC 2.0 error response"""
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "error": self.to_dict()
        }

class AuthenticationError(MCPError):
    """Authentication related errors"""
    pass

class RateLimitError(MCPError):
    """Rate limiting errors"""
    pass

class RAGEngineError(MCPError):
    """RAG engine related errors"""
    pass

class OpenAIError(MCPError):
    """OpenAI API related errors"""
    pass

class ChromaDBError(MCPError):
    """ChromaDB related errors"""
    pass

class ValidationError(MCPError):
    """Request validation errors"""
    pass

class ErrorHandler:
    """Centralized error handling for MCP Enterprise"""
    
    def __init__(self, enable_debug: bool = False):
        self.enable_debug = enable_debug
        self.logger = logging.getLogger(__name__)
    
    def handle_openai_error(self, error: Exception) -> MCPError:
        """Handle OpenAI API errors"""
        error_message = str(error)
        
        # Check for specific OpenAI error types
        if "quota" in error_message.lower() or "billing" in error_message.lower():
            return OpenAIError(
                code=ErrorCode.OPENAI_QUOTA_EXCEEDED,
                message="OpenAI API quota exceeded",
                details={"suggestion": "Check your OpenAI billing and usage limits"},
                original_error=error
            )
        elif "invalid" in error_message.lower() or "bad request" in error_message.lower():
            return OpenAIError(
                code=ErrorCode.OPENAI_INVALID_REQUEST,
                message="Invalid request to OpenAI API",
                details={"suggestion": "Check your request parameters"},
                original_error=error
            )
        else:
            return OpenAIError(
                code=ErrorCode.OPENAI_API_ERROR,
                message=f"OpenAI API error: {error_message}",
                original_error=error
            )
    
    def handle_chromadb_error(self, error: Exception, operation: str = "unknown") -> MCPError:
        """Handle ChromaDB errors"""
        error_message = str(error)
        
        if "connection" in error_message.lower() or "connect" in error_message.lower():
            return ChromaDBError(
                code=ErrorCode.CHROMADB_CONNECTION_FAILED,
                message="Failed to connect to ChromaDB",
                details={
                    "operation": operation,
                    "suggestion": "Check ChromaDB service status and configuration"
                },
                original_error=error
            )
        elif operation == "query":
            return ChromaDBError(
                code=ErrorCode.CHROMADB_QUERY_FAILED,
                message="ChromaDB query failed",
                details={"suggestion": "Check query parameters and collection status"},
                original_error=error
            )
        elif operation == "insert":
            return ChromaDBError(
                code=ErrorCode.CHROMADB_INSERT_FAILED,
                message="ChromaDB insert failed",
                details={"suggestion": "Check document format and collection permissions"},
                original_error=error
            )
        else:
            return ChromaDBError(
                code=ErrorCode.CHROMADB_CONNECTION_FAILED,
                message=f"ChromaDB error during {operation}: {error_message}",
                details={"operation": operation},
                original_error=error
            )
    
    def handle_rag_error(self, error: Exception, operation: str = "unknown") -> MCPError:
        """Handle RAG engine errors"""
        error_message = str(error)
        
        if "embedding" in error_message.lower():
            return RAGEngineError(
                code=ErrorCode.EMBEDDING_GENERATION_FAILED,
                message="Failed to generate embeddings",
                details={
                    "operation": operation,
                    "suggestion": "Check OpenAI API key and model availability"
                },
                original_error=error
            )
        elif "search" in error_message.lower() or "query" in error_message.lower():
            return RAGEngineError(
                code=ErrorCode.VECTOR_SEARCH_FAILED,
                message="Vector search failed",
                details={
                    "operation": operation,
                    "suggestion": "Check ChromaDB connection and collection status"
                },
                original_error=error
            )
        elif "llm" in error_message.lower() or "response" in error_message.lower():
            return RAGEngineError(
                code=ErrorCode.LLM_RESPONSE_FAILED,
                message="LLM response generation failed",
                details={
                    "operation": operation,
                    "suggestion": "Check OpenAI API status and model availability"
                },
                original_error=error
            )
        else:
            return RAGEngineError(
                code=ErrorCode.RAG_INITIALIZATION_FAILED,
                message=f"RAG engine error during {operation}: {error_message}",
                details={"operation": operation},
                original_error=error
            )
    
    def handle_validation_error(self, message: str, details: Optional[Dict[str, Any]] = None) -> ValidationError:
        """Handle request validation errors"""
        return ValidationError(
            code=ErrorCode.VALIDATION_ERROR,
            message=message,
            details=details or {}
        )
    
    def handle_authentication_error(self, message: str, details: Optional[Dict[str, Any]] = None) -> AuthenticationError:
        """Handle authentication errors"""
        return AuthenticationError(
            code=ErrorCode.UNAUTHORIZED,
            message=message,
            details=details or {}
        )
    
    def handle_rate_limit_error(self, message: str, details: Optional[Dict[str, Any]] = None) -> RateLimitError:
        """Handle rate limiting errors"""
        return RateLimitError(
            code=ErrorCode.RATE_LIMIT_EXCEEDED,
            message=message,
            details=details or {}
        )
    
    def handle_generic_error(self, error: Exception, context: str = "unknown") -> MCPError:
        """Handle generic errors"""
        self.logger.error(f"Unhandled error in {context}: {error}", exc_info=True)
        
        return MCPError(
            code=ErrorCode.INTERNAL_SERVER_ERROR,
            message="Internal server error",
            details={
                "context": context,
                "error_type": type(error).__name__
            },
            original_error=error
        )
    
    def log_error(self, error: MCPError, request_context: Optional[Dict[str, Any]] = None):
        """Log error with context"""
        log_data = {
            "error_code": error.code.value,
            "error_message": error.message,
            "error_details": error.details
        }
        
        if request_context:
            log_data["request_context"] = request_context
        
        if self.enable_debug and error.original_error:
            log_data["traceback"] = traceback.format_exc()
        
        self.logger.error(f"MCP Error: {json.dumps(log_data, indent=2)}")

# Global error handler instance
error_handler = ErrorHandler()

# Convenience functions
def handle_openai_error(error: Exception) -> MCPError:
    return error_handler.handle_openai_error(error)

def handle_chromadb_error(error: Exception, operation: str = "unknown") -> MCPError:
    return error_handler.handle_chromadb_error(error, operation)

def handle_rag_error(error: Exception, operation: str = "unknown") -> MCPError:
    return error_handler.handle_rag_error(error, operation)

def handle_validation_error(message: str, details: Optional[Dict[str, Any]] = None) -> ValidationError:
    return error_handler.handle_validation_error(message, details)

def handle_authentication_error(message: str, details: Optional[Dict[str, Any]] = None) -> AuthenticationError:
    return error_handler.handle_authentication_error(message, details)

def handle_rate_limit_error(message: str, details: Optional[Dict[str, Any]] = None) -> RateLimitError:
    return error_handler.handle_rate_limit_error(message, details)

def handle_generic_error(error: Exception, context: str = "unknown") -> MCPError:
    return error_handler.handle_generic_error(error, context)
