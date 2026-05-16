<img width="2124" height="1120" alt="image" src="https://github.com/user-attachments/assets/0f67a371-3334-42c8-bf9a-c206548fdabf" />

# 🎓 Campus Notification System

A professional, full-stack application designed to manage and deliver campus-wide notifications efficiently. This system handles real-time delivery, intelligent priority ranking, and categorized filtering to ensure students never miss important updates regarding placements, academic results, and campus events.

## ✨ Key Features
-**Filter**:implmented loginFilter
- **Priority Inbox**: An intelligent ranking system that sorts notifications based on an algorithm combining **importance weight** (Placement > Result > Event) and **recency**.
- **Categorized Filtering**: Easily filter notifications by type (Placement, Result, Event) to focus on what matters most.
- **Real-Time State Management**: Tracks read/unread status, calculates unread counts dynamically, and allows one-click "Mark All as Read".
- **Vibrant Primary UI**: A beautifully polished, user-friendly React interface utilizing bold primary colors, subtle glassmorphism, and smooth micro-animations.
- **RESTful API Architecture**: A robust Spring Boot backend designed for scalability, complete with centralized logging middleware and structured database design.

## 🛠️ Technology Stack

**Frontend**
- React 18
- Material-UI (MUI) v5
- React Router DOM
- Axios

**Backend**
- Java 17
- Spring Boot 3.x
- Spring Data JPA
- H2 In-Memory Database (Prepared for MySQL/PostgreSQL migration)

## 🚀 Getting Started

### 1. Run the Backend (Spring Boot)
Navigate to the backend directory and start the server. It will run on `http://localhost:8080`.
```bash
cd campus-notification-system/backend
./mvnw spring-boot:run
```

### 2. Run the Frontend (React)
Navigate to the frontend directory, install dependencies, and start the development server. It will run on `http://localhost:3000`.
```bash
cd campus-notification-system/frontend
npm install
npm start
```

## 📐 System Architecture

The application is engineered for high-throughput and low-latency, employing caching and message queues to handle bulk notification loads (e.g., notifying 50,000 students at once) without locking the database or hanging the client interface.

```mermaid
graph TD
    Client["React Client Interface"]
    
    subgraph Backend ["Spring Boot Backend"]
        API["REST Controllers & Services"]
        SSE["Server-Sent Events Manager"]
        
        subgraph Async Processing
            Queue["Message Queue / Event Bus"]
            DB_Worker["Database Worker"]
            Email_Worker["Email Worker"]
            SSE_Worker["Push Worker"]
            DLQ["Dead Letter Queue"]
        end
    end
    
    subgraph Storage
        Redis[("Redis Cache")]
        DB[("H2 / Relational DB")]
    end
    
    Client <-->|"REST over HTTP"| API
    Client <..|"Real-time Deltas"| SSE
    
    API <-->|"High-speed Reads"| Redis
    API <-->|"Fallback Reads"| DB
    
    API -->|"Batch Publish 'Notify All'"| Queue
    
    Queue --> DB_Worker
    Queue --> Email_Worker
    Queue --> SSE_Worker
    
    DB_Worker -->|"Bulk Inserts"| DB
    DB_Worker -.->|"Retries / Failures"| DLQ
    
    Email_Worker -->|"Async Dispatch"| EmailAPI["External Email Provider"]
    Email_Worker -.->|"Permanent Fails"| DLQ
    
    SSE_Worker -->|"Trigger Push"| SSE
```

### Key Architectural Decisions

1. **Decoupled Writes via Message Queues**: The "Notify All" feature acts as a Producer. Instead of synchronously processing thousands of emails and database inserts, it immediately returns a job ID to the client while background consumers handle the heavy lifting.
2. **Redis Caching Strategy**: To prevent the database from being overwhelmed by thousands of concurrent users checking their inbox, recent notifications and unread counts are served directly from Redis.
3. **Server-Sent Events (SSE)**: Chosen over WebSockets for real-time delivery because notifications are unidirectional (Server → Client). SSE is lighter, runs over standard HTTP, and has built-in reconnection logic.
4. **Targeted Composite Indexing**: The database employs targeted B-Tree composite indexes like `idx_student_unread_time (studentId, isRead, createdAt DESC)` to transform heavy `ORDER BY` and `WHERE` clauses from full table scans into highly efficient O(log N) lookups.
5. **Fault Tolerance**: Worker failures (e.g., if the external email API goes down) are caught and routed to a Dead Letter Queue (DLQ) after 3 retries, ensuring no notifications are permanently lost without a trace.

### screenshots
<img width="2079" height="1097" alt="image" src="https://github.com/user-attachments/assets/0bb3fb09-10b7-4c6a-99a0-f6aec01b3cad" />
<img width="2107" height="1118" alt="image" src="https://github.com/user-attachments/assets/bfe1879a-2f8a-4d37-8a01-dcc323a88249" />
<img width="2089" height="1099" alt="image" src="https://github.com/user-attachments/assets/4cb205d8-45ef-449a-88b3-a2d4e579fb00" />



---
*Developed as a high-performance, production-ready full-stack assessment project.*
