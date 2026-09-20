import pymupdf
import re
from typing import List, Dict, Any
from backend.utils.validators import sanitize_text

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extract and clean raw text from PDF bytes using PyMuPDF."""
    text_chunks = []
    with pymupdf.open(stream=pdf_bytes, filetype="pdf") as doc:
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text")
            if text:
                text_chunks.append(text)
    
    full_text = "\n".join(text_chunks)
    return sanitize_text(full_text)

def chunk_text(text: str, chunk_size: int = 600, overlap: int = 100) -> List[Dict[str, Any]]:
    """Split clean text into semantic sliding-window chunks for retrieval."""
    if not text:
        return []

    paragraphs = text.split("\n\n")
    chunks: List[Dict[str, Any]] = []
    current_chunk = []
    current_length = 0
    chunk_idx = 0

    for para in paragraphs:
        para_clean = para.strip()
        if not para_clean:
            continue
        
        para_len = len(para_clean)
        if current_length + para_len > chunk_size and current_chunk:
            chunk_content = " ".join(current_chunk)
            chunks.append({
                "chunk_index": chunk_idx,
                "content": chunk_content
            })
            chunk_idx += 1
            # Retain overlap from end of current chunk
            words = chunk_content.split()
            overlap_words = words[-max(1, overlap // 6):] if len(words) > 10 else []
            current_chunk = [" ".join(overlap_words), para_clean] if overlap_words else [para_clean]
            current_length = sum(len(p) for p in current_chunk)
        else:
            current_chunk.append(para_clean)
            current_length += para_len

    if current_chunk:
        chunks.append({
            "chunk_index": chunk_idx,
            "content": " ".join(current_chunk)
        })

    return chunks
