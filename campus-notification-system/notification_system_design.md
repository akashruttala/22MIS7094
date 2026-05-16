# Stage 1

## Core Actions for the Notification Platform

The campus notification system needs to support these core actions:

1. **Fetch Notifications** – Students should be able to see their notifications with support for pagination and type-based filtering
2. **Mark as Read** – Individual or bulk mark notifications as read
3. **Get Unread Count** – Quick badge count for the navbar
4. **Real-time Push** – New notifications should appear without manual page refresh

## REST API Design

### 1. Get All Notifications

`GET /api/v1/notifications`

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Accept: application/json
```

**Query Parameters:**
| Parameter         | Type    | Required | Description                              |
|-------------------|---------|----------|------------------------------------------|
| page              | int     | No       | Page number (default: 1)                 |
| limit             | int     | No       | Items per page (default: 20)             |
| notification_type | string  | No       | Filter: "Event", "Result", "Placement"   |
| unread_only       | boolean | No       | Show only unread notifications           |

**Response (200 OK):**
```json
{
  "notifications": [
    {
      "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
      "type": "Result",
      "message": "mid-sem results published",
      "timestamp": "2026-04-22T17:51:30Z",
      "isRead": false
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRecords": 98,
    "limit": 20
  }
}
```

### 2. Mark Single Notification as Read

`PATCH /api/v1/notifications/{id}/read`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### 3. Mark All as Read

`PATCH /api/v1/notifications/read-all`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "updatedCount": 14
}
```

### 4. Get Unread Count

`GET /api/v1/notifications/unread-count`

**Response (200 OK):**
```json
{
  "unreadCount": 14
}
```

### 5. Send Notification (Admin/System)

`POST /api/v1/notifications`

**Request Body:**
```json
{
  "studentIds": [1042, 1043, 1044],
  "type": "Placement",
  "message": "TCS is hiring — apply before May 20"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Notification sent to 3 students"
}
```

## Real-Time Notification Mechanism

I chose **Server-Sent Events (SSE)** for real-time delivery. Here's why:

- Our notification system is **unidirectional** — the server pushes to clients, clients don't send messages back through the same channel
- SSE works over standard HTTP, so no special infrastructure or proxy config is needed
- It has **built-in reconnection** — if the connection drops, the browser automatically reconnects
- It's simpler to implement than WebSockets for this particular use case
- It uses less server resources since there's no bidirectional handshake

The SSE endpoint would be:

`GET /api/v1/notifications/stream`

Each time a new notification is created, the backend pushes an event to all connected clients for that student.

```
event: notification
data: {"id": "abc-123", "type": "Placement", "message": "Google visiting campus"}
```

---

# Stage 2

## Database Choice: SQL (H2 for dev, production-ready with any RDBMS)

I went with an SQL relational database because:
- Notification data is highly structured (fixed columns like id, type, message, timestamp, read status) — perfect fit for relational tables
- ACID compliance means we won't lose notifications during concurrent writes
- For development and the exam demo, we use **H2 in-memory database** (zero setup, embedded in Spring Boot). For production, this schema is compatible with PostgreSQL, MySQL, or any SQL-compliant DB
- Good indexing support (B-tree, composite indexes) which we'll need for the query patterns in our APIs
- Spring Data JPA provides database-agnostic repository queries — switching from H2 to PostgreSQL requires only a config change

## Schema Design

```sql
-- Enum for notification types
-- In MySQL we handle this as an ENUM column

CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    student_id INT NOT NULL,
    type ENUM('Event', 'Result', 'Placement') NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Index for the most common query pattern (fetch unread for a student, sorted by time)
CREATE INDEX idx_student_read_time ON notifications(student_id, is_read, created_at DESC);

-- Index for type-based filtering
CREATE INDEX idx_type_time ON notifications(type, created_at DESC);
```

## Scaling Problems as Data Grows

When notifications go from thousands to millions, a few things will break down:

1. **Full table scans** — Without proper indexes, queries on 5M+ rows become unbearably slow
2. **Write contention** — Bulk inserts (like "Notify All" for 50K students) can lock the table
3. **Storage bloat** — Old read notifications pile up and slow down everything
4. **Sort operations** — ORDER BY on large result sets eats memory if there's no covering index

**Solutions:**
- **Composite indexes** — Already added above. These cover our WHERE + ORDER BY patterns
- **Table partitioning** — Partition notifications by month so queries only scan the relevant partition
- **Archival** — Move notifications older than 90 days to an archive table. Most students only care about recent ones anyway
- **Read replicas** — For heavy read loads, direct read queries to a replica

## SQL Queries for the REST APIs

**Fetch notifications with pagination and filter:**
```sql
SELECT id, type, message, is_read, created_at
FROM notifications
WHERE student_id = ?
  AND (type = ? OR ? IS NULL)
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

**Mark as read:**
```sql
UPDATE notifications SET is_read = TRUE
WHERE id = ? AND student_id = ?;
```

**Mark all as read:**
```sql
UPDATE notifications SET is_read = TRUE
WHERE student_id = ? AND is_read = FALSE;
```

**Get unread count:**
```sql
SELECT COUNT(*) AS unread_count
FROM notifications
WHERE student_id = ? AND is_read = FALSE;
```

---

# Stage 3

## Analyzing the Slow Query

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

### Is this query accurate?

Functionally yes — it pulls unread notifications for a specific student. But there are issues:

1. **`SELECT *`** — Fetches all columns including potentially large ones we don't display. Should select only needed columns
2. **`ORDER BY createdAt ASC`** — Shows oldest first. For a notification inbox, newest first (DESC) makes way more UX sense
3. **No LIMIT** — Returns ALL unread notifications. If a student has 500 unread, that's a massive response

### Why is it slow?

With 5,000,000 rows and no composite index on `(studentID, isRead, createdAt)`:

- The DB does a **full table scan** — checks every single row to match studentID = 1042
- Then filters for isRead = false
- Then performs an in-memory or on-disk **filesort** for the ORDER BY
- Time complexity is O(N) for scan + O(K log K) for sorting (where K = matching rows)

### What I'd Change

```sql
-- First, create a composite index that covers both the WHERE and ORDER BY
CREATE INDEX idx_student_unread_time
ON notifications(studentID, isRead, createdAt DESC);

-- Then rewrite the query
SELECT id, type, message, createdAt
FROM notifications
WHERE studentID = 1042 AND isRead = FALSE
ORDER BY createdAt DESC
LIMIT 20;
```

**Cost improvement:**
- Index lookup: O(log N) to find the starting point via B-tree
- No filesort needed — the index already stores rows in the right order
- LIMIT 20 means we stop after reading 20 rows from the index
- Goes from scanning millions of rows to touching maybe 20-50

### Should we add indexes on every column?

**No, that's terrible advice.** Here's why:

1. **Write performance tanks** — Every INSERT/UPDATE/DELETE now has to update ALL those indexes. For a notification system that does heavy writes (bulk notifications), this kills performance
2. **Wasted disk space** — Each index is essentially a copy of that column's data in a B-tree structure. Indexing everything could 2-3x your storage
3. **Query planner confusion** — MySQL's optimizer might pick the wrong index when too many are available, leading to worse plans than no index at all
4. **Maintenance overhead** — Index rebuilds during ALTER TABLE operations take forever on large tables

The right approach is to create **targeted composite indexes** based on actual query patterns.

### Query: Students who got placement notifications in last 7 days

```sql
SELECT DISTINCT s.id, s.name, s.email
FROM students s
INNER JOIN notifications n ON s.id = n.student_id
WHERE n.type = 'Placement'
  AND n.created_at >= NOW() - INTERVAL 7 DAY;
```

This runs efficiently with our `idx_type_time` index on `(type, created_at)`.

---

# Stage 4

## The Problem

Fetching notifications from the DB on every page load means if 10,000 students are online, that's 10,000 queries hitting MySQL every few seconds. The DB gets overwhelmed, response times spike, and users see a slow app.

## Solutions and Tradeoffs

### 1. Redis Caching (Recommended Primary Solution)

Cache each student's recent notifications and unread count in Redis.

**How it works:**
- On first load: query DB → store in Redis with a TTL of 5 minutes → return to client
- On subsequent loads: serve directly from Redis (sub-millisecond)
- When a new notification arrives: push to Redis list + increment unread counter + invalidate stale entries

| Pros | Cons |
|------|------|
| Reduces DB reads by ~90% | Extra infrastructure (Redis server) |
| Sub-millisecond response times | Cache invalidation logic can be tricky |
| Handles traffic spikes well | Data might be slightly stale (acceptable for notifications) |

### 2. Client-Side Caching + SSE Delta Updates

Store fetched notifications in React state/context. Use SSE to push only **new** notifications.

| Pros | Cons |
|------|------|
| Zero additional server load for repeat views | Complex sync logic on frontend |
| Instant page transitions | Data lost on tab close (unless using localStorage) |
| Good offline experience | Need to handle reconnection edge cases |

### 3. Smart Pagination + Lazy Loading

Instead of loading all notifications, load only the first 10. Load more on scroll.

| Pros | Cons |
|------|------|
| Small initial payload | Still hits DB every time |
| Better perceived performance | Doesn't solve the core DB load problem |
| Simple to implement | Not great alone — best combined with caching |

### 4. HTTP Caching Headers (ETags / Last-Modified)

Return proper cache headers so the browser and CDN can cache responses.

| Pros | Cons |
|------|------|
| No code changes on frontend | Only helps with identical repeat requests |
| Leverages existing HTTP infrastructure | Notifications change frequently so cache hit rate is low |

### My Recommendation

Use **Redis for server-side caching** + **SSE for real-time deltas** + **frontend pagination**. This combination handles the heavy load while keeping the UI responsive. Redis absorbs the read pressure, SSE eliminates polling, and pagination keeps payloads small.

---

# Stage 5

## Problems with the Original Pseudocode

```
function notify_all(student_ids, message):
    for student_id in student_ids:
        send_email(student_id, message)
        save_to_db(student_id, message)
        push_to_app(student_id, message)
```

1. **Completely synchronous** — Processing 50,000 students one by one. If each email takes 200ms, that's ~2.7 hours. The HR's browser will time out long before that.

2. **No error recovery** — When `send_email` fails for student #24,801, everything stops. Students 1-24,800 got emails, the rest didn't. You have no record of who succeeded and who failed.

3. **Tight coupling** — Email, DB, and push are all in the same loop. If the email service is down, nothing gets saved to DB either, which means students can't even see the notification in the app.

4. **No retry mechanism** — Failed emails are just... lost. No way to retry them later.

5. **Single point of failure** — If the server crashes mid-loop, you have partial delivery with no way to resume.

## What happens when 200 emails fail midway?

You're in a bad state. Some students got emails, some didn't. Some have DB entries, some don't. Your only option is to manually parse logs to figure out which students were processed. This is not production-ready.

## Should DB save and email happen together?

**Absolutely not.** They should be decoupled because:

- **DB write is fast and reliable** (internal, <5ms). Email is **slow and unreliable** (external API, 100-500ms, can fail).
- If you tie them together, a flaky email API prevents students from seeing notifications in the app
- They have different failure modes and should have independent retry strategies
- The student should see the notification in-app immediately, even if the email arrives 30 seconds later

## Redesigned Pseudocode

```python
# === PRODUCER (runs when HR clicks "Notify All") ===

function notify_all(student_ids: list, message: string, type: string):
    # Create a batch job record for tracking
    job = create_job(status="PENDING", total=len(student_ids))
    
    # Batch publish to message queue — returns immediately
    for batch in chunk(student_ids, size=500):
        events = [{"student_id": sid, "message": message, "type": type, "job_id": job.id} for sid in batch]
        message_queue.publish_batch(topic="notification_events", events)
    
    job.update(status="PROCESSING")
    
    # Return immediately to the HR — don't make them wait
    return {"job_id": job.id, "message": "Notifications are being sent"}


# === CONSUMER 1: Database Worker ===
# Processes events in batches for high throughput

function db_worker(events_batch: list):
    try:
        # Bulk insert — way faster than individual inserts
        bulk_insert_notifications(events_batch)
        log.info(f"Saved {len(events_batch)} notifications to DB")
    except Exception as e:
        # Send failed batch to Dead Letter Queue for retry
        message_queue.publish(topic="db_dlq", payload=events_batch)
        log.error(f"DB batch failed: {e}")


# === CONSUMER 2: Email Worker (multiple instances) ===
# Each event is processed independently for isolation

function email_worker(event):
    try:
        send_email(event.student_id, event.message)
        update_delivery_status(event.job_id, event.student_id, "EMAIL_SENT")
    except Exception as e:
        if event.retry_count < 3:
            event.retry_count += 1
            message_queue.publish(topic="email_retry", payload=event, delay="30s")
        else:
            message_queue.publish(topic="email_dlq", payload=event)
            log.error(f"Email permanently failed for student {event.student_id}")


# === CONSUMER 3: Push/SSE Worker ===

function push_worker(event):
    try:
        sse_manager.push(event.student_id, {
            "type": event.type,
            "message": event.message
        })
    except Exception:
        # Push failures are non-critical — student will see it on next page load
        log.warn(f"SSE push failed for student {event.student_id}")
```

Key improvements:
- **Async + parallel** — HR gets instant response, workers process in background
- **Independent channels** — DB, email, and push each have their own queue and failure handling
- **Retry with backoff** — Failed emails retry up to 3 times before going to a Dead Letter Queue
- **Batch processing** — DB inserts happen in batches of 500 for throughput
- **Idempotent** — Each event has a unique job_id + student_id combo, so retries don't create duplicates
- **Observable** — Job status can be tracked via the job record

---

# Stage 6

## Priority Inbox Approach

The priority inbox ranks notifications by **type weight** (Placement > Result > Event) and **recency** (newer is better).

**Weight assignment:**
- Placement = 3 (most important — career opportunity)
- Result = 2 (academic — important but not time-sensitive)
- Event = 1 (informational)

**Algorithm:**
I use a sorted insertion approach with a fixed-size array of N elements. When a new notification comes in:

1. Calculate its priority score
2. Find the correct insertion position in the sorted array (binary search or linear scan)
3. Insert and drop the lowest-priority item if array exceeds N

**Time complexity:**
- Initial sort of all notifications: O(M log M) where M is total notifications
- Maintaining top-N as new ones arrive: O(N) per insertion (since N is small like 10-20, this is effectively O(1))
- A min-heap could also work — O(log N) per insertion — but for N=10, the difference is negligible

The implementation is in `PriorityInbox.js`. It fetches from the provided API endpoint, sorts by weight + recency, and displays the top 10.
