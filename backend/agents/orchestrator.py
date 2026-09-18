from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from backend.agents.material_agent import MaterialAnalyzerAgent
from backend.agents.assessment_agent import AssessmentAgent
from backend.agents.knowledge_agent import KnowledgeAgent
from backend.agents.planning_agent import PlanningAgent
from backend.agents.tutor_agent import answer_tutor_query
from backend.agents.progress_agent import ProgressAgent
from backend.agents.replanning_agent import ReplanningAgent
from backend.services.progress_service import log_agent_event

class OrchestratorAgent:
    """Central orchestrator coordinating the OBSERVE -> ANALYZE -> PLAN -> ACT -> EVALUATE -> ADAPT loop."""

    @staticmethod
    def on_material_uploaded(db: Session, user_id: str, filename: str, file_type: str, raw_bytes: bytes, text: str = ""):
        log_agent_event(db, user_id, "OrchestratorAgent", "Material Ingestion Pipeline Started", f"Coordinating pipeline for '{filename}'.")
        # Step 1: Material Analyzer Agent
        mat_result = MaterialAnalyzerAgent.analyze_document(db, user_id, filename, file_type, raw_bytes, text)
        log_agent_event(db, user_id, "OrchestratorAgent", "Knowledge Structure Ready", "Extracted curriculum topics ready for diagnostic assessment.")
        return mat_result

    @staticmethod
    def on_diagnostic_submitted(db: Session, user_id: str, attempt_id: str, answers: List[Dict[str, Any]], auto_plan: bool = True):
        log_agent_event(db, user_id, "OrchestratorAgent", "Diagnostic Evaluation Started", f"Grading attempt {attempt_id}.")
        # Step 1: Assessment Agent evaluates answers
        diag_result = AssessmentAgent.evaluate_diagnostic(db, user_id, attempt_id, answers)
        
        # Step 2: Planning Agent generates updated study plan
        plan = None
        if auto_plan:
            plan = PlanningAgent.create_plan(db, user_id, subject=diag_result["subject"], exam_date=diag_result["exam_date"])
            log_agent_event(db, user_id, "OrchestratorAgent", "Personalized Plan Created", f"Generated initial plan with {len(plan.sessions)} sessions.")
            
        return diag_result, plan

    @staticmethod
    def on_quiz_completed(db: Session, user_id: str, topic: str, score: int, total: int):
        pct = score / max(1, total)
        log_agent_event(db, user_id, "OrchestratorAgent", "Quiz Evaluated", f"Quiz on {topic}: {score}/{total} ({int(pct * 100)}%).")
        
        replan_triggered = False
        explanation = ""
        # If score is below 70%, trigger Replanning Agent
        if pct < 0.70:
            plan, explanation = ReplanningAgent.replan(db, user_id, reason="poor_quiz_performance", topic=topic, quiz_score=pct)
            replan_triggered = True
            log_agent_event(db, user_id, "OrchestratorAgent", "Adaptive Replanning Triggered", f"Adapted schedule: {explanation}")
            
        return {
            "topic": topic,
            "score": score,
            "total_questions": total,
            "percentage": round(pct * 100, 1),
            "replan_triggered": replan_triggered,
            "explanation": explanation
        }
