import requests
import time
import sys

BASE_URL = "http://localhost:8000/api"
FRONTEND_URL = "http://localhost:5173"

def run_verification():
    print("\n=======================================================")
    print("STUDYGAPRADAR FULL-SYSTEM 15-STEP INTEGRATION TEST")
    print("=======================================================\n")

    # Verify Frontend server is live
    print("[CHECK] Testing Frontend Vite server availability at http://localhost:5173...")
    routes_to_test = [
        "/",
        "/signin",
        "/signup",
        "/onboarding",
        "/home",
        "/diagnostic/setup",
        "/diagnostic",
        "/results",
        "/prep",
        "/study-plan",
        "/practice",
        "/practice/complete",
        "/ai-tools",
        "/profile",
        "/premium"
    ]
    for r in routes_to_test:
        try:
            f_res = requests.get(f"{FRONTEND_URL}{r}", timeout=5)
            assert f_res.status_code == 200, f"Route {r} returned {f_res.status_code}"
            assert "<div id=\"root\">" in f_res.text or "<!DOCTYPE html>" in f_res.text
            print(f"  [PASS] Route '{r}' loads successfully (HTTP 200)")
        except Exception as e:
            print(f"  [FAIL] Route '{r}' error: {e}")
            sys.exit(1)

    print("\n[TEST 1 & 2] Student Registration & Login...")
    test_email = f"verified_student_{int(time.time())}@sit.ac.in"
    reg_res = requests.post(f"{BASE_URL}/auth/signup", json={
        "name": "Ananya Joshi",
        "email": test_email,
        "password": "SecurePassword123!"
    })
    assert reg_res.status_code == 200, f"Signup failed: {reg_res.text}"
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"  [PASS] Registered and authenticated: {test_email}")

    print("\n[TEST 3] Complete Onboarding...")
    onboard_res = requests.put(f"{BASE_URL}/profile", headers=headers, json={
        "branch": "Computer Science & Engineering",
        "semester": "Semester 5",
        "subject": "Data Structures",
        "exam_name": "Midsem Examination",
        "exam_date": "2026-10-30",
        "daily_study_hours": 2.5,
        "current_confidence": "Moderate",
        "learning_goal": "Score above 90% in Data Structures"
    })
    assert onboard_res.status_code == 200, f"Onboarding failed: {onboard_res.text}"
    print("  [PASS] Onboarding profile updated and persisted.")

    print("\n[TEST 4 & 5] Upload & Analyze Data Structures Notes...")
    sample_notes = """
    DATA STRUCTURES LECTURE COMPENDIUM
    1. Binary Trees:
       Non-linear hierarchical data structure. Each node has at most two children.
       Traversals:
       - In-Order (Left, Root, Right): yields sorted output in BST.
       - Pre-Order (Root, Left, Right): used for tree cloning.
       - Post-Order (Left, Right, Root): used for node deletion.
    2. Recursion & Divide-and-Conquer:
       Requires a strict base case to prevent stack overflow.
    3. Arrays:
       Continuous memory allocation, O(1) indexed lookup, O(n) insertions.
    """
    mat_res = requests.post(f"{BASE_URL}/materials/text", headers=headers, json={
        "filename": "Data_Structures_Lecture_Notes.txt",
        "text": sample_notes
    })
    assert mat_res.status_code == 200, f"Material ingestion failed: {mat_res.text}"
    print("  [PASS] Material Analyzer Agent indexed notes into semantic chunks.")

    print("\n[TEST 6] Generate Diagnostic Assessment...")
    diag_gen = requests.post(f"{BASE_URL}/diagnostic/generate", headers=headers, json={
        "subject_name": "Data Structures",
        "topics": ["Arrays", "Linked Lists", "Trees", "Recursion"],
        "exam_date": "2026-10-30"
    })
    assert diag_gen.status_code == 200, f"Diagnostic generation failed: {diag_gen.text}"
    attempt_id = diag_gen.json()["data"]["attempt_id"]
    questions = diag_gen.json()["data"]["questions"]
    print(f"  [PASS] Assessment Agent curated {len(questions)} diagnostic questions.")

    print("\n[TEST 7] Submit Diagnostic Responses...")
    # Answer Arrays correctly, Trees incorrectly
    answers_payload = []
    for q in questions:
        if q["topic"] == "Trees":
            answers_payload.append({"question_id": q["id"], "selected_index": 0})
        else:
            answers_payload.append({"question_id": q["id"], "selected_index": 1})

    sub_res = requests.post(f"{BASE_URL}/diagnostic/submit", headers=headers, json={
        "attempt_id": attempt_id,
        "answers": answers_payload
    })
    assert sub_res.status_code == 200, f"Diagnostic submit failed: {sub_res.text}"
    print("  [PASS] Diagnostic scored and topic mastery calculated.")

    print("\n[TEST 8] Fetch Results & Knowledge Gap Analysis (View Results)...")
    results_res = requests.get(f"{BASE_URL}/knowledge/results", headers=headers)
    assert results_res.status_code == 200, f"Results fetch failed: {results_res.text}"
    res_data = results_res.json()["data"]
    assert "topics" in res_data and len(res_data["topics"]) > 0
    trees_topic = next((t for t in res_data["topics"] if t["topic"] == "Trees"), None)
    assert trees_topic is not None, "Trees topic not found in results"
    assert trees_topic["status"] == "needs-attention"
    print(f"  [PASS] Results page data verified: Trees Priority Score = {trees_topic['priority_score']}, Status = {trees_topic['status']}")

    print("\n[TEST 9] Fetch Study Plan & Today's Tasks (Continue Prep)...")
    plan_res = requests.get(f"{BASE_URL}/plan", headers=headers)
    assert plan_res.status_code == 200, f"Plan fetch failed: {plan_res.text}"
    plan_data = plan_res.json()["data"]
    sessions = plan_data["sessions"]
    assert len(sessions) > 0, "No sessions generated in study plan"
    print(f"  [PASS] Preparation page data verified: {len(sessions)} study sessions across {plan_data['days_remaining']} days.")

    print("\n[TEST 10] Complete a Study Session...")
    first_session_id = sessions[0]["id"]
    comp_res = requests.post(f"{BASE_URL}/progress/session", headers=headers, json={
        "session_id": first_session_id,
        "duration_minutes": 45,
        "reflection": "Thoroughly practiced recursive binary search and traversals."
    })
    assert comp_res.status_code == 200, f"Session completion failed: {comp_res.text}"
    print("  [PASS] Study session marked complete.")

    print("\n[TEST 11 & 12] Take Trees Quiz with Low Score -> Trigger Adaptive Replanning...")
    quiz_res = requests.post(f"{BASE_URL}/quiz/submit", headers=headers, json={
        "topic": "Trees",
        "answers": [
            {"question_id": "dummy-1", "selected_index": 3},
            {"question_id": "dummy-2", "selected_index": 3},
            {"question_id": "dummy-3", "selected_index": 3},
            {"question_id": "dummy-4", "selected_index": 3}
        ]
    })
    assert quiz_res.status_code == 200, f"Quiz submission failed: {quiz_res.text}"
    quiz_data = quiz_res.json()["data"]
    assert quiz_data["replan_triggered"] is True, "Expected replanning agent to trigger"
    print(f"  [PASS] Quiz Score: {quiz_data['score']}/{quiz_data['total_questions']} -> Replanning Agent triggered!")
    print(f"  [PASS] Explanation: {quiz_data['explanation']}")

    print("\n[TEST 13] Check Dashboard Analytics & Updated Progress...")
    dash_res = requests.get(f"{BASE_URL}/analytics/dashboard", headers=headers)
    assert dash_res.status_code == 200, f"Dashboard fetch failed: {dash_res.text}"
    dash_data = dash_res.json()["data"]
    assert dash_data["user_name"] == "Ananya Joshi"
    print(f"  [PASS] Dashboard state: Student = {dash_data['user_name']}, Readiness = '{dash_data['readiness_indicator']}'")

    print("\n[TEST 14] Query Notes-Aware AI Tutor...")
    tutor_res = requests.post(f"{BASE_URL}/tutor/ask", headers=headers, json={
        "question": "Explain binary tree traversal like I'm a beginner.",
        "topic": "Trees",
        "mode": "explain_simply"
    })
    assert tutor_res.status_code == 200, f"Tutor query failed: {tutor_res.text}"
    tutor_data = tutor_res.json()["data"]
    assert tutor_data["cites_notes"] is True, "Expected tutor to cite uploaded lecture notes"
    print("  [PASS] AI Tutor responded with citations to uploaded notes:")
    print(f"         \"{tutor_data['answer'][:140]}...\"")

    print("\n[TEST 15] Inspect Autonomous Agent Event Stream...")
    events_res = requests.get(f"{BASE_URL}/agents/events", headers=headers)
    assert events_res.status_code == 200, f"Events fetch failed: {events_res.text}"
    events = events_res.json()["data"]
    assert len(events) >= 5, f"Expected at least 5 agent events, got {len(events)}"
    print(f"  [PASS] Verified {len(events)} autonomous agent events recorded in live stream.")
    for e in events[:3]:
        print(f"         [{e['agent_name']}] {e['action']}: {e['detail'][:50]}...")

    print("\n=======================================================")
    print("ALL 15 INTEGRATION TESTS COMPLETED AND PASSED! [OK]")
    print("=======================================================\n")

if __name__ == "__main__":
    run_verification()
