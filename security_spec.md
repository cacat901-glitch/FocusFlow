# Security Specification & Adversarial Verification Spec

This specification outlines the data invariants, zero-trust rules, and test payloads designed to secure the ADHD Brain Dashboard database from compromise or data leakages.

## 1. Data Invariants
1. **User Ownership**: User profiles, routines, routine steps, tasks, focus sessions, and streaks must always belong to the user authenticated via `request.auth.uid`.
2. **Path Hardening**: Path parameter IDs must be validated to prevent ID poisoning and Denial of Wallet size overflows.
3. **No Blanket Reads**: All listing operations must check ownership boundaries on resource records.

## 2. The "Dirty Dozen" Malicious Payloads

The following attack payloads represent standard threat scenarios. The firestore security rules must reject all of them with `PERMISSION_DENIED`:

1. **Payload 1: Identity Spoofing (Create User Profile as Someone Else)**
   - Path: `/users/victim_user_123`
   - Content: `{ "id": "prof-1", "user_id": "victim_user_123", "display_name": "Infiltrator", "avatar_emoji": "😈", "total_xp": 99999, "created_at": "2026-06-09T00:00:00Z" }` (No authenticated UID, or UID does not match victim)

2. **Payload 2: Shadow Key Attack (Profile Creation with Extra Permissions/Privileges)**
   - Path: `/users/attacker_user_456`
   - Content: `{ "id": "prof-2", "user_id": "attacker_user_456", "display_name": "Hacker", "avatar_emoji": "🚀", "total_xp": 0, "created_at": "2026-06-09T00:00:00Z", "premium_status": "premium" }` (Self-assigning "premium" role or status on signup)

3. **Payload 3: Resource Poisoning (Extremely Large String ID Attack)**
   - Path: `/users/attacker_user_a1b2c3d4e5f6g7h8...` (IDs longer than 128 characters)
   - Content: Basic schema but with an over-dimensioned ID value.

4. **Payload 4: Orphaned Routine Write (Unauthorized Routine Assignment)**
   - Path: `/routines/victim_routine`
   - Content: `{ "id": "victim_routine", "user_id": "victim_user_123", "name": "Hack Morning", "emoji": "🌅", "time_of_day": "morning", "is_active": true, "created_at": "2026-06-09T00:00:00Z" }` (Written by standard user 456)

5. **Payload 5: Mass Update-Gap Attack (Altering Someone Else's Routine name)**
   - Path: `/routines/victim_routine`
   - Operation: Update
   - Content: `{ "name": "Defaced Routine" }` where `existing().user_id != auth.uid`

6. **Payload 6: Unauthenticated Task Manipulation (Write task unsigned)**
   - Path: `/tasks/task_evil_99`
   - Content: `{ "id": "task_evil_99", "user_id": "victim", "title": "Phishing Task", "is_completed": false, "priority": "high", "created_at": "2026-06-09T00:00:00Z" }`

7. **Payload 7: Denial of Wallet Read (Blanket list query over users' tasks)**
   - Query: `db.collection('tasks').get()` without owner filtering constraints.

8. **Payload 8: Temporal Timestamp Hijacking (Artificial creation date)**
   - Path: `/tasks/task_temp_1`
   - Content: `{ "id": "task_temp_1", "user_id": "my_uid", "title": "Fake time", "is_completed": false, "priority": "low", "created_at": "2010-01-01T00:00:00Z" }` (Violates client timestamp restriction rule)

9. **Payload 9: Sibling Invariant Hack (Creating a RoutineStep with mismatched routine_id parent reference)**
   - Path: `/routines/routine_attacker/steps/step_attacker`
   - Content: `{ "id": "step_attacker", "routine_id": "victim_routine_uuid", "title": "Phished step", "duration_minutes": 5, "order_index": 0, "emoji": "👾", "created_at": "2026-06-09T00:00:00Z" }`

10. **Payload 10: State Shortcut (Direct streak injection over 1000 days)**
    - Path: `/streaks/streak_user_1`
    - Content: `{ "id": "streak_user_1", "user_id": "user_1", "current_streak": 99999, "longest_streak": 99999, "last_active_date": "2026-06-09", "updated_at": "2026-06-09T00:00:00Z" }`

11. **Payload 11: System Key Hijack (Altering XP directly via patch)**
    - Path: `/users/user_1`
    - Operation: Update
    - Content: Incrementing total_xp to 1,000,000 without completing sessions or routine achievements.

12. **Payload 12: Invalid Type Injection (Booleans as Titles)**
    - Path: `/tasks/task_bool`
    - Content: `{ "id": "task_bool", "user_id": "my_uid", "title": true, "is_completed": false, "priority": "low", "created_at": "2026-06-09T00:00:00Z" }`

## 3. Test Runner Definition
Verification tests are executed inside the framework. The strict security rule validation locks out these payloads dynamically prior to production shipping.
