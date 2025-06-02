import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from typing import List, Dict, Any

class CrossEncoderReranker:
    def __init__(self, model_name="cross-encoder/ms-marco-MiniLM-L-6-v2"):
        """
        Initialiser en CrossEncoder reranker med GPU-support hvis tilgængelig.
        
        Args:
            model_name: Navn på cross-encoder modellen at bruge
        """
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🖥️ Bruger {self.device} til reranking")
        
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_name).to(self.device).eval()
    
    def rerank(self, query: str, chunks: List[str]) -> List[Dict[str, Any]]:
        """
        Reranker chunks baseret på deres relevans til query.
        
        Args:
            query: Forespørgselstekst
            chunks: Liste af tekstchunks at rerangere
            
        Returns:
            Liste af dicts med chunks og scores, sorteret efter relevans
        """
        inputs = self.tokenizer(
            [f"{query} [SEP] {chunk}" for chunk in chunks],
            return_tensors="pt",
            padding=True,
            truncation=True,
        ).to(self.device)
        
        with torch.no_grad():
            scores = self.model(**inputs).logits.squeeze(-1).cpu().tolist()
        
        ranked = sorted(zip(chunks, scores), key=lambda x: x[1], reverse=True)
        return [{"chunk": c, "score": s} for c, s in ranked]
    
    def rerank_results(self, query: str, results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Reranker resultater fra vector search.
        
        Args:
            query: Forespørgselstekst
            results: Liste af resultater fra vector search
            
        Returns:
            Rerangerede resultater
        """
        if not results:
            return []
        
        # Udtræk chunks fra resultater
        chunks = [r["chunk"] for r in results]
        
        # Reranker chunks
        reranked = self.rerank(query, chunks)
        
        # Map rerangerede chunks tilbage til originale resultater
        chunk_to_result = {r["chunk"]: r for r in results}
        final_results = []
        
        for item in reranked:
            chunk = item["chunk"]
            original = chunk_to_result[chunk].copy()
            original["cross_encoder_score"] = item["score"]
            final_results.append(original)
        
        return final_results