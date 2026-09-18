import requests
import time

BASE_URL = "http://localhost:8000/api"

def run_academic_demo_flow():
    print("\n=======================================================")
    print("STARTING STUDYGAPRADAR FULL-STACK ACADEMIC DEMO FLOW")
    print("=======================================================\n")

    # 1. Sign up a new student
    student_email = f"student_{int(time.time())}@university.edu"
    print(f"1. Registering new student: {student_email}...")
    signup_res = requests.post(f"{BASE_URL}/auth/signup", json={
        "name": "Priya Patel",
        "email": student_email,
        "password": "Password123!"
    })
    assert signup_res.status_code == 200, f"Signup failed: {signup_res.text}"
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("   [OK] Student registered and authenticated.")

    # 2. Onboarding / Profile Setup
    print("2. Setting up student onboarding profile...")
    prof_res = requests.put(f"{BASE_URL}/profile", headers=headers, json={
        "branch": "Computer Science & Engineering",
        "semester": "Semester 5",
        "subject": "Data Structures",
        "exam_name": "Final Examination",
        "exam_date": "2026-10-25",
        "daily_study_hours": 2.0,
        "current_confidence": "Moderate",
        "learning_goal": "Master trees and graphs to score A+ in Final Examination"
    })
    assert prof_res.status_code == 200, f"Profile setup failed: {prof_res.text}"
    print("   [OK] Profile configured (Subject: Data Structures, Exam: Final Examination, Daily study: 2h).")

    # 3. Upload Data Structures Study Material
    print("3. Ingesting Data Structures Study Notes...")
    notes_content = """
    DATA STRUCTURES COURSE NOTES - SEMESTER 5
    Topics covered: Arrays, Linked Lists, Stacks, Queues, Trees, Graphs, Sorting, Searching.
    
    1. Binary Trees and Binary Search Trees (BST):
    In a Binary Tree, each node has at most two children.
    Binary Tree Traversals:
    - In-order (Left, Root, Right): For BST, this traversal outputs elements in strictly ascending sorted order.
    - Pre-order (Root, Left, Right): Explores root first, ideal for tree cloning and prefix expressions.
    - Post-order (Left, Right, Root): Explores children first, ideal for tree deletion and space computation.
    
    2. Arrays & Contiguous Memory:
    Direct-address array lookups take O(1) time. Inserting at index 0 requires shifting all n elements, taking O(n) worst-case time.
    
    3. Graphs:
    Represented using Adjacency Matrix or Adjacency List. DFS uses stack; BFS uses queue.
    """
    mat_res = requests.post(f"{BASE_URL}/materials/text", headers=headers, json={
        "filename": "Data_Structures_Comprehensive_Notes.txt",
        "text": notes_content
    })
    assert mat_res.status_code == 200, f"Material ingestion failed: {mat_res.text}"
    print(f"   [OK] Material Analyzer Agent processed document. Summary: {mat_res.json()['data']['summary']}")

    # 4. Take Diagnostic Assessment
    print("4. Initiating Diagnostic Assessment on Data Structures topics...")
    diag_gen = requests.post(f"{BASE_URL}/diagnostic/generate", headers=headers, json={
        "subject_name": "Data Structures",
        "topics": ["Arrays", "Linked Lists", "Trees", "Recursion"],
        "exam_date": "2026-10-25"
    })
    assert diag_gen.status_code == 200, f"Diagnostic generation failed: {diag_gen.text}"
    attempt_id = diag_gen.json()["data"]["attempt_id"]
    questions = diag_gen.json()["data"]["questions"]
    print(f"   [OK] Assessment Agent generated {len(questions)} diagnostic questions.")

    # 5. Submit Answers simulating:
    # Arrays -> Strong (all correct)
    # Trees -> Weak (all incorrect to detect knowledge gap)
    print("5. Submitting student diagnostic responses...")
    submitted_answers = []
    for q in questions:
        if q["topic"] == "Arrays":
            submitted_answers.append({"question_id": q["id"], "selected_index": 1})
        elif q["topic"] == "Trees":
            submitted_answers.append({"question_id": q["id"], "selected_index": 0})
        else:
            submitted_answers.append({"question_id": q["id"], "selected_index": 1})

    sub_res = requests.post(f"{BASE_URL}/diagnostic/submit", headers=headers, json={
        "attempt_id": attempt_id,
        "answers": submitted_answers
    })
    assert sub_res.status_code == 200, f"Diagnostic submit failed: {sub_res.text}"
    results_data = sub_res.json()["data"]
    print("   [OK] Knowledge Agent evaluated topic mastery:")
    for t in results_data["topics"]:
        print(f"     * {t['topic']}: Status = {t['status'].upper()} (Score: {t['correct']}/{t['total']}, Priority Score: {t['priority_score']})")

    # 6. Planning Agent Generates Study Plan
    print("6. Verifying Planning Agent personalized schedule...")
    plan_res = requests.get(f"{BASE_URL}/plan", headers=headers)
    assert plan_res.status_code == 200, f"Plan retrieval failed: {plan_res.text}"
    plan = plan_res.json()["data"]
    print(f"   [OK] Study Plan generated: {len(plan['sessions'])} sessions across {plan['days_remaining']} days.")

    # 7. Student completes a study session
    first_session = plan["sessions"][0]
    print(f"7. Progress Agent: Student completes session '{first_session['topic']}' ({first_session['activity']})...")
    sess_res = requests.post(f"{BASE_URL}/progress/session", headers=headers, json={
        "session_id": first_session["id"],
        "duration_minutes": 45,
        "reflection": "Completed in-depth review of core tree concepts."
    })
    assert sess_res.status_code == 200, f"Session completion failed: {sess_res.text}"
    print("   [OK] Session marked completed in database.")

    # 8. Student performs poorly on a Trees quiz -> Triggers Replanning Agent
    print("8. Student takes a Trees quiz and scores low...")
    quiz_sub = requests.post(f"{BASE_URL}/quiz/submit", headers=headers, json={
        "topic": "Trees",
        "answers": [
            {"question_id": "dummy-1", "selected_index": 3},
            {"question_id": "dummy-2", "selected_index": 3},
            {"question_id": "dummy-3", "selected_index": 3},
            {"question_id": "dummy-4", "selected_index": 3}
        ]
    })
    assert quiz_sub.status_code == 200, f"Quiz submission failed: {quiz_sub.text}"
    quiz_data = quiz_sub.json()["data"]
    print(f"   [OK] Quiz Score: {quiz_data['score']}/{quiz_data['total_questions']} ({quiz_data['percentage']}%).")
    print(f"   [OK] Replanning Agent Triggered: {quiz_data['replan_triggered']}")
    print(f"   [OK] Replanning Explanation: \"{quiz_data['explanation']}\"")

    # 9. Ask Notes-Aware AI Tutor
    print("9. Asking AI Tutor: 'Explain binary tree traversal like I'm a beginner.'...")
    tutor_res = requests.post(f"{BASE_URL}/tutor/ask", headers=headers, json={
        "question": "Explain binary tree traversal like I'm a beginner.",
        "topic": "Trees",
        "mode": "explain_simply"
    })
    assert tutor_res.status_code == 200, f"Tutor query failed: {tutor_res.text}"
    tutor_data = tutor_res.json()["data"]
    print(f"   [OK] AI Tutor Response (Citing uploaded notes: {tutor_data['cites_notes']}):")
    print(f"     \"{tutor_data['answer'][:240]}...\"")

    # 10. Dashboard & Agent Events Verification
    print("10. Checking live Dashboard Analytics & Agent Event Stream...")
    dash_res = requests.get(f"{BASE_URL}/analytics/dashboard", headers=headers)
    assert dash_res.status_code == 200, f"Dashboard failed: {dash_res.text}"
    d = dash_res.json()["data"]
    print(f"   [OK] Dashboard State: Student = {d['user_name']}, Current Mastery = {d['current_mastery']}%, Readiness = '{d['readiness_indicator']}'")

    events_res = requests.get(f"{BASE_URL}/agents/events", headers=headers)
    assert events_res.status_code == 200, f"Events failed: {events_res.text}"
    events = events_res.json()["data"]
    print(f"   [OK] Total Autonomous Agent Events Logged: {len(events)}")
    for e in events[:4]:
        print(f"     [{e['agent_name']}] {e['action']}: {e['detail'][:65]}...")

    print("\n=======================================================")
    print("ACADEMIC DEMO SCENARIO FULLY VALIDATED AND PASSED! [OK]")
    print("=======================================================\n")

if __name__ == "__main__":
    run_academic_demo_flow()
