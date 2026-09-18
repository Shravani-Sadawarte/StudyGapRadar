import requests
import time
import sys

BASE_URL = "http://localhost:8000/api"

def run_test_suite():
    print("\n=======================================================")
    print("STARTING STUDYGAPRADAR AI FEATURE GATING TEST SUITE")
    print("=======================================================\n")

    # 1. Free user starts with 0/3 AI Tutor questions used
    test_email = f"free_student_{int(time.time())}@university.edu"
    print(f"TEST 1: Registering free student: {test_email}...")
    signup_res = requests.post(f"{BASE_URL}/auth/signup", json={
        "name": "Test Student",
        "email": test_email,
        "password": "Password123!"
    })
    assert signup_res.status_code == 200, f"Signup failed: {signup_res.text}"
    user_data = signup_res.json()["user"]
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    assert user_data["plan"] == "free", f"Expected plan 'free', got {user_data['plan']}"
    assert user_data["ai_questions_used"] == 0, f"Expected 0 questions used, got {user_data['ai_questions_used']}"
    assert user_data["ai_question_limit"] == 3, f"Expected limit 3, got {user_data['ai_question_limit']}"

    # Check GET /api/tutor/usage
    usage_res = requests.get(f"{BASE_URL}/tutor/usage", headers=headers)
    assert usage_res.status_code == 200
    usage_data = usage_res.json()["data"]
    assert usage_data["ai_questions_used"] == 0
    assert usage_data["ai_question_limit"] == 3
    assert usage_data["remaining_questions"] == 3
    assert usage_data["is_premium"] is False
    print("   [PASS] TEST 1: Free user created with 0/3 questions used, 3 remaining.")

    # 2. Free user can ask question 1 -> succeeds, counter shows 1/3
    print("TEST 2: Asking Question 1 as Free user...")
    q1_res = requests.post(f"{BASE_URL}/tutor/ask", headers=headers, json={
        "question": "What is the worst-case time complexity of quicksort?",
        "topic": "Sorting"
    })
    assert q1_res.status_code == 200, f"Question 1 request failed: {q1_res.text}"
    q1_data = q1_res.json()
    assert q1_data["success"] is True
    assert q1_data["data"]["ai_questions_used"] == 1
    assert q1_data["data"]["remaining_questions"] == 2
    print("   [PASS] TEST 2: Question 1 succeeded. Counter = 1/3, remaining = 2.")

    # 3. Free user can ask question 2 -> succeeds, counter shows 2/3
    print("TEST 3: Asking Question 2 as Free user...")
    q2_res = requests.post(f"{BASE_URL}/tutor/ask", headers=headers, json={
        "question": "Explain difference between array and linked list memory layout.",
        "topic": "Arrays"
    })
    assert q2_res.status_code == 200
    q2_data = q2_res.json()
    assert q2_data["success"] is True
    assert q2_data["data"]["ai_questions_used"] == 2
    assert q2_data["data"]["remaining_questions"] == 1
    print("   [PASS] TEST 3: Question 2 succeeded. Counter = 2/3, remaining = 1.")

    # 4. Free user can ask question 3 -> succeeds, counter shows 3/3
    print("TEST 4: Asking Question 3 as Free user...")
    q3_res = requests.post(f"{BASE_URL}/tutor/ask", headers=headers, json={
        "question": "How does BFS use a queue to explore graphs layer by layer?",
        "topic": "Graphs"
    })
    assert q3_res.status_code == 200
    q3_data = q3_res.json()
    assert q3_data["success"] is True
    assert q3_data["data"]["ai_questions_used"] == 3
    assert q3_data["data"]["remaining_questions"] == 0
    print("   [PASS] TEST 4: Question 3 succeeded. Counter = 3/3, remaining = 0.")

    # 5. Free user tries question 4 -> blocked with upgrade prompt, backend rejects with AI_LIMIT_REACHED
    print("TEST 5: Attempting Question 4 as Free user (Limit Exceeded)...")
    q4_res = requests.post(f"{BASE_URL}/tutor/ask", headers=headers, json={
        "question": "What is an AVL tree and why does it rotate?",
        "topic": "Trees"
    })
    assert q4_res.status_code == 200
    q4_data = q4_res.json()
    assert q4_data["success"] is False, f"Expected success=False, got {q4_data}"
    assert q4_data["code"] == "AI_LIMIT_REACHED" or (q4_data.get("data") and q4_data["data"].get("code") == "AI_LIMIT_REACHED")
    assert q4_data.get("upgrade_required") is True or (q4_data.get("data") and q4_data["data"].get("upgrade_required") is True)
    assert "3 free AI Tutor questions" in q4_data["message"]
    print("   [PASS] TEST 5: Question 4 successfully rejected with code 'AI_LIMIT_REACHED' and upgrade_required=True.")

    # 6. Refreshing the page / query user session preserves counter in DB
    print("TEST 6: Validating persistent usage counter via /auth/me and /tutor/usage...")
    me_res = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["ai_questions_used"] == 3, f"Expected persisted 3, got {me_data['ai_questions_used']}"
    assert me_data["plan"] == "free"

    usage_res_2 = requests.get(f"{BASE_URL}/tutor/usage", headers=headers)
    assert usage_res_2.status_code == 200
    u2_data = usage_res_2.json()["data"]
    assert u2_data["ai_questions_used"] == 3
    assert u2_data["remaining_questions"] == 0
    print("   [PASS] TEST 6: Persistence verified across API calls. Usage is 3/3 in DB.")

    # 7. Upgrade to Premium
    print("TEST 7: Upgrading user to Premium via /auth/upgrade...")
    upgrade_res = requests.post(f"{BASE_URL}/auth/upgrade", headers=headers)
    assert upgrade_res.status_code == 200, f"Upgrade failed: {upgrade_res.text}"
    up_data = upgrade_res.json()
    assert up_data["success"] is True
    assert up_data["data"]["plan"] == "premium"
    assert up_data["data"]["is_premium"] is True
    assert up_data["data"]["ai_question_limit"] is None
    print("   [PASS] TEST 7: Account upgraded to Premium. Plan = premium, limit = Unlimited (None).")

    # 8. Upgraded user can now ask Question 4, 5, etc. without limit
    print("TEST 8: Asking Question 4 and Question 5 as Premium user...")
    q4_prem_res = requests.post(f"{BASE_URL}/tutor/ask", headers=headers, json={
        "question": "What is an AVL tree and why does it rotate?",
        "topic": "Trees"
    })
    assert q4_prem_res.status_code == 200
    q4_prem_data = q4_prem_res.json()
    assert q4_prem_data["success"] is True, f"Premium ask failed: {q4_prem_data}"
    assert q4_prem_data["data"]["is_premium"] is True
    assert q4_prem_data["data"]["ai_questions_used"] == 4
    assert q4_prem_data["data"]["remaining_questions"] is None
    print("   [PASS] TEST 8a: Question 4 succeeded for Premium user (used=4, limit=unlimited).")

    q5_prem_res = requests.post(f"{BASE_URL}/tutor/ask", headers=headers, json={
        "question": "Explain red-black tree color invariants.",
        "topic": "Trees"
    })
    assert q5_prem_res.status_code == 200
    q5_prem_data = q5_prem_res.json()
    assert q5_prem_data["success"] is True
    assert q5_prem_data["data"]["ai_questions_used"] == 5
    assert q5_prem_data["data"]["remaining_questions"] is None
    print("   [PASS] TEST 8b: Question 5 succeeded for Premium user (used=5, limit=unlimited).")

    # 9. Core features remain 100% free and functional for both plans
    print("TEST 9: Verifying core features (diagnostics, study plans, knowledge tracking)...")
    diag_gen = requests.post(f"{BASE_URL}/diagnostic/generate", headers=headers, json={
        "subject_name": "Data Structures",
        "topics": ["Arrays", "Recursion"],
        "exam_date": "2026-10-30"
    })
    assert diag_gen.status_code == 200 and len(diag_gen.json()["data"]["questions"]) > 0
    
    plan_res = requests.get(f"{BASE_URL}/plan", headers=headers)
    assert plan_res.status_code == 200

    know_res = requests.get(f"{BASE_URL}/knowledge/results", headers=headers)
    assert know_res.status_code == 200
    print("   [PASS] TEST 9: Diagnostic generation, planning, and knowledge state are 100% functional.")

    # 10. Run Full Academic Demo Flow
    print("TEST 10: Validating full-stack academic demo flow with AI gating...")
    from backend.tests.test_academic_demo import run_academic_demo_flow
    run_academic_demo_flow()
    print("   [PASS] TEST 10: Full-stack academic demo scenario completed without error.")

    print("\n=======================================================")
    print("ALL 10/10 AI FEATURE GATING AND CORE TESTS PASSED!")
    print("=======================================================\n")

if __name__ == "__main__":
    run_test_suite()
