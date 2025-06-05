"""Bearer token authentication for MCP Enterprise server."""

import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import jwt
from functools import wraps

logger = logging.getLogger(__name__)

class BearerTokenAuth:
    """
    Bearer token authentication handler for enterprise MCP server
    """
    
    def __init__(self, 
                 secret_key: Optional[str] = None,
                 token_expiry_hours: int = 24,
                 enable_jwt: bool = True):
        
        self.secret_key = secret_key or os.getenv("MCP_SECRET_KEY", "default-secret-change-in-production")
        self.token_expiry_hours = token_expiry_hours
        self.enable_jwt = enable_jwt
        
        # Simple token store for demo (use Redis in production)
        self._valid_tokens = set()
        
        # Load valid tokens from environment
        env_tokens = os.getenv("MCP_VALID_TOKENS", "")
        if env_tokens:
            self._valid_tokens.update(env_tokens.split(","))
        
        logger.info(f"Bearer auth initialized with {len(self._valid_tokens)} pre-configured tokens")
    
    def generate_token(self, 
                      client_id: str, 
                      permissions: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate a new bearer token for a client
        """
        if self.enable_jwt:
            payload = {
                "client_id": client_id,
                "permissions": permissions or {},
                "iat": datetime.utcnow(),
                "exp": datetime.utcnow() + timedelta(hours=self.token_expiry_hours)
            }
            
            token = jwt.encode(payload, self.secret_key, algorithm="HS256")
            logger.info(f"Generated JWT token for client: {client_id}")
            return token
        else:
            # Simple token generation for demo
            import secrets
            token = f"mcp_{client_id}_{secrets.token_urlsafe(32)}"
            self._valid_tokens.add(token)
            logger.info(f"Generated simple token for client: {client_id}")
            return token
    
    def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Validate a bearer token and return client info
        """
        if not token:
            return None
        
        # Remove 'Bearer ' prefix if present
        if token.startswith("Bearer "):
            token = token[7:]
        
        if self.enable_jwt:
            try:
                payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
                
                # Check expiration
                if datetime.utcnow() > datetime.fromtimestamp(payload["exp"]):
                    logger.warning("Token expired")
                    return None
                
                logger.debug(f"Valid JWT token for client: {payload.get('client_id')}")
                return payload
                
            except jwt.InvalidTokenError as e:
                logger.warning(f"Invalid JWT token: {e}")
                return None
        else:
            # Simple token validation
            if token in self._valid_tokens:
                # Extract client_id from simple token format
                parts = token.split("_")
                client_id = parts[1] if len(parts) > 1 else "unknown"
                
                logger.debug(f"Valid simple token for client: {client_id}")
                return {
                    "client_id": client_id,
                    "permissions": {},
                    "token_type": "simple"
                }
            else:
                logger.warning("Invalid simple token")
                return None
    
    def revoke_token(self, token: str) -> bool:
        """
        Revoke a token (for simple tokens only)
        """
        if not self.enable_jwt and token in self._valid_tokens:
            self._valid_tokens.remove(token)
            logger.info("Token revoked")
            return True
        return False
    
    def add_valid_token(self, token: str) -> None:
        """
        Add a token to the valid tokens set (for simple tokens)
        """
        if not self.enable_jwt:
            self._valid_tokens.add(token)
            logger.info("Token added to valid set")

def require_auth(auth_handler: BearerTokenAuth):
    """
    Decorator to require authentication for MCP methods
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract token from request context
            # This would be integrated with the MCP server framework
            token = kwargs.get('auth_token') or getattr(args[0], '_current_token', None)
            
            if not token:
                raise ValueError("Authentication required: No bearer token provided")
            
            client_info = auth_handler.validate_token(token)
            if not client_info:
                raise ValueError("Authentication failed: Invalid or expired token")
            
            # Add client info to kwargs
            kwargs['client_info'] = client_info
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

class RateLimiter:
    """
    Simple rate limiter for enterprise MCP server
    """
    
    def __init__(self, 
                 requests_per_minute: int = 60,
                 requests_per_hour: int = 1000):
        
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        
        # Simple in-memory storage (use Redis in production)
        self._minute_counts = {}
        self._hour_counts = {}
        
        logger.info(f"Rate limiter initialized: {requests_per_minute}/min, {requests_per_hour}/hour")
    
    def is_allowed(self, client_id: str) -> bool:
        """
        Check if client is allowed to make a request
        """
        now = datetime.utcnow()
        minute_key = f"{client_id}:{now.strftime('%Y-%m-%d-%H-%M')}"
        hour_key = f"{client_id}:{now.strftime('%Y-%m-%d-%H')}"
        
        # Check minute limit
        minute_count = self._minute_counts.get(minute_key, 0)
        if minute_count >= self.requests_per_minute:
            logger.warning(f"Rate limit exceeded for {client_id}: {minute_count}/min")
            return False
        
        # Check hour limit
        hour_count = self._hour_counts.get(hour_key, 0)
        if hour_count >= self.requests_per_hour:
            logger.warning(f"Rate limit exceeded for {client_id}: {hour_count}/hour")
            return False
        
        # Increment counters
        self._minute_counts[minute_key] = minute_count + 1
        self._hour_counts[hour_key] = hour_count + 1
        
        # Clean old entries (simple cleanup)
        self._cleanup_old_entries(now)
        
        return True
    
    def _cleanup_old_entries(self, now: datetime) -> None:
        """
        Clean up old rate limit entries
        """
        # Remove entries older than 1 hour
        cutoff_hour = (now - timedelta(hours=1)).strftime('%Y-%m-%d-%H')
        cutoff_minute = (now - timedelta(minutes=1)).strftime('%Y-%m-%d-%H-%M')
        
        # Clean minute counts
        keys_to_remove = [k for k in self._minute_counts.keys() 
                         if k.split(':')[1] < cutoff_minute]
        for key in keys_to_remove:
            del self._minute_counts[key]
        
        # Clean hour counts
        keys_to_remove = [k for k in self._hour_counts.keys() 
                         if k.split(':')[1] < cutoff_hour]
        for key in keys_to_remove:
            del self._hour_counts[key]

def require_rate_limit(rate_limiter: RateLimiter):
    """
    Decorator to enforce rate limiting
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            client_info = kwargs.get('client_info', {})
            client_id = client_info.get('client_id', 'anonymous')
            
            if not rate_limiter.is_allowed(client_id):
                raise ValueError(f"Rate limit exceeded for client: {client_id}")
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator
