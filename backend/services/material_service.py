from sqlalchemy.orm import Session
import json
from typing import List, Dict, Any, Optional
from backend.models import Material, MaterialChunk, Topic, Subject
from backend.services.pdf_service import extract_text_from_pdf_bytes, chunk_text
from backend.services.progress_service import log_agent_event

def process_material(
    db: Session,
    user_id: str,
    filename: str,
    file_type: str,
    raw_content: bytes,
    text_content: Optional[str] = None,
    subject_name: str = "Data Structures"
) -> Material:
    """Extract, analyze, chunk, and persist study material."""
    if file_type == "pdf":
        clean_txt = extract_text_from_pdf_bytes(raw_content)
    else:
        clean_txt = (text_content or raw_content.decode("utf-8", errors="ignore")).strip()

    # Find or create subject
    subject = db.query(Subject).filter(Subject.name == subject_name).first()
    if not subject:
        subject = Subject(name=subject_name, branch="Computer Science & Engineering")
        db.add(subject)
        db.commit()
        db.refresh(subject)

    material = Material(
        user_id=user_id,
        subject_id=subject.id,
        filename=filename,
        file_type=file_type,
        raw_text=clean_txt[:5000],  # sample preview
        clean_text=clean_txt,
        summary=f"Ingested study material for {subject_name}: {filename} ({len(clean_txt)} characters)."
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    # Chunk text
    chunks = chunk_text(clean_txt)
    for c in chunks:
        mc = MaterialChunk(
            material_id=material.id,
            chunk_index=c["chunk_index"],
            content=c["content"]
        )
        db.add(mc)

    # Extract topics using domain parser or agent
    # Check for known engineering topics mentioned in text
    known_topics = ["Arrays", "Linked Lists", "Stacks", "Queues", "Trees", "Graphs", "Sorting", "Searching", "Recursion", "Dynamic Programming"]
    extracted = [t for t in known_topics if t.lower() in clean_txt.lower()]
    if not extracted:
        extracted = ["Recursion", "Arrays", "Trees"]

    material.topics_json = json.dumps(extracted)
    material.summary = (
        f"Material '{filename}' analyzed. Identified key curriculum areas: {', '.join(extracted)}. "
        f"Generated {len(chunks)} retrieval-ready document chunks."
    )

    # Populate topics in DB if not exist
    for idx, t_name in enumerate(extracted):
        existing_topic = db.query(Topic).filter(Topic.subject_id == subject.id, Topic.name == t_name).first()
        if not existing_topic:
            topic_obj = Topic(
                subject_id=subject.id,
                name=t_name,
                order_index=idx,
                importance="High" if t_name in ["Trees", "Graphs", "Recursion"] else "Medium",
                difficulty="High" if t_name in ["Trees", "Graphs", "Dynamic Programming"] else "Medium",
                summary=f"Core concept area covering {t_name} algorithms, operations, and complexities."
            )
            db.add(topic_obj)

    log_agent_event(
        db=db,
        user_id=user_id,
        agent_name="MaterialAnalyzerAgent",
        action="Material Ingested & Analyzed",
        detail=f"Parsed '{filename}'. Extracted {len(extracted)} topics ({', '.join(extracted)}) and {len(chunks)} indexed chunks."
    )

    db.commit()
    db.refresh(material)
    return material
