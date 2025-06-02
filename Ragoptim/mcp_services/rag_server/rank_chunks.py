import os
import re
from datetime import datetime
from typing import List, Dict, Any
import ast


def extract_imports(filepath: str) -> set:
    """
    Ekstraherer imports fra en fil (Python via AST, ellers regex).
    Returnerer et set af pakke-/modulnavne.
    """
    imports = set()
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        # Python AST
        tree = ast.parse(content)
        for node in tree.body:
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.add(alias.name.split(".")[0])
            elif isinstance(node, ast.ImportFrom) and node.module:
                imports.add(node.module.split(".")[0])
    except Exception:
        # Fallback: regex for JS/TS
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            pattern = r"(?:import\s+.*?\s+from\s+['\"]([^'\"]+)['\"]|require\s*\(\s*['\"]([^'\"]+)['\"]\s*\))"
            matches = re.findall(pattern, content)
            for m in matches:
                pkg = m[0] or m[1]
                if pkg and not pkg.startswith("."):
                    imports.add(pkg.split("/")[0])
        except Exception:
            return set()
    return imports


def file_distance_score(source_file: str, target_file: str) -> float:
    """
    Beregner en score 0.0–1.0 baseret på fælles mappestruktur-dybde.
    Jo flere fælles mapper (bortset fra filenames), jo højere score.
    """
    try:
        source_parts = os.path.normpath(source_file).split(os.sep)[:-1]
        target_parts = os.path.normpath(target_file).split(os.sep)[:-1]
        common = 0
        for s, t in zip(source_parts, target_parts):
            if s == t:
                common += 1
            else:
                break
        max_depth = max(len(source_parts), len(target_parts))
        return common / max_depth if max_depth > 0 else 0.0
    except Exception:
        return 0.0


def calculate_recency_score(timestamp_str: str) -> float:
    """
    Beregner en recency-score baseret på ISO timestamp:
    - 0 dage gammel: 1.0
    - <7 dage: 0.9
    - <30 dage: 0.7
    - <90 dage: 0.5
    - >90 dage: 0.3
    """
    try:
        file_time = datetime.fromisoformat(timestamp_str)
        now = datetime.utcnow()
        days_old = (now - file_time).days
        if days_old == 0:
            return 1.0
        elif days_old < 7:
            return 0.9
        elif days_old < 30:
            return 0.7
        elif days_old < 90:
            return 0.5
        else:
            return 0.3
    except Exception:
        return 0.5


def rank_chunks(
    results: List[Dict[str, Any]],
    source_filepath: str,
    query_context: Dict[str, Any] = None,
) -> List[Dict[str, Any]]:
    """
    Rangerer ChromaDB-resultater baseret på:
      1. Semantisk score (baseret på position i liste)
      2. Import-overlap mellem source file og chunk
      3. Fil-afstand (common path depth)
      4. Recency (timestamp)
    
    Args:
        results: Liste af dicts fra /search i format:
          {
            "chunk": "<tekst>",
            "metadata": {
              "file_path": "...",
              "imports": [...],
              "timestamp": "...",
              ...
            },
            "distance": <float>
          }
        source_filepath: Filsti, der blev brugt som kontekst
        query_context: Yderligere kontekst (valgfrit)

    Returns:
        Sorteret liste af result-dicts i faldende relevans
    """
    if not results:
        return []

    # Ekstraher imports fra source, hvis angivet
    if source_filepath:
        try:
            source_imports = extract_imports(source_filepath)
        except Exception:
            source_imports = set()
    else:
        source_imports = set()

    scored = []
    total = len(results)

    for idx, entry in enumerate(results):
        meta = entry.get("metadata", {})
        chunk_filepath = meta.get("file_path", "")
        chunk_imports = set(meta.get("imports", []))
        timestamp = meta.get("timestamp", "")

        # 1) Semantisk score: normaliseret baseret på position
        semantic_score = 1.0 - (idx / total)  # første entry = 1.0, sidste ~0.0

        # 2) Import-score: ratio af fælles imports
        if source_imports and chunk_imports:
            common = len(source_imports & chunk_imports)
            max_imports = max(len(source_imports), len(chunk_imports))
            import_score = common / max_imports if max_imports > 0 else 0.0
        else:
            import_score = 0.0

        # 3) Fil-afstand
        distance_score = (
            file_distance_score(source_filepath, chunk_filepath)
            if source_filepath
            else 0.0
        )

        # 4) Recency
        recency_score = calculate_recency_score(timestamp)

        # Kombiner med vægte
        weights = {
            "semantic": 0.4,
            "imports": 0.25,
            "distance": 0.2,
            "recency": 0.15,
        }
        # Hvis ingen source_filepath, juster vægte (ingen imports/distance)
        if not source_filepath:
            weights = {"semantic": 0.7, "imports": 0.0, "distance": 0.0, "recency": 0.3}

        total_score = (
            weights["semantic"] * semantic_score
            + weights["imports"] * import_score
            + weights["distance"] * distance_score
            + weights["recency"] * recency_score
        )

        scored.append((total_score, entry))

    # Sortér descending efter total_score
    scored.sort(key=lambda x: x[0], reverse=True)

    # Returnér kun entry-delen (afkast kun dict, ikke score)
    return [item[1] for item in scored]