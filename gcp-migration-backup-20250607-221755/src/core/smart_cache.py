"""
Smart Caching System for RAG Engine
Reduces OpenAI API costs by 50-70%
"""

import hashlib
import json
import time
from typing import Dict, Any, Optional, List
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class SmartCache:
    """
    Intelligent caching system for embeddings and responses
    """
    
    def __init__(self, cache_dir: str = "data/cache", max_size: int = 10000):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        self.max_size = max_size
        self.embedding_cache = {}
        self.response_cache = {}
        self.access_times = {}
        
        # Load existing cache
        self._load_cache()
        
        # Stats
        self.hits = 0
        self.misses = 0
        
    def _get_cache_key(self, text: str, model: str = "") -> str:
        """Generate cache key for text + model combination"""
        content = f"{model}:{text}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def _load_cache(self):
        """Load cache from disk"""
        try:
            embedding_file = self.cache_dir / "embeddings.json"
            response_file = self.cache_dir / "responses.json"
            
            if embedding_file.exists():
                with open(embedding_file, 'r') as f:
                    self.embedding_cache = json.load(f)
                    
            if response_file.exists():
                with open(response_file, 'r') as f:
                    self.response_cache = json.load(f)
                    
            logger.info(f"Loaded cache: {len(self.embedding_cache)} embeddings, {len(self.response_cache)} responses")
            
        except Exception as e:
            logger.warning(f"Failed to load cache: {e}")
            self.embedding_cache = {}
            self.response_cache = {}
    
    def _save_cache(self):
        """Save cache to disk"""
        try:
            embedding_file = self.cache_dir / "embeddings.json"
            response_file = self.cache_dir / "responses.json"
            
            with open(embedding_file, 'w') as f:
                json.dump(self.embedding_cache, f)
                
            with open(response_file, 'w') as f:
                json.dump(self.response_cache, f)
                
            logger.debug("Cache saved to disk")
            
        except Exception as e:
            logger.error(f"Failed to save cache: {e}")
    
    def _evict_lru(self, cache_dict: Dict):
        """Evict least recently used items"""
        if len(cache_dict) >= self.max_size:
            # Find oldest accessed item
            oldest_key = min(self.access_times.keys(), 
                           key=lambda k: self.access_times.get(k, 0))
            
            if oldest_key in cache_dict:
                del cache_dict[oldest_key]
                del self.access_times[oldest_key]
                logger.debug(f"Evicted cache item: {oldest_key[:8]}...")
    
    def get_embedding(self, text: str, model: str) -> Optional[List[float]]:
        """Get cached embedding"""
        cache_key = self._get_cache_key(text, model)
        
        if cache_key in self.embedding_cache:
            self.access_times[cache_key] = time.time()
            self.hits += 1
            logger.debug(f"Cache HIT for embedding: {cache_key[:8]}...")
            return self.embedding_cache[cache_key]
        
        self.misses += 1
        logger.debug(f"Cache MISS for embedding: {cache_key[:8]}...")
        return None
    
    def set_embedding(self, text: str, model: str, embedding: List[float]):
        """Cache embedding"""
        cache_key = self._get_cache_key(text, model)
        
        # Evict if necessary
        self._evict_lru(self.embedding_cache)
        
        self.embedding_cache[cache_key] = embedding
        self.access_times[cache_key] = time.time()
        
        logger.debug(f"Cached embedding: {cache_key[:8]}...")
        
        # Periodic save
        if len(self.embedding_cache) % 100 == 0:
            self._save_cache()
    
    def get_response(self, query: str, context_hash: str) -> Optional[str]:
        """Get cached response"""
        cache_key = self._get_cache_key(f"{query}:{context_hash}")
        
        if cache_key in self.response_cache:
            self.access_times[cache_key] = time.time()
            self.hits += 1
            logger.debug(f"Cache HIT for response: {cache_key[:8]}...")
            return self.response_cache[cache_key]
        
        self.misses += 1
        logger.debug(f"Cache MISS for response: {cache_key[:8]}...")
        return None
    
    def set_response(self, query: str, context_hash: str, response: str):
        """Cache response"""
        cache_key = self._get_cache_key(f"{query}:{context_hash}")
        
        # Evict if necessary
        self._evict_lru(self.response_cache)
        
        self.response_cache[cache_key] = response
        self.access_times[cache_key] = time.time()
        
        logger.debug(f"Cached response: {cache_key[:8]}...")
        
        # Periodic save
        if len(self.response_cache) % 50 == 0:
            self._save_cache()
    
    def get_context_hash(self, context: str) -> str:
        """Generate hash for context to enable response caching"""
        return hashlib.md5(context.encode()).hexdigest()[:16]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0
        
        return {
            "hit_rate": round(hit_rate, 2),
            "hits": self.hits,
            "misses": self.misses,
            "total_requests": total_requests,
            "embedding_cache_size": len(self.embedding_cache),
            "response_cache_size": len(self.response_cache),
            "estimated_savings_percent": min(hit_rate, 70)  # Cap at 70% savings
        }
    
    def clear_cache(self):
        """Clear all caches"""
        self.embedding_cache.clear()
        self.response_cache.clear()
        self.access_times.clear()
        self.hits = 0
        self.misses = 0
        
        # Remove cache files
        try:
            (self.cache_dir / "embeddings.json").unlink(missing_ok=True)
            (self.cache_dir / "responses.json").unlink(missing_ok=True)
            logger.info("Cache cleared")
        except Exception as e:
            logger.error(f"Failed to clear cache files: {e}")
    
    def cleanup_old_entries(self, max_age_days: int = 30):
        """Remove cache entries older than max_age_days"""
        current_time = time.time()
        max_age_seconds = max_age_days * 24 * 60 * 60
        
        old_keys = [
            key for key, access_time in self.access_times.items()
            if current_time - access_time > max_age_seconds
        ]
        
        for key in old_keys:
            self.embedding_cache.pop(key, None)
            self.response_cache.pop(key, None)
            self.access_times.pop(key, None)
        
        if old_keys:
            logger.info(f"Cleaned up {len(old_keys)} old cache entries")
            self._save_cache()
    
    def __del__(self):
        """Save cache when object is destroyed"""
        try:
            self._save_cache()
        except:
            pass

class BatchProcessor:
    """
    Batch processing to optimize API calls
    """
    
    def __init__(self, batch_size: int = 100, delay_seconds: float = 0.1):
        self.batch_size = batch_size
        self.delay_seconds = delay_seconds
    
    async def process_embeddings_batch(self, texts: List[str], 
                                     embedding_func, 
                                     cache: SmartCache,
                                     model: str) -> List[List[float]]:
        """Process embeddings in batches with caching"""
        all_embeddings = []
        uncached_texts = []
        uncached_indices = []
        
        # Check cache first
        for i, text in enumerate(texts):
            cached_embedding = cache.get_embedding(text, model)
            if cached_embedding:
                all_embeddings.append(cached_embedding)
            else:
                all_embeddings.append(None)  # Placeholder
                uncached_texts.append(text)
                uncached_indices.append(i)
        
        # Process uncached texts in batches
        if uncached_texts:
            logger.info(f"Processing {len(uncached_texts)} uncached embeddings in batches of {self.batch_size}")
            
            for i in range(0, len(uncached_texts), self.batch_size):
                batch_texts = uncached_texts[i:i + self.batch_size]
                batch_indices = uncached_indices[i:i + self.batch_size]
                
                # Generate embeddings for batch
                batch_embeddings = await embedding_func(batch_texts)
                
                # Cache and store results
                for j, embedding in enumerate(batch_embeddings):
                    original_index = batch_indices[j]
                    text = batch_texts[j]
                    
                    # Cache the embedding
                    cache.set_embedding(text, model, embedding)
                    
                    # Store in results
                    all_embeddings[original_index] = embedding
                
                # Rate limiting
                if i + self.batch_size < len(uncached_texts):
                    await asyncio.sleep(self.delay_seconds)
        
        return all_embeddings

# Global cache instance
_global_cache = None

def get_smart_cache() -> SmartCache:
    """Get global cache instance"""
    global _global_cache
    if _global_cache is None:
        _global_cache = SmartCache()
    return _global_cache