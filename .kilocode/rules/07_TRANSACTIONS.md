Transaction rules:

- Any multi-write operation must be transactional
- This includes:
  - squad membership + counts
  - XP logs + XP totals
  - stats + counters
- Partial updates are forbidden
