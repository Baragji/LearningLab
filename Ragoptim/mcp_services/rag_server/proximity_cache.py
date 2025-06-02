import numpy as np
from typing import Dict, List, Any, Optional, Tuple

class ProximityCache:
    def __init__(self, threshold: float = 0.8, max_size: int = 100):
        """
        Initialiser en Proximity Cache.
        
        Args:
            threshold: Kosinus-lighedsgrænse for at betragte to forespørgsler som lignende (0.0-1.0)
            max_size: Maksimalt antal forespørgsler at gemme i cachen
        """
        self.threshold = threshold
        self.max_size = max_size
        self.cache: Dict[str, Tuple[np.ndarray, Any]] = {}
    
    def query(self, query_vector: np.ndarray, query_id: Optional[str] = None) -> Optional[Any]:
        """
        Søg i cachen efter lignende forespørgsler.
        
        Args:
            query_vector: Embedding-vektor for forespørgslen
            query_id: Valgfri ID for forespørgslen
            
        Returns:
            Cached resultater hvis en lignende forespørgsel findes, ellers None
        """
        # Normaliser forespørgselsvektor
        query_vector = query_vector / np.linalg.norm(query_vector)
        
        # Søg efter lignende forespørgsler i cachen
        for cache_id, (cached_vector, results) in self.cache.items():
            # Beregn kosinus-lighed
            similarity = np.dot(query_vector, cached_vector)
            
            if similarity >= self.threshold:
                print(f"Cache hit! Similarity: {similarity:.4f}")
                return results
        
        return None
    
    def store(self, query_vector: np.ndarray, results: Any, query_id: Optional[str] = None) -> None:
        """
        Gem resultater i cachen.
        
        Args:
            query_vector: Embedding-vektor for forespørgslen
            results: Resultater at gemme
            query_id: Valgfri ID for forespørgslen
        """
        # Normaliser forespørgselsvektor
        query_vector = query_vector / np.linalg.norm(query_vector)
        
        # Generer et ID hvis ikke angivet
        if query_id is None:
            query_id = f"query_{len(self.cache)}"
        
        # Hvis cachen er fuld, fjern den ældste indgang
        if len(self.cache) >= self.max_size:
            oldest_key = next(iter(self.cache))
            del self.cache[oldest_key]
        
        # Gem resultater i cachen
        self.cache[query_id] = (query_vector, results)
        
    def get_stats(self):
        """
        Returner statistik om cachen.
        
        Returns:
            Dict med cache-statistik
        """
        return {
            "size": len(self.cache),
            "max_size": self.max_size,
            "threshold": self.threshold
        }