import type { Question } from './types';

export const DIAGNOSTIC_QUESTIONS: Question[] = [
  // --- Recursion (4) ---
  {
    id: 'rec-d1',
    topic: 'Recursion',
    prompt:
      'A developer writes a recursive algorithm that explores both branches of a decision tree at every level. The tree has depth n, and each node performs O(1) work. Which time complexity best describes the algorithm?',
    options: ['O(n)', 'O(log n)', 'O(2^n)', 'O(1)'],
    correctIndex: 2,
    explanation:
      'Each level doubles the number of calls, yielding 2^n leaf nodes. With O(1) work per node the total is O(2^n).',
  },
  {
    id: 'rec-d2',
    topic: 'Recursion',
    prompt:
      'A team is optimizing a recursive function that recomputes the same subproblems repeatedly. Which technique most directly eliminates the redundant work?',
    options: [
      'Switching to a while loop',
      'Memoization (caching subproblem results)',
      'Increasing the recursion limit',
      'Using a global variable for the counter',
    ],
    correctIndex: 1,
    explanation:
      'Memoization caches results of subproblems so each is solved once, turning exponential recursion into polynomial time.',
  },
  {
    id: 'rec-d3',
    topic: 'Recursion',
    prompt:
      'A recursive function has no base case. What is the most likely runtime consequence?',
    options: [
      'It returns null immediately',
      'It runs in O(1) time',
      'It recurses until the call stack overflows',
      'It automatically converts to iteration',
    ],
    correctIndex: 2,
    explanation:
      'Without a base case the function never stops recursing, exhausting the call stack and causing a stack overflow.',
  },
  {
    id: 'rec-d4',
    topic: 'Recursion',
    prompt:
      'Given the recurrence T(n) = 2T(n/2) + n, which asymptotic bound applies?',
    options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(2^n)'],
    correctIndex: 1,
    explanation:
      'This is the classic merge-sort recurrence; by the Master Theorem it solves to O(n log n).',
  },

  // --- Arrays (4) ---
  {
    id: 'arr-d1',
    topic: 'Arrays',
    prompt:
      'An application needs O(1) lookups by student ID for a fixed, known set of 10,000 records. Which structure is the most space-efficient choice that still meets the time requirement?',
    options: [
      'A sorted array with binary search',
      'A direct-address array indexed by ID',
      'A linked list scanned linearly',
      'A binary search tree',
    ],
    correctIndex: 1,
    explanation:
      'When keys are dense integers, a direct-address array gives O(1) lookup with minimal overhead and no collisions.',
  },
  {
    id: 'arr-d2',
    topic: 'Arrays',
    prompt:
      'You must insert an element at the front of a dynamic array currently holding n elements. What is the worst-case time cost of the operation (ignoring amortization)?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctIndex: 2,
    explanation:
      'Inserting at the front requires shifting all n existing elements right by one position, which is O(n).',
  },
  {
    id: 'arr-d3',
    topic: 'Arrays',
    prompt:
      'A circular buffer of capacity C is implemented on a fixed array with head and tail indices. The buffer is full when:',
    options: [
      'head == tail',
      '(tail + 1) mod C == head',
      'tail - head == C',
      'head == 0 and tail == C - 1',
    ],
    correctIndex: 1,
    explanation:
      'In the standard one-slot-open scheme, the buffer is full when advancing tail by one lands on head, i.e. (tail + 1) mod C == head.',
  },
  {
    id: 'arr-d4',
    topic: 'Arrays',
    prompt:
      'A team wants to find the single number that appears once in an array where every other number appears exactly twice. Which approach runs in O(n) time and O(1) extra space?',
    options: [
      'Sort the array and scan adjacent pairs',
      'Use a hash set to track seen values',
      'XOR all the elements together',
      'Maintain a frequency array',
    ],
    correctIndex: 2,
    explanation:
      'XOR is associative and commutative, and x ^ x = 0. XOR-ing all values cancels the pairs, leaving the unique value in O(n) time and O(1) space.',
  },

  // --- Trees (4) ---
  {
    id: 'tre-d1',
    topic: 'Trees',
    prompt:
      'A binary search tree has become skewed to one side, degrading search to O(n). Which traversal of a balanced BST yields keys in sorted order?',
    options: ['Pre-order', 'In-order', 'Post-order', 'Level-order'],
    correctIndex: 1,
    explanation:
      'In-order traversal (left, root, right) of a BST visits keys in ascending sorted order.',
  },
  {
    id: 'tre-d2',
    topic: 'Trees',
    prompt:
      'In an AVL tree, after an insertion the balance factor of a node becomes +2 and its left child has balance factor +1. Which rotation restores balance?',
    options: ['Left rotation', 'Right rotation', 'Left-Right rotation', 'Right-Left rotation'],
    correctIndex: 1,
    explanation:
      'A +2 imbalance with a +1 left child is the left-left case, fixed by a single right rotation.',
  },
  {
    id: 'tre-d3',
    topic: 'Trees',
    prompt:
      'A min-heap is stored as an array with 0-based indexing. For the element at index i, where is its parent?',
    options: ['i / 2', '(i - 1) / 2', '2i + 1', '2i + 2'],
    correctIndex: 1,
    explanation:
      'In a 0-indexed array heap, the parent of index i is at (i - 1) / 2 (integer division).',
  },
  {
    id: 'tre-d4',
    topic: 'Trees',
    prompt:
      'Which statement about a complete binary tree with n nodes is always true?',
    options: [
      'Its height is exactly log2(n)',
      'Its height is floor(log2(n))',
      'It is always a valid BST',
      'It has exactly n/2 leaf nodes',
    ],
    correctIndex: 1,
    explanation:
      'A complete binary tree fills levels left to right; with n nodes its height is floor(log2(n)).',
  },
];

export const PRACTICE_QUESTIONS: Question[] = [
  {
    id: 'rec-p1',
    topic: 'Recursion',
    prompt:
      'A junior engineer writes a recursive factorial function but forgets to return the recursive call (just calls it). What symptom appears at runtime?',
    options: [
      'Infinite recursion and stack overflow',
      'Returns the correct value',
      'Returns undefined for n > 1',
      'Throws a syntax error at parse time',
    ],
    correctIndex: 2,
    explanation:
      'Without returning the recursive result, the base case returns a value but every other path returns undefined, so factorial(n>1) is undefined.',
  },
  {
    id: 'rec-p2',
    topic: 'Recursion',
    prompt:
      'Tail recursion is optimizable into iteration when:',
    options: [
      'The recursive call is the last operation and nothing runs after it returns',
      'The function has no parameters',
      'The function returns a number',
      'The base case returns 0',
    ],
    correctIndex: 0,
    explanation:
      'Tail-call optimization applies when the recursive call is the final action with no pending work, allowing the frame to be reused.',
  },
  {
    id: 'rec-p3',
    topic: 'Recursion',
    prompt:
      'Which problem is most naturally expressed with multiple recursive branches (divide and conquer)?',
    options: [
      'Computing the sum of an array iteratively',
      'Merge sort splitting the array in half',
      'Reversing a linked list with three pointers',
      'Counting characters in a string',
    ],
    correctIndex: 1,
    explanation:
      'Merge sort recursively splits the array into halves and merges sorted results — the canonical divide-and-conquer pattern.',
  },
  {
    id: 'rec-p4',
    topic: 'Recursion',
    prompt:
      'Converting the recursive Fibonacci F(n) = F(n-1) + F(n-2) to an iterative bottom-up approach changes the time complexity from:',
    options: ['O(n) to O(log n)', 'O(2^n) to O(n)', 'O(n) to O(1)', 'O(n^2) to O(n log n)'],
    correctIndex: 1,
    explanation:
      'Naive recursive Fibonacci is O(2^n); an iterative bottom-up version computes each F(i) once, giving O(n).',
  },
  {
    id: 'rec-p5',
    topic: 'Recursion',
    prompt:
      'A recursive descent parser uses one recursive function per grammar rule. The recursion depth primarily depends on:',
    options: [
      'The number of grammar rules',
      'The nesting depth of the parsed structure',
      'The length of the source file in bytes',
      'The size of the token alphabet',
    ],
    correctIndex: 1,
    explanation:
      'Each level of nested grammar constructs adds a stack frame, so depth tracks the nesting depth of the parsed structure.',
  },
];

export const SUBJECTS = [
  {
    name: 'Data Structures',
    topics: ['Recursion', 'Arrays', 'Trees', 'Linked Lists'],
    defaultSelected: ['Recursion', 'Arrays', 'Trees'],
  },
];

export const BRANCHES = [
  'Computer Science & Engineering',
  'Mechanical Engineering',
  'Electronics & Communication Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Information Technology',
];

export const SEMESTERS = [
  'Semester 3',
  'Semester 4',
  'Semester 5',
  'Semester 6',
  'Semester 7',
  'Semester 8',
];

export const EXAM_GOALS = [
  'Semester Exams',
  'Midterms',
  'Internal Assessment',
];
