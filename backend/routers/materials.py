from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from backend.database import get_db
from backend.models import User, Material, MaterialChunk
from backend.schemas import MaterialResponse, MaterialTextUploadRequest, ApiResponse
from backend.auth import get_current_user
from backend.agents.orchestrator import OrchestratorAgent

router = APIRouter(prefix="/api/materials", tags=["Study Materials"])

@router.post("/upload", response_model=ApiResponse)
async def upload_material_file(
    file: UploadFile = File(...),
    subject_name: Optional[str] = Form("Data Structures"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith((".pdf", ".txt")):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are currently supported.")

    file_bytes = await file.read()
    if len(file_bytes) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 25MB.")

    file_type = "pdf" if file.filename.lower().endswith(".pdf") else "txt"
    mat_result = OrchestratorAgent.on_material_uploaded(
        db=db,
        user_id=current_user.id,
        filename=file.filename,
        file_type=file_type,
        raw_bytes=file_bytes
    )

    return ApiResponse(
        success=True,
        message=f"Successfully analyzed and indexed '{file.filename}'.",
        data=mat_result
    )

@router.post("/text", response_model=ApiResponse)
def upload_material_text(
    req: MaterialTextUploadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text content cannot be empty.")

    mat_result = OrchestratorAgent.on_material_uploaded(
        db=db,
        user_id=current_user.id,
        filename=req.filename,
        file_type="notes",
        raw_bytes=req.text.encode("utf-8"),
        text=req.text
    )

    return ApiResponse(
        success=True,
        message=f"Pasted notes indexed successfully.",
        data=mat_result
    )

@router.get("", response_model=List[MaterialResponse])
def list_materials(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    materials = db.query(Material).filter(Material.user_id == current_user.id).order_by(Material.created_at.desc()).all()
    return [
        MaterialResponse(
            id=m.id,
            filename=m.filename,
            file_type=m.file_type,
            summary=m.summary,
            topics=json.loads(m.topics_json or "[]"),
            created_at=m.created_at
        )
        for m in materials
    ]

@router.get("/{material_id}", response_model=MaterialResponse)
def get_material(material_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = db.query(Material).filter(Material.id == material_id, Material.user_id == current_user.id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material not found.")
    return MaterialResponse(
        id=m.id,
        filename=m.filename,
        file_type=m.file_type,
        summary=m.summary,
        topics=json.loads(m.topics_json or "[]"),
        created_at=m.created_at
    )
