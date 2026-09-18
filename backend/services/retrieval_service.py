import math
import re
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from backend.models import MaterialChunk, Material

def tokenize(text: str) -> List[str]:
    return [w.lower() for w in re.findall(r"\b[a-zA-Z0-9_-]+\b", text)]

def calculate_tf_idf_similarity(query_tokens: List[str], chunk_text: str) -> float:
    """Compute lightweight TF-IDF keyword similarity score between query and chunk."""
    chunk_tokens = tokenize(chunk_text)
    if not chunk_tokens:
        return 0.0

    chunk_len = len(chunk_tokens)
    tf = {}
    for tok in chunk_tokens:
        tf[tok] = tf.get(tok, 0) + 1

    score = 0.0
    for q in query_tokens:
        if q in tf:
            # Term frequency normalized by doc length
            term_score = (tf[q] / chunk_len) * (1.0 + math.log(1.0 + tf[q]))
            score += term_score

    return score

def retrieve_relevant_chunks(
    db: Session,
    user_id: str,
    query: str,
    top_k: int = 3,
    min_score: float = 0.02
) -> List[Dict[str, Any]]:
    """Retrieve the most relevant study note chunks for a student query."""
    # Find all chunks belonging to the user's uploaded materials
    chunks = (
        db.query(MaterialChunk)
        .join(Material, MaterialChunk.material_id == Material.id)
        .filter(Material.user_id == user_id)
        .all()
    )

    if not chunks:
        return []

    q_tokens = tokenize(query)
    if not q_tokens:
        return []

    scored_chunks: List[Tuple[float, MaterialChunk]] = []
    for c in chunks:
        score = calculate_tf_idf_similarity(q_tokens, c.content)
        if score >= min_score:
            scored_chunks.append((score, c))

    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    top_results = scored_chunks[:top_k]

    return [
        {
            "chunk_id": c.id,
            "material_id": c.material_id,
            "topic_name": c.topic_name or "General",
            "content": c.content,
            "score": round(score, 4)
        }
        for score, c in top_results
    ]
