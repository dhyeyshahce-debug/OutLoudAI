export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export type Problem = {
  slug: string
  title: string
  difficulty: Difficulty
  topic: string
  prompt: string
  examples: { input: string; output: string }[]
  checklist: string[]
}

export type ScoreBreakdown = {
  communication: number
  approach: number
  complexity: number
  edgeCases: number
}

export type Session = {
  id: string
  problem: string
  difficulty: Difficulty
  score: number
  date: string
  feedback: string
  duration: string
}

export const CURRENT_USER = {
  name: 'Aarav',
  fullName: 'Aarav Sharma',
  email: 'aarav@outloud.ai',
  initials: 'AS',
}

export const PROBLEMS: Problem[] = [
  {
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    topic: 'Arrays & Hashing',
    prompt:
      'Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target. You may assume that each input has exactly one solution, and you may not use the same element twice.',
    examples: [
      { input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]' },
      { input: 'nums = [3, 2, 4], target = 6', output: '[1, 2]' },
    ],
    checklist: [
      'Restate the problem in your own words',
      'Describe a brute-force baseline',
      'Explain your optimal approach out loud',
      'State time and space complexity',
      'Walk through the edge cases',
    ],
  },
  {
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    topic: 'Stack',
    prompt:
      'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid. An input string is valid if open brackets are closed by the same type in the correct order.',
    examples: [
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
    ],
    checklist: [
      'Restate the problem in your own words',
      'Identify the data structure that fits',
      'Explain the push/pop logic out loud',
      'State time and space complexity',
      'Walk through the edge cases',
    ],
  },
  {
    slug: 'longest-substring',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    topic: 'Sliding Window',
    prompt:
      'Given a string s, find the length of the longest substring without repeating characters.',
    examples: [
      { input: 's = "abcabcbb"', output: '3' },
      { input: 's = "bbbbb"', output: '1' },
    ],
    checklist: [
      'Restate the problem in your own words',
      'Explain the sliding-window intuition',
      'Describe how the window shrinks and grows',
      'State time and space complexity',
      'Walk through the edge cases',
    ],
  },
  {
    slug: 'merge-intervals',
    title: 'Merge Intervals',
    difficulty: 'Medium',
    topic: 'Intervals',
    prompt:
      'Given an array of intervals where intervals[i] = [start, end], merge all overlapping intervals and return an array of the non-overlapping intervals that cover all the intervals in the input.',
    examples: [
      { input: '[[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]' },
    ],
    checklist: [
      'Restate the problem in your own words',
      'Explain why sorting helps',
      'Describe the merge condition out loud',
      'State time and space complexity',
      'Walk through the edge cases',
    ],
  },
]

export const RECENT_SESSIONS: Session[] = [
  {
    id: 's-104',
    problem: 'Two Sum',
    difficulty: 'Easy',
    score: 84,
    date: 'Aug 18, 2026',
    feedback: 'Clear hash-map reasoning, tighten the space trade-off.',
    duration: '3:42',
  },
  {
    id: 's-103',
    problem: 'Valid Parentheses',
    difficulty: 'Easy',
    score: 91,
    date: 'Aug 16, 2026',
    feedback: 'Excellent structure and stack explanation.',
    duration: '2:58',
  },
  {
    id: 's-102',
    problem: 'Longest Substring',
    difficulty: 'Medium',
    score: 76,
    date: 'Aug 14, 2026',
    feedback: 'Good window intuition, clarify pointer movement.',
    duration: '5:12',
  },
  {
    id: 's-101',
    problem: 'Merge Intervals',
    difficulty: 'Medium',
    score: 79,
    date: 'Aug 11, 2026',
    feedback: 'Solid sort-first approach, discuss ties.',
    duration: '4:36',
  },
  {
    id: 's-100',
    problem: 'Group Anagrams',
    difficulty: 'Medium',
    score: 88,
    date: 'Aug 9, 2026',
    feedback: 'Very well communicated hashing key idea.',
    duration: '4:02',
  },
]

export const DASHBOARD_STATS = [
  { label: 'Sessions Completed', value: '27', delta: '+4 this week' },
  { label: 'Average Score', value: '83', delta: '+6 pts' },
  { label: 'Current Streak', value: '6 days', delta: 'Personal best' },
  { label: 'Problems Practiced', value: '19', delta: '+3 new' },
]

export const RESULT = {
  problem: 'Two Sum',
  difficulty: 'Easy' as Difficulty,
  overall: 84,
  duration: '3:42',
  breakdown: [
    {
      key: 'communication',
      label: 'Communication',
      score: 88,
      note: 'Your explanation was structured and easy to follow.',
    },
    {
      key: 'approach',
      label: 'Algorithmic Approach',
      score: 91,
      note: 'You identified the hash map approach efficiently.',
    },
    {
      key: 'complexity',
      label: 'Complexity',
      score: 82,
      note: 'Explain the space trade-off more explicitly.',
    },
    {
      key: 'edgeCases',
      label: 'Edge Cases',
      score: 76,
      note: 'Consider discussing duplicate values and empty input.',
    },
  ],
  coach:
    "Great job identifying the hash map approach. Your explanation was concise and technically sound. Consider discussing duplicate values and edge cases more explicitly, and state the space complexity trade-off before you jump into the walkthrough.",
  transcript: [
    { text: 'So the problem is asking me to find two numbers in the array that add up to the ', term: null },
    { text: 'target', term: true },
    { text: '. The brute-force way would be to check every pair, which is ', term: null },
    { text: 'O(n squared)', term: true },
    { text: ' time. Instead, I can use a ', term: null },
    { text: 'hash map', term: true },
    { text: ' to store each value and its index as I iterate. For each number I check whether ', term: null },
    { text: 'target minus current', term: true },
    { text: ' already exists in the map. That gives me ', term: null },
    { text: 'O(n)', term: true },
    { text: ' time and ', term: null },
    { text: 'O(n)', term: true },
    { text: ' space. One edge case I should mention is handling duplicate values correctly.', term: null },
  ],
}

export const PROGRESS_STATS = [
  { label: 'Total Sessions', value: '27' },
  { label: 'Average Score', value: '83' },
  { label: 'Best Score', value: '94' },
  { label: 'Current Streak', value: '6 days' },
]

export const SCORE_OVER_TIME = [
  { label: 'Jul 21', score: 62 },
  { label: 'Jul 28', score: 68 },
  { label: 'Aug 4', score: 71 },
  { label: 'Aug 9', score: 79 },
  { label: 'Aug 14', score: 76 },
  { label: 'Aug 16', score: 88 },
  { label: 'Aug 18', score: 84 },
]

export const SKILL_TRENDS = [
  { label: 'Communication', score: 88, color: 'var(--chart-1)' },
  { label: 'Complexity', score: 80, color: 'var(--chart-2)' },
  { label: 'Edge-case awareness', score: 74, color: 'var(--chart-3)' },
]

export const STRENGTHS = [
  'Clear, structured verbal walkthroughs',
  'Quickly identifies optimal data structures',
  'Confident pacing without long pauses',
]

export const FOCUS_AREAS = [
  'State space complexity trade-offs explicitly',
  'Enumerate edge cases before coding',
  'Discuss duplicate and empty-input handling',
]

export function scoreTone(score: number) {
  if (score >= 85) return 'high'
  if (score >= 70) return 'mid'
  return 'low'
}
// ─── Aliases & data for the Dashboard page ───────────────────────────
// The dashboard imports these names; they map to / extend the core data above.

export const currentUser = {
  name: CURRENT_USER.fullName,
  email: CURRENT_USER.email,
  initials: CURRENT_USER.initials,
  avatar: "/placeholder.svg" as string | null,
}

export type Scenario = {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  emoji: string
  duration: string
}

export const scenarios: Scenario[] = PROBLEMS.map((p) => ({
  id: p.slug,
  title: p.title,
  description: p.prompt.slice(0, 100) + '…',
  difficulty: p.difficulty,
  emoji: p.difficulty === 'Easy' ? '🟢' : p.difficulty === 'Medium' ? '🟡' : '🔴',
  duration: p.difficulty === 'Easy' ? '3 min' : p.difficulty === 'Medium' ? '5 min' : '8 min',
}))

export type SessionHistory = {
  id: string
  title: string
  difficulty: Difficulty
  score: number
  date: string
  emoji: string
}

export const sessionHistory: SessionHistory[] = RECENT_SESSIONS.map((s) => ({
  id: s.id,
  title: s.problem,
  difficulty: s.difficulty,
  score: s.score,
  date: s.date,
  emoji: s.difficulty === 'Easy' ? '🟢' : s.difficulty === 'Medium' ? '🟡' : '🔴',
}))

export const weeklyActivity = [
  { day: 'Mon', minutes: 18 },
  { day: 'Tue', minutes: 25 },
  { day: 'Wed', minutes: 12 },
  { day: 'Thu', minutes: 30 },
  { day: 'Fri', minutes: 22 },
  { day: 'Sat', minutes: 8 },
  { day: 'Sun', minutes: 15 },
]
