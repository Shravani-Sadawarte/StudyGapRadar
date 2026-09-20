import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal, engine, Base
import io

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_auth_login_demo():
    res = client.post("/api/auth/login", json={
        "email": "demo@studygapradar.app",
        "password": "demo12345"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    token = data["access_token"]
    
    # Test GET /api/auth/me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["name"] == "Aarav Sharma"

def test_signup_and_profile():
    import time
    email = f"test_{int(time.time())}@university.edu"
    res = client.post("/api/auth/signup", json={
        "name": "Test Student",
        "email": email,
        "password": "securepassword123"
    })
    assert res.status_code == 200
    token = res.json()["access_token"]

    # Test profile update
    prof_res = client.put("/api/profile", headers={"Authorization": f"Bearer {token}"}, json={
        "branch": "Computer Science & Engineering",
        "semester": "Semester 5",
        "exam_name": "Midterms",
        "exam_date": "2026-10-30",
        "daily_study_hours": 3.0
    })
    assert prof_res.status_code == 200
    assert prof_res.json()["daily_study_hours"] == 3.0

def test_diagnostic_flow():
    # Login as demo
    login_res = client.post("/api/auth/login", json={
        "email": "demo@studygapradar.app",
        "password": "demo12345"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Generate diagnostic
    gen_res = client.post("/api/diagnostic/generate", headers=headers, json={
        "subject_name": "Data Structures",
        "topics": ["Recursion", "Arrays", "Trees"],
        "exam_date": "2026-10-15"
    })
    assert gen_res.status_code == 200
    diag_data = gen_res.json()["data"]
    attempt_id = diag_data["attempt_id"]
    questions = diag_data["questions"]
    assert len(questions) > 0

    # Submit answers
    answers = [{"question_id": q["id"], "selected_index": 1} for q in questions]
    sub_res = client.post("/api/diagnostic/submit", headers=headers, json={
        "attempt_id": attempt_id,
        "answers": answers
    })
    assert sub_res.status_code == 200

    # Test knowledge results
    know_res = client.get("/api/knowledge/results", headers=headers)
    assert know_res.status_code == 200
    assert len(know_res.json()["data"]["topics"]) > 0

def test_study_plan_and_replanning():
    login_res = client.post("/api/auth/login", json={
        "email": "demo@studygapradar.app",
        "password": "demo12345"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get plan
    plan_res = client.get("/api/plan", headers=headers)
    assert plan_res.status_code == 200
    plan = plan_res.json()["data"]
    assert len(plan["sessions"]) > 0

    # Test adaptive replanning on poor quiz
    replan_res = client.post("/api/plan/replan", headers=headers, json={
        "reason": "poor_quiz_performance",
        "topic": "Trees",
        "quiz_score": 0.25
    })
    assert replan_res.status_code == 200
    replan_data = replan_res.json()["data"]
    assert "Trees" in replan_data["explanation"]

def test_tutor_and_materials():
    login_res = client.post("/api/auth/login", json={
        "email": "demo@studygapradar.app",
        "password": "demo12345"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload text notes
    notes_res = client.post("/api/materials/text", headers=headers, json={
        "filename": "Data Structures Lecture 1",
        "text": "Binary Search Trees (BST) require in-order traversal (Left, Root, Right) to visit keys in ascending sorted order. AVL trees maintain balance factor between -1 and +1."
    })
    assert notes_res.status_code == 200

    # Ask tutor
    tutor_res = client.post("/api/tutor/ask", headers=headers, json={
        "question": "How does binary tree traversal work in a BST?",
        "topic": "Trees",
        "mode": "explain_simply"
    })
    assert tutor_res.status_code == 200
    tutor_data = tutor_res.json()["data"]
    assert "Travers" in tutor_data["answer"] or "Tree" in tutor_data["answer"]

def test_dashboard_and_agents():
    login_res = client.post("/api/auth/login", json={
        "email": "demo@studygapradar.app",
        "password": "demo12345"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Dashboard
    dash_res = client.get("/api/analytics/dashboard", headers=headers)
    assert dash_res.status_code == 200
    assert "user_name" in dash_res.json()["data"]

    # Agent events
    events_res = client.get("/api/agents/events", headers=headers)
    assert events_res.status_code == 200
    assert len(events_res.json()["data"]) > 0

if __name__ == "__main__":
    test_health()
    test_auth_login_demo()
    test_signup_and_profile()
    test_diagnostic_flow()
    test_study_plan_and_replanning()
    test_tutor_and_materials()
    test_dashboard_and_agents()
    print("ALL 7 BACKEND API TEST SUITES PASSED SUCCESSFULLY!")
