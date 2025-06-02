"""
Query classifier for determining if a query needs retrieval or can be answered directly.
"""

import re
from typing import Dict, List, Tuple, Union


class QueryClassifier:
    """
    Simple keyword-based classifier to determine if a query needs retrieval.
    """

    def __init__(self, config: Dict = None):
        """
        Initialize the classifier with optional configuration.
        
        Args:
            config: Configuration dictionary with optional keys:
                - threshold: Confidence threshold (default: 0.8)
                - sufficient_keywords: List of keywords indicating no retrieval needed
                - insufficient_keywords: List of keywords indicating retrieval needed
        """
        self.config = config or {}
        self.threshold = self.config.get("threshold", 0.8)
        
        # Default keywords indicating a query can be answered without retrieval
        self.sufficient_keywords = self.config.get("sufficient_keywords", [
            "what is your name", "hello", "how are you", "who are you",
            "thanks", "thank you", "goodbye", "bye", "help"
        ])
        
        # Default keywords indicating a query needs retrieval
        self.insufficient_keywords = self.config.get("insufficient_keywords", [
            "how to", "explain", "what is the code for", "find file",
            "where is", "show me", "search for", "look up", "find",
            "code", "function", "class", "method", "implementation",
            "example", "documentation", "api", "usage", "syntax"
        ])

    def classify(self, query_text: str) -> Tuple[str, float]:
        """
        Classify a query as 'sufficient' (can be answered directly) or 
        'insufficient' (needs retrieval).
        
        Args:
            query_text: The query text to classify
            
        Returns:
            Tuple of (classification, confidence) where:
                - classification is 'sufficient' or 'insufficient'
                - confidence is a float between 0 and 1
        """
        query_lower = query_text.lower()
        
        # Check for exact matches in sufficient keywords
        for keyword in self.sufficient_keywords:
            if keyword in query_lower:
                return "sufficient", 0.9
        
        # Check for exact matches in insufficient keywords
        for keyword in self.insufficient_keywords:
            if keyword in query_lower:
                return "insufficient", 0.9
        
        # More complex heuristics
        
        # Check for question patterns that likely need retrieval
        question_patterns = [
            r"^(what|how|where|when|why|who|which).*\?$",  # WH-questions
            r"^can you (show|find|search|look|get).*",     # Requests for retrieval
            r"^(show|find|search|look|get) .*",            # Direct retrieval commands
        ]
        
        for pattern in question_patterns:
            if re.search(pattern, query_lower):
                return "insufficient", 0.8
        
        # Length-based heuristic: longer queries likely need retrieval
        words = query_lower.split()
        if len(words) > 5:
            return "insufficient", 0.7
        
        # Default to sufficient for very short queries
        if len(words) <= 2:
            return "sufficient", 0.6
            
        # If we're unsure, default to insufficient (safer)
        return "insufficient", 0.5
        
    def needs_retrieval(self, query_text: str) -> bool:
        """
        Convenience method that returns True if the query needs retrieval.
        
        Args:
            query_text: The query text to classify
            
        Returns:
            Boolean indicating if retrieval is needed
        """
        classification, confidence = self.classify(query_text)
        return classification == "insufficient" and confidence >= self.threshold


# Example usage
if __name__ == "__main__":
    classifier = QueryClassifier()
    
    test_queries = [
        "Hello, how are you?",
        "What is your name?",
        "How do I implement a RAG pipeline?",
        "Find all files related to authentication",
        "Show me the code for the login function",
        "Thanks for your help",
        "What's the weather like?",
        "Where is the database configuration stored?",
    ]
    
    for query in test_queries:
        classification, confidence = classifier.classify(query)
        needs_retrieval = classifier.needs_retrieval(query)
        print(f"Query: '{query}'")
        print(f"  Classification: {classification} (confidence: {confidence:.2f})")
        print(f"  Needs retrieval: {needs_retrieval}")
        print()