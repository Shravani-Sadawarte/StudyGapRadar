from sqlalchemy.orm import Session
from datetime import datetime, date
import json
from typing import List, Dict, Any, Tuple, Optional
from backend.models import Question, AssessmentAttempt, AssessmentAnswer, TopicMastery, Topic
from backend.services.progress_service import log_agent_event

# Baseline Question Bank covering all curriculum topics to resolve missing questions
BASELINE_QUESTIONS = [
    # --- Recursion (4) ---
    {
        "topic": "Recursion",
        "prompt": "A developer writes a recursive algorithm that explores both branches of a decision tree at every level. The tree has depth n, and each node performs O(1) work. Which time complexity best describes the algorithm?",
        "options": ["O(n)", "O(log n)", "O(2^n)", "O(1)"],
        "correct_index": 2,
        "explanation": "Each level doubles the number of calls, yielding 2^n leaf nodes. With O(1) work per node the total is O(2^n).",
        "difficulty": "medium",
        "type": "diagnostic"
    },
    {
        "topic": "Recursion",
        "prompt": "A team is optimizing a recursive function that recomputes the same subproblems repeatedly. Which technique most directly eliminates the redundant work?",
        "options": ["Switching to a while loop", "Memoization (caching subproblem results)", "Increasing the recursion limit", "Using a global variable for the counter"],
        "correct_index": 1,
        "explanation": "Memoization caches results of subproblems so each is solved once, turning exponential recursion into polynomial time.",
        "difficulty": "easy",
        "type": "diagnostic"
    },
    {
        "topic": "Recursion",
        "prompt": "A recursive function has no base case. What is the most likely runtime consequence?",
        "options": ["It returns null immediately", "It runs in O(1) time", "It recurses until the call stack overflows", "It automatically converts to iteration"],
        "correct_index": 2,
        "explanation": "Without a base case the function never stops recursing, exhausting the call stack and causing a stack overflow.",
        "difficulty": "easy",
        "type": "diagnostic"
    },
    {
        "topic": "Recursion",
        "prompt": "Given the recurrence T(n) = 2T(n/2) + n, which asymptotic bound applies?",
        "options": ["O(n)", "O(n log n)", "O(n^2)", "O(2^n)"],
        "correct_index": 1,
        "explanation": "This is the classic merge-sort recurrence; by Master Theorem it solves to O(n log n).",
        "difficulty": "hard",
        "type": "diagnostic"
    },

    # --- Arrays (4) ---
    {
        "topic": "Arrays",
        "prompt": "An application needs O(1) lookups by student ID for a fixed, known set of 10,000 records. Which structure is the most space-efficient choice that still meets the time requirement?",
        "options": ["A sorted array with binary search", "A direct-address array indexed by ID", "A linked list scanned linearly", "A binary search tree"],
        "correct_index": 1,
        "explanation": "When keys are dense integers, a direct-address array gives O(1) lookup with minimal overhead and no collisions.",
        "difficulty": "easy",
        "type": "diagnostic"
    },
    {
        "topic": "Arrays",
        "prompt": "You must insert an element at the front of a dynamic array currently holding n elements. What is the worst-case time cost of the operation (ignoring amortization)?",
        "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        "correct_index": 2,
        "explanation": "Inserting at the front requires shifting all n existing elements right by one position, which is O(n).",
        "difficulty": "medium",
        "type": "diagnostic"
    },
    {
        "topic": "Arrays",
        "prompt": "A circular buffer of capacity C is implemented on a fixed array with head and tail indices. The buffer is full when:",
        "options": ["head == tail", "(tail + 1) mod C == head", "tail - head == C", "head == 0 and tail == C - 1"],
        "correct_index": 1,
        "explanation": "In the standard one-slot-open scheme, the buffer is full when advancing tail by one lands on head, i.e. (tail + 1) mod C == head.",
        "difficulty": "medium",
        "type": "diagnostic"
    },
    {
        "topic": "Arrays",
        "prompt": "A team wants to find the single number that appears once in an array where every other number appears exactly twice. Which approach runs in O(n) time and O(1) extra space?",
        "options": ["Sort the array and scan adjacent pairs", "Use a hash set to track seen values", "XOR all the elements together", "Maintain a frequency array"],
        "correct_index": 2,
        "explanation": "XOR is associative and commutative, and x ^ x = 0. XOR-ing all values cancels the pairs, leaving the unique value in O(n) time and O(1) space.",
        "difficulty": "hard",
        "type": "diagnostic"
    },

    # --- Trees (4) ---
    {
        "topic": "Trees",
        "prompt": "A binary search tree has become skewed to one side, degrading search to O(n). Which traversal of a balanced BST yields keys in sorted order?",
        "options": ["Pre-order", "In-order", "Post-order", "Level-order"],
        "correct_index": 1,
        "explanation": "In-order traversal (left, root, right) of a BST visits keys in ascending sorted order.",
        "difficulty": "easy",
        "type": "diagnostic"
    },
    {
        "topic": "Trees",
        "prompt": "In an AVL tree, after an insertion the balance factor of a node becomes +2 and its left child has balance factor +1. Which rotation restores balance?",
        "options": ["Left rotation", "Right rotation", "Left-Right rotation", "Right-Left rotation"],
        "correct_index": 1,
        "explanation": "A +2 imbalance with a +1 left child is the left-left case, fixed by a single right rotation.",
        "difficulty": "medium",
        "type": "diagnostic"
    },
    {
        "topic": "Trees",
        "prompt": "A min-heap is stored as an array with 0-based indexing. For the element at index i, where is its parent?",
        "options": ["i / 2", "(i - 1) / 2", "2i + 1", "2i + 2"],
        "correct_index": 1,
        "explanation": "In a 0-indexed array heap, the parent of index i is at (i - 1) / 2 (integer division).",
        "difficulty": "medium",
        "type": "diagnostic"
    },
    {
        "topic": "Trees",
        "prompt": "Which statement about a complete binary tree with n nodes is always true?",
        "options": ["Its height is exactly log2(n)", "Its height is floor(log2(n))", "It is always a valid BST", "It has exactly n/2 leaf nodes"],
        "correct_index": 1,
        "explanation": "A complete binary tree fills levels left to right; with n nodes its height is floor(log2(n)).",
        "difficulty": "hard",
        "type": "diagnostic"
    },

    # --- Linked Lists (4) (Resolves previously empty topic bug) ---
    {
        "topic": "Linked Lists",
        "prompt": "What is the primary advantage of a singly linked list over a dynamic array?",
        "options": ["O(1) random access by index", "O(1) insertion at the beginning without shifting", "Lower cache locality overhead", "Smaller memory footprint per element"],
        "correct_index": 1,
        "explanation": "Inserting at the head of a linked list requires only updating a pointer in O(1) time without shifting elements.",
        "difficulty": "easy",
        "type": "diagnostic"
    },
    {
        "topic": "Linked Lists",
        "prompt": "Floyd's Cycle-Finding Algorithm (Tortoise and Hare) detects a loop in a linked list using:",
        "options": ["A hash map of visited pointers", "Two pointers moving at speeds of 1 and 2 steps", "Reversing the list in place", "Recursion until null"],
        "correct_index": 1,
        "explanation": "Floyd's algorithm advances the slow pointer by 1 step and the fast pointer by 2 steps. If a loop exists, they must meet.",
        "difficulty": "medium",
        "type": "diagnostic"
    },
    {
        "topic": "Linked Lists",
        "prompt": "You need to delete a node in a singly linked list given only a pointer to that node (not head), which is not the tail. How can this be done in O(1)?",
        "options": ["Iterate from the node backwards", "Copy the next node's data into this node and delete the next node", "Set current node's next to null", "It is impossible without the head"],
        "correct_index": 1,
        "explanation": "By copying next->data into current->data and advancing current->next to skip the next node, we delete the value in O(1).",
        "difficulty": "medium",
        "type": "diagnostic"
    },
    {
        "topic": "Linked Lists",
        "prompt": "Which operation in a singly linked list with only a head pointer takes O(n) time?",
        "options": ["Inserting at head", "Deleting head", "Deleting the last element", "Checking if empty"],
        "correct_index": 2,
        "explanation": "Deleting the last element requires traversing to the second-to-last element to update its next pointer to null, taking O(n) time.",
        "difficulty": "hard",
        "type": "diagnostic"
    },

    # --- Practice / Quiz Questions ---
    {
        "topic": "Recursion",
        "prompt": "A junior engineer writes a recursive factorial function but forgets to return the recursive call. What symptom appears at runtime?",
        "options": ["Infinite recursion and stack overflow", "Returns the correct value", "Returns undefined/None for n > 1", "Throws a syntax error at parse time"],
        "correct_index": 2,
        "explanation": "Without returning the recursive result, only the base case returns a value while other calls return None/undefined.",
        "difficulty": "medium",
        "type": "quiz"
    },
    {
        "topic": "Recursion",
        "prompt": "Tail recursion is optimizable into iteration when:",
        "options": ["The recursive call is the last operation and nothing runs after it returns", "The function has no parameters", "The function returns a number", "The base case returns 0"],
        "correct_index": 0,
        "explanation": "Tail-call optimization applies when the recursive call is the final action with no pending work, allowing stack frame reuse.",
        "difficulty": "medium",
        "type": "quiz"
    },
    {
        "topic": "Recursion",
        "prompt": "Which problem is most naturally expressed with multiple recursive branches (divide and conquer)?",
        "options": ["Computing the sum of an array iteratively", "Merge sort splitting the array in half", "Reversing a linked list with three pointers", "Counting characters in a string"],
        "correct_index": 1,
        "explanation": "Merge sort recursively splits the array into halves and merges sorted results — the canonical divide-and-conquer pattern.",
        "difficulty": "medium",
        "type": "quiz"
    },
    {
        "topic": "Trees",
        "prompt": "What is the maximum number of nodes at depth d of a binary tree (root at depth 0)?",
        "options": ["2^d", "2^(d+1) - 1", "d^2", "2d"],
        "correct_index": 0,
        "explanation": "At depth d, each level doubles the previous level's maximum nodes, resulting in 2^d nodes.",
        "difficulty": "medium",
        "type": "quiz"
    },
    {
        "topic": "Trees",
        "prompt": "In a Red-Black tree, which property guarantees that the longest path is at most twice as long as the shortest path?",
        "options": ["Root is always red", "Every leaf (NIL) is black, and every red node has black children", "No two black nodes can be adjacent", "Height is always strictly log2(n)"],
        "correct_index": 1,
        "explanation": "Since red nodes cannot have red children and every path has the same number of black nodes, the path length variation is bounded by a factor of 2.",
        "difficulty": "hard",
        "type": "quiz"
    },
    {
        "topic": "Arrays",
        "prompt": "What is the amortized time complexity of appending an element to a dynamic array of size n that doubles capacity when full?",
        "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
        "correct_index": 0,
        "explanation": "While occasional resizing takes O(n), spreading the doubling cost across all n insertions yields an amortized cost of O(1).",
        "difficulty": "medium",
        "type": "quiz"
    }
]

def seed_baseline_questions(db: Session):
    """Seed baseline question bank if questions table is empty."""
    count = db.query(Question).count()
    if count == 0:
        for q_data in BASELINE_QUESTIONS:
            q = Question(
                topic_name=q_data["topic"],
                prompt=q_data["prompt"],
                options_json=json.dumps(q_data["options"]),
                correct_index=q_data["correct_index"],
                explanation=q_data["explanation"],
                difficulty=q_data["difficulty"],
                question_type=q_data["type"]
            )
            db.add(q)
        db.commit()

def generate_diagnostic(
    db: Session,
    user_id: str,
    subject_name: str,
    topics: List[str],
    exam_date: Optional[str]
) -> Tuple[AssessmentAttempt, List[Dict[str, Any]]]:
    """Create a diagnostic assessment session with selected topic questions."""
    seed_baseline_questions(db)

    attempt = AssessmentAttempt(
        user_id=user_id,
        subject_name=subject_name,
        exam_date=exam_date,
        status="in_progress"
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    # Fetch questions for selected topics
    questions = (
        db.query(Question)
        .filter(Question.topic_name.in_(topics), Question.question_type == "diagnostic")
        .all()
    )

    # If some topics lack diagnostic questions, pick from quiz or general
    if len(questions) < len(topics) * 4:
        all_topic_qs = db.query(Question).filter(Question.topic_name.in_(topics)).all()
        questions = all_topic_qs

    attempt.total_questions = len(questions)
    db.commit()

    log_agent_event(
        db=db,
        user_id=user_id,
        agent_name="AssessmentAgent",
        action="Diagnostic Generated",
        detail=f"Created diagnostic session for '{subject_name}' with {len(questions)} questions across {len(topics)} topics ({', '.join(topics)})."
    )

    # Format for student (omitting correct_index to prevent leakage)
    client_questions = [
        {
            "id": q.id,
            "topic": q.topic_name,
            "prompt": q.prompt,
            "options": json.loads(q.options_json),
            "difficulty": q.difficulty
        }
        for q in questions
    ]

    return attempt, client_questions

def submit_diagnostic(
    db: Session,
    user_id: str,
    attempt_id: str,
    submitted_answers: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Grade diagnostic assessment and calculate deterministic mastery & priority rankings."""
    attempt = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.id == attempt_id,
        AssessmentAttempt.user_id == user_id
    ).first()

    if not attempt:
        raise ValueError("Assessment attempt not found")

    # Record answers
    correct_total = 0
    topic_data: Dict[str, Dict[str, Any]] = {}

    for ans in submitted_answers:
        q_id = ans["question_id"]
        sel_idx = ans.get("selected_index")
        question = db.query(Question).filter(Question.id == q_id).first()
        if not question:
            continue

        topic = question.topic_name
        if topic not in topic_data:
            topic_data[topic] = {
                "correct": 0,
                "attempted": 0,
                "total": 0,
                "answers": []
            }

        topic_data[topic]["total"] += 1
        is_unattempted = sel_idx is None
        is_correct = False
        if not is_unattempted:
            topic_data[topic]["attempted"] += 1
            if sel_idx == question.correct_index:
                is_correct = True
                topic_data[topic]["correct"] += 1
                correct_total += 1

        ans_status = "correct" if is_correct else ("unattempted" if is_unattempted else "incorrect")

        db_answer = AssessmentAnswer(
            attempt_id=attempt.id,
            question_id=question.id,
            topic_name=topic,
            selected_index=sel_idx,
            status=ans_status
        )
        db.add(db_answer)

        topic_data[topic]["answers"].append({
            "question_id": question.id,
            "prompt": question.prompt,
            "options": json.loads(question.options_json),
            "selected_index": sel_idx,
            "correct_index": question.correct_index,
            "status": ans_status,
            "explanation": question.explanation
        })

    attempt.status = "completed"
    attempt.total_score = correct_total
    attempt.completed_at = datetime.utcnow()

    # Calculate deterministic topic mastery and priorities:
    # 70% severity + 30% exam urgency
    results = []
    for topic, stats in topic_data.items():
        correct = stats["correct"]
        attempted = stats["attempted"]
        total = stats["total"]

        # Status rule:
        # If attempted < 4 or attempted < total => insufficient-evidence
        if attempted < 4 or attempted < total:
            status = "insufficient-evidence"
        else:
            pct = (correct / attempted) * 100
            status = "solid" if pct >= 75.0 else "needs-attention"

        # Severity
        severity = 1.0 - (correct / attempted) if attempted > 0 else 1.0

        # Exam urgency
        urgency = 0.0
        if attempt.exam_date:
            try:
                exam_d = datetime.strptime(attempt.exam_date, "%Y-%m-%d").date()
                days = max(0, (exam_d - date.today()).days)
                urgency = max(0.0, 1.0 - days / 60.0)
            except Exception:
                pass

        priority_score = round(0.7 * severity + 0.3 * urgency, 4)
        mastery_pct = round((correct / max(1, total)) * 100.0, 1)

        # Recommended action
        if status == "needs-attention":
            action = f"Targeted practice required for {topic} ({correct}/{total} correct)."
        elif status == "solid":
            action = f"Mastery confirmed ({correct}/{total}). Ready for periodic revision."
        else:
            action = f"More diagnostic evidence required to verify {topic} mastery."

        # Update or create TopicMastery in DB
        tm = db.query(TopicMastery).filter(
            TopicMastery.user_id == user_id,
            TopicMastery.topic_name == topic
        ).first()

        if not tm:
            tm = TopicMastery(
                user_id=user_id,
                subject_name=attempt.subject_name,
                topic_name=topic
            )
            db.add(tm)

        tm.correct_count = correct
        tm.attempted_count = attempted
        tm.total_count = total
        tm.mastery_percentage = mastery_pct
        tm.status = status
        tm.severity = severity
        tm.urgency = urgency
        tm.priority_score = priority_score
        tm.recommended_action = action

        results.append({
            "topic": topic,
            "correct": correct,
            "attempted": attempted,
            "total": total,
            "status": status,
            "mastery_percentage": mastery_pct,
            "severity": round(severity, 2),
            "urgency": round(urgency, 2),
            "priority_score": priority_score,
            "recommended_action": action,
            "answers": stats["answers"]
        })

    # Sort results by priority score descending
    results.sort(key=lambda x: x["priority_score"], reverse=True)

    log_agent_event(
        db=db,
        user_id=user_id,
        agent_name="KnowledgeAgent",
        action="Mastery & Gaps Evaluated",
        detail=f"Evaluated diagnostic results for {len(results)} topics. Identified {len([r for r in results if r['status'] == 'needs-attention'])} priority gaps."
    )

    db.commit()
    return {
        "attempt_id": attempt.id,
        "subject": attempt.subject_name,
        "exam_date": attempt.exam_date,
        "topics": results,
        "created_at": attempt.completed_at.isoformat() if attempt.completed_at else datetime.utcnow().isoformat()
    }
