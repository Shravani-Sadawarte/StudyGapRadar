from sqlalchemy.orm import Session
from typing import Dict, Any, List
from backend.services.material_service import process_material

class MaterialAnalyzerAgent:
    """Agent responsible for inspecting documents, identifying concepts, and preparing them for retrieval."""

    @staticmethod
    def analyze_document(
        db: Session,
        user_id: str,
        filename: str,
        file_type: str,
        raw_bytes: bytes,
        text: str = ""
    ) -> Dict[str, Any]:
        material = process_material(
            db=db,
            user_id=user_id,
            filename=filename,
            file_type=file_type,
            raw_content=raw_bytes,
            text_content=text
        )
        return {
            "id": material.id,
            "filename": material.filename,
            "summary": material.summary,
            "topics": material.topics_json
        }
