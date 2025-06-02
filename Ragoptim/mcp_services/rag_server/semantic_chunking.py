from sentence_transformers import SentenceTransformer
import numpy as np
import torch

def semantic_chunk(text, min_size=200, max_size=500, model=None):
    """
    Opdel tekst i semantisk meningsfulde chunks.
    
    Args:
        text: Tekst at opdele
        min_size: Minimum chunk-størrelse
        max_size: Maksimum chunk-størrelse
        model: SentenceTransformer-model til embedding
        
    Returns:
        Liste af semantisk meningsfulde chunks
    """
    # Tjek om GPU er tilgængelig
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    if model is None:
        model = SentenceTransformer("all-MiniLM-L6-v2", device=device)
    
    # Del tekst i sætninger eller linjer
    lines = text.split('\n')
    
    # Hvis teksten er kortere end min_size, returner den som en enkelt chunk
    if len(text) < min_size:
        return [text]
    
    chunks = []
    current_chunk = []
    current_size = 0
    
    # Beregn embeddings for hver linje
    line_embeddings = model.encode(lines, batch_size=32, show_progress_bar=False)
    
    # Normaliser embeddings
    line_embeddings = line_embeddings / np.linalg.norm(line_embeddings, axis=1, keepdims=True)
    
    for i, line in enumerate(lines):
        # Hvis linjen er tom, fortsæt
        if not line.strip():
            continue
        
        # Hvis current_chunk er tom, tilføj linjen
        if not current_chunk:
            current_chunk.append(line)
            current_size += len(line)
            continue
        
        # Beregn lighed mellem nuværende linje og sidste linje i current_chunk
        similarity = np.dot(line_embeddings[i], line_embeddings[i-1])
        
        # Hvis ligheden er høj og chunk-størrelsen er under max_size, tilføj til nuværende chunk
        if similarity > 0.7 and current_size + len(line) < max_size:
            current_chunk.append(line)
            current_size += len(line)
        # Ellers start en ny chunk
        else:
            chunks.append('\n'.join(current_chunk))
            current_chunk = [line]
            current_size = len(line)
    
    # Tilføj den sidste chunk
    if current_chunk:
        chunks.append('\n'.join(current_chunk))
    
    return chunks