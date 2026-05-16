# Stage 1

## Core Actions
1. **Fetch Notifications**: Retrieve a list of notifications for the logged-in user, supporting pagination and filtering.
2. **Mark as Read**: Update the status of a specific notification or all notifications to "read".
3. **Get Unread Count**: Retrieve the total number of unread notifications for a quick badge display.

## REST API Endpoints

### 1. Fetch Notifications
**Endpoint**: `GET /api/v1/notifications`
**Description**: Fetches notifications for the logged-in user.

**Headers**:
```json
{
  "Authorization": "Bearer <token>",
  "Accept": "application/json"
}
```

**Query Parameters**:
- `limit` (integer): Number of records per page.
- `page` (integer): Page number.
- `notification_type` (string): Filter by type ("Event", "Result", "Placement").
- `unread_only` (boolean): If true, returns only unread notifications.

**Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
      "type": "Result",
      "message": "mid-sem",
      "timestamp": "2026-04-22T17:51:30Z",
      "is_read": false
    }
  ],
  "meta": {
    "total_records": 100,
    "current_page": 1,
    "total_pages": 10
  }
}
```

### 2. Mark Notification as Read
**Endpoint**: `PATCH /api/v1/notifications/{id}/read`
**Description**: Marks a specific notification as read.

**Headers**:
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Notification marked as read."
}
```

### 3. Mark All Notifications as Read
**Endpoint**: `PATCH /api/v1/notifications/read-all`
**Description**: Marks all unread notifications for the user as read.

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "All notifications marked as read."
}
```

## Real-Time Notification Mechanism
To deliver real-time notifications to users, **Server-Sent Events (SSE)** or **WebSockets** should be used.
- **WebSockets** provide full-duplex communication and are ideal if the client also needs to send frequent high-volume messages to the server.
- **Server-Sent Events (SSE)** is a simpler, unidirectional mechanism (server to client) over HTTP. Since a notification platform primarily broadcasts updates from server to client, **SSE** is highly recommended here due to ease of scaling, built-in reconnection capabilities, and lower overhead compared to WebSockets.

---

# Stage 2

## Database Choice: PostgreSQL
**Reasoning**: 
PostgreSQL is an advanced, open-source relational database that perfectly fits this use case. Notifications usually have a structured schema (ID, UserID, Type, Message, Timestamp, ReadStatus). PostgreSQL offers strong ACID compliance ensuring no data anomalies. It also supports JSONB if we ever need to attach arbitrary unstructured metadata to notifications. Furthermore, indexing capabilities (B-tree, partial indexes) in PostgreSQL will effectively handle querying large numbers of unread notifications.

## Database Schema

```sql
CREATE TYPE notification_type_enum AS ENUM ('Event', 'Result', 'Placement');

CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type notification_type_enum NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Scaling and Volume Problems
**Problems**: 
As data volume increases to millions of rows, querying `is_read = false` will become slow. The table will suffer from bloat, and `ORDER BY created_at` will lead to heavy file sorting.
**Solutions**:
1. **Indexing**: Add a composite index on `(student_id, is_read, created_at)`.
2. **Partitioning**: Partition the `notifications` table by date/month (Time-based partitioning) so older notifications can be easily archived or dropped without affecting active queries.
3. **Archival**: Periodically move read notifications older than 30 days to cold storage or an OLAP DB.

## Queries based on REST APIs
**Fetch unread notifications with pagination**:
```sql
SELECT id, type, message, created_at, is_read 
FROM notifications 
WHERE student_id = 1042 AND is_read = false 
ORDER BY created_at DESC 
LIMIT 10 OFFSET 0;
```

**Mark as read**:
```sql
UPDATE notifications 
SET is_read = true 
WHERE id = 'd146095a-0d86-4a34-9e69-3900a14576bc' AND student_id = 1042;
```

---

# Stage 3

## Query Analysis
**The Query**:
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```
**Is it accurate?** 
Functionally, yes, it fetches unread notifications. However, notifications are typically displayed in descending order of time (newest first). `ASC` orders them oldest first, which is a poor UX.
**Why is it slow?** 
Without proper indexing, the database has to scan all 5,000,000 rows (Full Table Scan) to find rows matching `studentID = 1042` and `isRead = false`, and then perform an expensive sort operation in memory or on disk for `ORDER BY createdAt`.

## Proposed Changes & Cost
**Change**: Create a composite index to satisfy the WHERE clause and the ORDER BY clause simultaneously.
```sql
CREATE INDEX idx_student_unread_created 
ON notifications (studentID, isRead, createdAt DESC);
```
**Computation Cost**: With this index, the time complexity drops from O(N) or O(N log N) to O(log N) for the B-tree traversal. The DB can use an "Index Scan" and fetch the pre-sorted rows directly, skipping the sort phase entirely.

## Evaluating "Indexes on every column"
Adding an index to every column is **terrible advice**. 
**Why not?**: 
1. **Write Penalty**: Every INSERT, UPDATE, or DELETE requires updating all indexes, severely degrading write performance.
2. **Storage Overhead**: Indexes consume disk space. Indexing everything could double or triple the DB size.
3. **Optimizer Confusion**: The query optimizer might pick sub-optimal execution plans if there are too many overlapping individual indexes instead of one well-planned composite index.

## Optimized Query (Placement Notifications in Last 7 Days)
```sql
SELECT DISTINCT s.id, s.name, s.email 
FROM students s
JOIN notifications n ON s.id = n.student_id
WHERE n.type = 'Placement' 
  AND n.created_at >= NOW() - INTERVAL '7 days';
```
*(An index on `(type, created_at)` would make this extremely fast).*

---

# Stage 4

## Problem Solution: Caching & Pagination
Fetching notifications from the DB on every single page load overwhelms the DB. 
**Solution 1: In-Memory Caching (Redis/Memcached)**
Store the unread count and the first page of notifications for active users in a Redis cache. 
- **Read Flow**: UI requests notifications -> Backend checks Redis. If present, return immediately. If missing, query DB, store in Redis, and return.
- **Write Flow**: When a new notification is generated, push it to the user's Redis list and invalidate/update the unread count.

**Solution 2: Client-Side Caching & Local Storage**
The frontend can cache fetched notifications in Context/Redux or LocalStorage. On subsequent page loads, display cached data immediately and use a background API call or WebSocket to fetch only the *delta* (new notifications since last fetch).

## Tradeoffs
| Strategy | Pros | Cons |
| :--- | :--- | :--- |
| **Redis Caching** | Massively reduces DB read load. Fast response times (sub-millisecond). | Adds infrastructure complexity. Cache invalidation can be tricky (stale data). Extra memory cost. |
| **Client-Side Caching** | Zero server load for repeated views. Works offline or on poor networks. | Requires frontend logic to handle synchronization. Data might be slightly stale if WebSocket disconnects. |
| **Polling vs SSE** | Standard HTTP polling is easy to implement. | Polling wastes resources. SSE requires persistent connections which consume server memory. |

Recommendation: Implement **Redis caching** for the first 20 notifications + unread count, and use **SSE (Server-Sent Events)** to push deltas to the client, eliminating the need to poll on page reloads.

---

# Stage 5

## Shortcomings of the Pseudocode
1. **Synchronous & Blocking**: The loop processes one student at a time. For 50,000 students, if `send_email` takes 500ms, the whole loop will take 25,000 seconds (nearly 7 hours).
2. **Lack of Transactional Integrity / Rollbacks**: If `send_email` fails, `save_to_db` and `push_to_app` are skipped. If it crashes midway, there is no way to resume from the exact failure point without resending to already processed students.
3. **Tight Coupling**: The notification service is directly coupled to the Email API. If the Email API is down, the DB insert and App push also fail.

## Log Failure Scenario (200 failed midway)
Since the loop crashed, you have partial execution. You don't know exactly which of the 50,000 students received the email and which didn't unless you meticulously parse logs. 

## Redesign for Reliability & Speed
Use an **Asynchronous Message Broker (like RabbitMQ or Kafka)**. 
- **Publish**: The `notify_all` function instantly publishes 50,000 events to a message queue and returns immediately to the HR.
- **Subscribe/Consume**: Independent worker microservices consume these events concurrently. We can have separate queues for Email, DB, and Push.

## Should DB and Email happen together?
**No.** They should be decoupled. 
- **Why?**: The DB operation is fast and internal. The Email API is slow and external. If the external Email API throttles us or goes down, it shouldn't stop us from saving the notification in the DB so the user can see it in the app. They should be processed by separate, independent consumer workers with their own retry mechanisms.

## Revised Pseudocode
```python
# Producer (HR clicks Notify All)
function notify_all(student_ids: array, message: string, type: string):
    # Save a single bulk record in DB or schedule a batch job
    # to avoid 50,000 individual DB inserts blocking the UI
    job_id = create_bulk_notification_job(message, type)
    
    # Push lightweight events to a message broker (RabbitMQ/Kafka)
    for student_id in student_ids:
        event = { "student_id": student_id, "message": message, "job_id": job_id }
        message_broker.publish(topic="email_queue", payload=event)
        message_broker.publish(topic="db_queue", payload=event)
        message_broker.publish(topic="push_queue", payload=event)

# Consumer 1 (Email Worker - Can have 100s of instances)
function consume_email_queue(event):
    try:
        send_email(event.student_id, event.message)
    except Exception:
        # If it fails, send to a Dead Letter Queue (DLQ) for automatic retries
        message_broker.publish_to_dlq(topic="email_queue", payload=event)

# Consumer 2 (DB Worker)
function consume_db_queue(events_batch):
    # Process in batches of 1000 for high throughput
    bulk_save_to_db(events_batch)

# Consumer 3 (Push Worker)
function consume_push_queue(event):
    push_to_app_via_sse(event.student_id, event.message)
```

---

# Stage 6

## Priority Inbox Approach

To maintain the top 10 notifications efficiently as new ones arrive, we use a fixed-size sorted array of size 10 (or a min-heap). 

When a new notification is fetched or pushed via real-time events, we compare its priority score against the items in the list.

**Score Calculation**: 
We assign weights to types: `Placement` = 3, `Result` = 2, `Event` = 1. 
If weights are equal, the newer timestamp takes precedence. 

Since N is very small (10), doing a linear scan to insert into the sorted array takes `O(N)` time, which is effectively `O(1)`. Thus, maintaining the top 10 is highly efficient.

The code implementation can be found in `PriorityInbox.js`, which fetches notifications, applies these rules, and keeps only the top 10 records.
